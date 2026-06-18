<?php
// backend/ticket/create.php
require_once __DIR__ . '/../config/db.php';

$user = authenticate();

if ($user['role'] !== 'customer') {
    sendResponse(['error' => 'Only customers can create tickets directly'], 403);
}

$customerId = $user['customer_id'];
$input = getJSONInput();
$vehicleId = isset($input['vehicle_id']) ? (int)$input['vehicle_id'] : 0;
$title = isset($input['title']) ? trim($input['title']) : '';
$category = isset($input['category']) ? trim($input['category']) : '';
$priority = isset($input['priority']) ? trim($input['priority']) : 'medium'; // low, medium, high, critical

if (empty($title) || empty($category) || !$vehicleId) {
    sendResponse(['error' => 'Vehicle ID, Title, and Category are required'], 400);
}

// Allowed priorities
$allowedPriorities = ['low', 'medium', 'high', 'critical'];
if (!in_array($priority, $allowedPriorities)) {
    $priority = 'medium';
}

$db = getDBConnection();

try {
    // 1. Verify vehicle belongs to customer
    $vStmt = $db->prepare("SELECT vehicle_id FROM VEHICLE WHERE vehicle_id = ? AND customer_id = ?");
    $vStmt->execute([$vehicleId, $customerId]);
    if (!$vStmt->fetch()) {
        sendResponse(['error' => 'Invalid Vehicle ID or vehicle does not belong to you'], 403);
    }

    $db->beginTransaction();

    // 2. Insert Ticket
    $tStmt = $db->prepare("
        INSERT INTO TICKET (customer_id, vehicle_id, technician_id, title, category, priority, status, created_at)
        VALUES (?, ?, NULL, ?, ?, ?, 'open', NOW())
    ");
    $tStmt->execute([$customerId, $vehicleId, $title, $category, $priority]);
    $ticketId = $db->lastInsertId();

    // 3. Calculate SLA Deadlines
    // Response Deadlines
    // Critical = 1 Hour, High = 4 Hours, Medium = 24 Hours, Low = 72 Hours
    // Resolution Deadlines
    // Critical = 24 Hours, High = 72 Hours, Medium = 7 Days, Low = 14 Days
    $responseInterval = '';
    $resolutionInterval = '';
    
    switch ($priority) {
        case 'critical':
            $responseInterval = '+1 hour';
            $resolutionInterval = '+24 hours';
            break;
        case 'high':
            $responseInterval = '+4 hours';
            $resolutionInterval = '+72 hours'; // 3 days
            break;
        case 'medium':
            $responseInterval = '+24 hours';
            $resolutionInterval = '+7 days';
            break;
        case 'low':
        default:
            $responseInterval = '+72 hours'; // 3 days
            $resolutionInterval = '+14 days';
            break;
    }

    $responseDeadline = date('Y-m-d H:i:s', strtotime($responseInterval));
    $resolutionDeadline = date('Y-m-d H:i:s', strtotime($resolutionInterval));

    // Insert SLA
    $sStmt = $db->prepare("
        INSERT INTO SLA (ticket_id, response_deadline, resolution_deadline, breached)
        VALUES (?, ?, ?, 0)
    ");
    $sStmt->execute([$ticketId, $responseDeadline, $resolutionDeadline]);

    // 4. Create Conversation
    $cStmt = $db->prepare("
        INSERT INTO CONVERSATION (ticket_id, customer_id, agent_id)
        VALUES (?, ?, NULL)
    ");
    $cStmt->execute([$ticketId, $customerId]);

    $db->commit();

    sendResponse([
        'message' => 'Ticket created successfully',
        'ticket_id' => (int)$ticketId,
        'response_deadline' => $responseDeadline,
        'resolution_deadline' => $resolutionDeadline
    ], 201);

} catch (PDOException $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    sendResponse(['error' => 'Failed to create ticket: ' . $e->getMessage()], 500);
}
