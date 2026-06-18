<?php
// backend/ticket/assign.php
require_once __DIR__ . '/../config/db.php';

$user = authenticate();

if ($user['role'] !== 'admin') {
    sendResponse(['error' => 'Only admins can assign technicians'], 403);
}

$input = getJSONInput();
$ticketId = isset($input['ticket_id']) ? (int)$input['ticket_id'] : 0;
$technicianId = isset($input['technician_id']) ? (int)$input['technician_id'] : 0;

if (!$ticketId || !$technicianId) {
    sendResponse(['error' => 'Ticket ID and Technician ID are required'], 400);
}

$db = getDBConnection();

try {
    // 1. Verify ticket exists
    $tStmt = $db->prepare("SELECT ticket_id, status, technician_id FROM TICKET WHERE ticket_id = ?");
    $tStmt->execute([$ticketId]);
    $ticket = $tStmt->fetch();
    
    if (!$ticket) {
        sendResponse(['error' => 'Ticket not found'], 404);
    }

    // 2. Verify technician exists
    $techStmt = $db->prepare("SELECT technician_id FROM TECHNICIAN WHERE technician_id = ?");
    $techStmt->execute([$technicianId]);
    if (!$techStmt->fetch()) {
        sendResponse(['error' => 'Technician not found'], 404);
    }

    $db->beginTransaction();

    $oldStatus = $ticket['status'];
    $newStatus = $oldStatus;
    
    // Automatically transition to 'in_progress' if currently 'open'
    if ($oldStatus === 'open') {
        $newStatus = 'in_progress';
    }

    // Update ticket
    $upStmt = $db->prepare("
        UPDATE TICKET 
        SET technician_id = ?, status = ?
        WHERE ticket_id = ?
    ");
    $upStmt->execute([$technicianId, $newStatus, $ticketId]);

    // Log status history if changed
    if ($oldStatus !== $newStatus) {
        $hStmt = $db->prepare("
            INSERT INTO STATUS_HISTORY (ticket_id, old_status, new_status, changed_at)
            VALUES (?, ?, ?, NOW())
        ");
        $hStmt->execute([$ticketId, $oldStatus, $newStatus]);
    }

    // Check if a work order already exists for this ticket, if not, automatically create one!
    // Since the technician is assigned, we can initialize a WORK_ORDER so the technician can immediately log parts and complete work.
    $woCheck = $db->prepare("SELECT work_order_id FROM WORK_ORDER WHERE ticket_id = ?");
    $woCheck->execute([$ticketId]);
    if (!$woCheck->fetch()) {
        $woStmt = $db->prepare("
            INSERT INTO WORK_ORDER (ticket_id, technician_id, estimated_cost, actual_cost, status)
            VALUES (?, ?, 0.00, NULL, 'pending')
        ");
        $woStmt->execute([$ticketId, $technicianId]);
    }

    $db->commit();

    sendResponse([
        'message' => 'Technician assigned successfully',
        'ticket_id' => $ticketId,
        'technician_id' => $technicianId,
        'status' => $newStatus
    ]);

} catch (PDOException $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    sendResponse(['error' => 'Assignment failed: ' . $e->getMessage()], 500);
}
