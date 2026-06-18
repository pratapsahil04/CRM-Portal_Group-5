<?php
// backend/inventory/parts.php
require_once __DIR__ . '/../config/db.php';

$user = authenticate();

// Technicians and Admins can view and manage inventory
if ($user['role'] !== 'technician' && $user['role'] !== 'admin') {
    sendResponse(['error' => 'Unauthorized access'], 403);
}

$db = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        $stmt = $db->query("
            SELECT item.*, sup.name AS supplier_name 
            FROM INVENTORY_ITEM item
            INNER JOIN SUPPLIER sup ON item.supplier_id = sup.supplier_id
            ORDER BY item.name ASC
        ");
        $items = $stmt->fetchAll();
        
        // Add flags for low stock alert
        foreach ($items as &$item) {
            $item['low_stock'] = ($item['quantity'] <= $item['minimum_quantity']);
        }
        
        sendResponse($items);
    } catch (PDOException $e) {
        sendResponse(['error' => 'Failed to retrieve parts: ' . $e->getMessage()], 500);
    }
} 

elseif ($method === 'POST') {
    $input = getJSONInput();
    $supplierId = isset($input['supplier_id']) ? (int)$input['supplier_id'] : 0;
    $partNumber = isset($input['part_number']) ? strtoupper(trim($input['part_number'])) : '';
    $name = isset($input['name']) ? trim($input['name']) : '';
    $quantity = isset($input['quantity']) ? (int)$input['quantity'] : 0;
    $minimumQuantity = isset($input['minimum_quantity']) ? (int)$input['minimum_quantity'] : 0;

    if (!$supplierId || empty($partNumber) || empty($name)) {
        sendResponse(['error' => 'Supplier, Part Number, and Name are required'], 400);
    }

    // Part number format: Alphanumeric and hyphens only
    if (!preg_match('/^[A-Z0-9\-]{1,100}$/', $partNumber)) {
        sendResponse(['error' => 'Part number must contain only uppercase alphanumeric characters and hyphens'], 400);
    }

    if ($quantity < 0 || $minimumQuantity < 0) {
        sendResponse(['error' => 'Quantities cannot be negative'], 400);
    }

    // Enforce DB constraint: current stock must be at least minimum stock
    if ($quantity < $minimumQuantity) {
        sendResponse(['error' => 'Current quantity cannot be less than the minimum stock threshold (DB constraint rule)'], 400);
    }

    try {
        // Check if supplier exists
        $sStmt = $db->prepare("SELECT supplier_id FROM SUPPLIER WHERE supplier_id = ?");
        $sStmt->execute([$supplierId]);
        if (!$sStmt->fetch()) {
            sendResponse(['error' => 'Supplier not found'], 404);
        }

        // Check if part number already exists (if so, we will update the quantity)
        $chk = $db->prepare("SELECT item_id, quantity FROM INVENTORY_ITEM WHERE part_number = ?");
        $chk->execute([$partNumber]);
        $existing = $chk->fetch();

        if ($existing) {
            // Update quantity
            $newQty = $existing['quantity'] + $quantity;
            $upStmt = $db->prepare("UPDATE INVENTORY_ITEM SET quantity = ? WHERE item_id = ?");
            $upStmt->execute([$newQty, $existing['item_id']]);
            sendResponse(['message' => 'Part restocked successfully', 'item_id' => (int)$existing['item_id'], 'new_quantity' => $newQty]);
        } else {
            // Insert new part
            $insStmt = $db->prepare("
                INSERT INTO INVENTORY_ITEM (supplier_id, part_number, name, quantity, minimum_quantity)
                VALUES (?, ?, ?, ?, ?)
            ");
            $insStmt->execute([$supplierId, $partNumber, $name, $quantity, $minimumQuantity]);
            $itemId = $db->lastInsertId();
            sendResponse(['message' => 'Part registered successfully', 'item_id' => (int)$itemId], 201);
        }

    } catch (PDOException $e) {
        sendResponse(['error' => 'Failed to manage part: ' . $e->getMessage()], 500);
    }
} else {
    sendResponse(['error' => 'Method not allowed'], 450);
}
