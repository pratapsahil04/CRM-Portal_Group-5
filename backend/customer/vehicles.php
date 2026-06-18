<?php
// backend/customer/vehicles.php
require_once __DIR__ . '/../config/db.php';

$user = authenticate();

// Only customers can manage their own vehicles here (admins can use admin endpoints)
if ($user['role'] !== 'customer') {
    sendResponse(['error' => 'Only customers can access this endpoint'], 403);
}

$customerId = $user['customer_id'];
$db = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];

// Helper function to calculate vehicle health score
function calculateAndSyncHealthScore($db, $vehicleId, $mileage, $year, $telemetry) {
    $score = 100;
    
    // 1. Unresolved Ticket Penalties
    $tStmt = $db->prepare("SELECT priority FROM TICKET WHERE vehicle_id = ? AND status NOT IN ('resolved', 'closed')");
    $tStmt->execute([$vehicleId]);
    $activeTickets = $tStmt->fetchAll();
    foreach ($activeTickets as $ticket) {
        $priority = strtolower($ticket['priority']);
        if ($priority === 'critical') {
            $score -= 30;
        } elseif ($priority === 'high') {
            $score -= 25;
        } elseif ($priority === 'medium') {
            $score -= 15;
        } elseif ($priority === 'low') {
            $score -= 5;
        }
    }
    
    // 2. Telemetry DTC Code Penalties
    $dtc = null;
    if (!empty($telemetry)) {
        $dtc = $telemetry[0]['dtc_code'];
    }
    if (!empty($dtc)) {
        if (strpos($dtc, 'P03') === 0) {
            $score -= 30; // Misfire/ignition
        } elseif (strpos($dtc, 'P04') === 0) {
            $score -= 20; // Emissions
        } else {
            $score -= 15; // General DTC
        }
    }
    
    // 3. Mileage Penalty
    $mileagePenalty = floor($mileage / 15000) * 5;
    if ($mileagePenalty > 30) {
        $mileagePenalty = 30;
    }
    $score -= $mileagePenalty;
    
    // 4. Age Penalty
    $currentYear = (int)date('Y');
    $age = max(0, $currentYear - (int)$year);
    $agePenalty = $age * 2;
    if ($agePenalty > 20) {
        $agePenalty = 20;
    }
    $score -= $agePenalty;
    
    // Clamp score to [0, 100]
    $finalScore = max(0, min(100, $score));
    
    // Update DB
    $upd = $db->prepare("UPDATE VEHICLE SET health_score = ? WHERE vehicle_id = ?");
    $upd->execute([$finalScore, $vehicleId]);
    
    return $finalScore;
}

if ($method === 'GET') {
    try {
        // List vehicles with warranty and insurance (excluding totaled and customer-deleted ones)
        $stmt = $db->prepare("
            SELECT v.*, 
                   w.provider AS warranty_provider, w.expiry_date AS warranty_expiry,
                   i.provider AS insurance_provider, i.renewal_date AS insurance_renewal
            FROM VEHICLE v
            LEFT JOIN WARRANTY w ON v.vehicle_id = w.vehicle_id
            LEFT JOIN INSURANCE i ON v.vehicle_id = i.vehicle_id
            WHERE v.customer_id = ? AND v.status NOT IN ('totaled', 'deleted')
        ");
        $stmt->execute([$customerId]);
        $vehicles = $stmt->fetchAll();
        
        // Fetch diagnostic telemetry and compute live health score for each vehicle
        foreach ($vehicles as &$vehicle) {
            $tStmt = $db->prepare("SELECT * FROM VEHICLE_TELEMETRY WHERE vehicle_id = ? ORDER BY timestamp DESC LIMIT 5");
            $tStmt->execute([$vehicle['vehicle_id']]);
            $vehicle['telemetry'] = $tStmt->fetchAll();
            
            // Calculate and synchronize live health score
            $vehicle['health_score'] = calculateAndSyncHealthScore(
                $db, 
                $vehicle['vehicle_id'], 
                $vehicle['mileage'], 
                $vehicle['year'], 
                $vehicle['telemetry']
            );
        }
        
        sendResponse($vehicles);
    } catch (PDOException $e) {
        sendResponse(['error' => 'Failed to retrieve vehicles: ' . $e->getMessage()], 500);
    }
} 

elseif ($method === 'POST') {
    $input = getJSONInput();
    $vin = isset($input['vin']) ? strtoupper(trim($input['vin'])) : '';
    $license_plate = isset($input['license_plate']) ? strtoupper(trim($input['license_plate'])) : '';
    $make = isset($input['make']) ? trim($input['make']) : '';
    $model = isset($input['model']) ? trim($input['model']) : '';
    $year = isset($input['year']) ? (int)$input['year'] : 0;
    $mileage = isset($input['mileage']) ? (int)$input['mileage'] : 0;
    
    // Optional Warranty/Insurance fields
    $warranty_provider = isset($input['warranty_provider']) ? trim($input['warranty_provider']) : '';
    $warranty_expiry = isset($input['warranty_expiry']) ? trim($input['warranty_expiry']) : '';
    $insurance_provider = isset($input['insurance_provider']) ? trim($input['insurance_provider']) : '';
    $insurance_renewal = isset($input['insurance_renewal']) ? trim($input['insurance_renewal']) : '';

    // Validations
    if (empty($vin) || empty($license_plate) || empty($make) || empty($model) || !$year) {
        sendResponse(['error' => 'All basic vehicle fields (VIN, License Plate, Make, Model, Year) are required'], 400);
    }

    // VIN: 17 alphanumeric, no I, O, Q
    if (!preg_match('/^[A-HJ-NPR-Z0-9]{17}$/', $vin)) {
        sendResponse(['error' => 'VIN must be exactly 17 characters and contain only uppercase letters and numbers (excluding I, O, Q)'], 400);
    }

    // License Plate: 1-10 alphanumeric, space, hyphen
    if (!preg_match('/^[A-Z0-9 \-]{1,10}$/', $license_plate)) {
        sendResponse(['error' => 'License plate must be 1 to 10 characters (alphanumeric, spaces, or hyphens)'], 400);
    }

    if ($year < 1885 || $year > (int)date('Y') + 2) {
        sendResponse(['error' => 'Invalid vehicle manufacturing year'], 400);
    }

    try {
        // Start transaction
        $db->beginTransaction();

        // Check if VIN already exists
        $chkStmt = $db->prepare("SELECT vehicle_id, status FROM VEHICLE WHERE vin = ?");
        $chkStmt->execute([$vin]);
        $existing = $chkStmt->fetch();
        
        if ($existing) {
            // If the vehicle was soft-deleted, we can reactivate it and re-assign to this customer
            if ($existing['status'] === 'deleted') {
                $updStmt = $db->prepare("
                    UPDATE VEHICLE 
                    SET customer_id = ?, license_plate = ?, make = ?, model = ?, year = ?, mileage = ?, status = 'active', health_score = 100
                    WHERE vehicle_id = ?
                ");
                $updStmt->execute([$customerId, $license_plate, $make, $model, $year, $mileage, $existing['vehicle_id']]);
                
                // Also clean up old warranty/insurance if they exist
                $db->prepare("DELETE FROM WARRANTY WHERE vehicle_id = ?")->execute([$existing['vehicle_id']]);
                $db->prepare("DELETE FROM INSURANCE WHERE vehicle_id = ?")->execute([$existing['vehicle_id']]);
                
                $vehicleId = $existing['vehicle_id'];
            } else {
                sendResponse(['error' => 'A vehicle with this VIN already exists in the system'], 409);
            }
        } else {
            // Insert Vehicle
            $vStmt = $db->prepare("
                INSERT INTO VEHICLE (customer_id, vin, license_plate, make, model, year, mileage, health_score, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, 100, 'active')
            ");
            $vStmt->execute([$customerId, $vin, $license_plate, $make, $model, $year, $mileage]);
            $vehicleId = $db->lastInsertId();
        }

        // Insert Warranty if provided
        if (!empty($warranty_provider) && !empty($warranty_expiry)) {
            // Check that date is future
            if (strtotime($warranty_expiry) < time()) {
                $warranty_expiry = date('Y-m-d', strtotime('+1 year')); // fallback to avoid constraint breach
            }
            $wStmt = $db->prepare("INSERT INTO WARRANTY (vehicle_id, provider, expiry_date) VALUES (?, ?, ?)");
            $wStmt->execute([$vehicleId, $warranty_provider, $warranty_expiry]);
        }

        // Insert Insurance if provided
        if (!empty($insurance_provider) && !empty($insurance_renewal)) {
            if (strtotime($insurance_renewal) < time()) {
                $insurance_renewal = date('Y-m-d', strtotime('+1 year')); // fallback to avoid constraint breach
            }
            $iStmt = $db->prepare("INSERT INTO INSURANCE (vehicle_id, provider, renewal_date) VALUES (?, ?, ?)");
            $iStmt->execute([$vehicleId, $insurance_provider, $insurance_renewal]);
        }

        // Add initial telemetry record if brand new or missing
        $telCheck = $db->prepare("SELECT telemetry_id FROM VEHICLE_TELEMETRY WHERE vehicle_id = ?");
        $telCheck->execute([$vehicleId]);
        if (!$telCheck->fetch()) {
            $tStmt = $db->prepare("INSERT INTO VEHICLE_TELEMETRY (vehicle_id, timestamp, battery_health, fuel_efficiency, dtc_code) VALUES (?, NOW(), 100.0, 15.0, NULL)");
            $tStmt->execute([$vehicleId]);
        }

        $db->commit();

        sendResponse(['message' => 'Vehicle registered successfully', 'vehicle_id' => (int)$vehicleId], 201);

    } catch (PDOException $e) {
        if ($db->inTransaction()) {
            $db->rollBack();
        }
        sendResponse(['error' => 'Failed to register vehicle: ' . $e->getMessage()], 500);
    }
} 

elseif ($method === 'DELETE') {
    // Soft delete vehicle: sets status to 'deleted' so it is hidden from customer but kept for logs.
    $input = getJSONInput();
    $vehicleId = isset($_GET['vehicle_id']) ? (int)$_GET['vehicle_id'] : (isset($input['vehicle_id']) ? (int)$input['vehicle_id'] : 0);

    if (!$vehicleId) {
        sendResponse(['error' => 'Vehicle ID is required'], 400);
    }

    try {
        // Verify ownership
        $chkStmt = $db->prepare("SELECT vehicle_id FROM VEHICLE WHERE vehicle_id = ? AND customer_id = ?");
        $chkStmt->execute([$vehicleId, $customerId]);
        if (!$chkStmt->fetch()) {
            sendResponse(['error' => 'Invalid Vehicle ID or vehicle does not belong to you'], 403);
        }

        // Soft delete the vehicle: update status to 'deleted'
        $stmt = $db->prepare("UPDATE VEHICLE SET status = 'deleted' WHERE vehicle_id = ?");
        $stmt->execute([$vehicleId]);

        sendResponse(['message' => 'Vehicle deleted from your fleet successfully']);
    } catch (PDOException $e) {
        sendResponse(['error' => 'Failed to delete vehicle: ' . $e->getMessage()], 500);
    }
} 

else {
    sendResponse(['error' => 'Method not allowed'], 450);
}
