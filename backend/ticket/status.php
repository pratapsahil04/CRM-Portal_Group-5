<?php
// backend/ticket/status.php
require_once __DIR__ . '/../config/db.php';

$user = authenticate();

// Only technicians and admins can update ticket status
if ($user['role'] !== 'technician' && $user['role'] !== 'admin') {
    sendResponse(['error' => 'Unauthorized access'], 403);
}

$input = getJSONInput();
$ticketId = isset($input['ticket_id']) ? (int)$input['ticket_id'] : 0;
$status = isset($input['status']) ? trim($input['status']) : '';

if (!$ticketId || !$status) {
    sendResponse(['error' => 'Ticket ID and status are required'], 400);
}

$allowedStatuses = ['open', 'in_progress', 'on_hold', 'resolved', 'closed'];
if (!in_array($status, $allowedStatuses)) {
    sendResponse(['error' => 'Invalid status value'], 400);
}

$db = getDBConnection();

try {
    // 1. Fetch ticket to check authorization and current status
    $tStmt = $db->prepare("SELECT ticket_id, status, customer_id, technician_id FROM TICKET WHERE ticket_id = ?");
    $tStmt->execute([$ticketId]);
    $ticket = $tStmt->fetch();

    if (!$ticket) {
        sendResponse(['error' => 'Ticket not found'], 404);
    }

    // A technician can only update their own assigned tickets
    if ($user['role'] === 'technician' && (int)$ticket['technician_id'] !== (int)$user['technician_id']) {
        sendResponse(['error' => 'You are not assigned to this ticket'], 403);
    }

    $db->beginTransaction();

    $oldStatus = $ticket['status'];
    
    // Update ticket status
    $upStmt = $db->prepare("UPDATE TICKET SET status = ? WHERE ticket_id = ?");
    $upStmt->execute([$status, $ticketId]);

    // Record status history if changed
    if ($oldStatus !== $status) {
        $hStmt = $db->prepare("
            INSERT INTO STATUS_HISTORY (ticket_id, old_status, new_status, changed_at)
            VALUES (?, ?, ?, NOW())
        ");
        $hStmt->execute([$ticketId, $oldStatus, $status]);
    }

    // If status transitioned to closed, make sure any associated work order status is synchronized
    if ($status === 'closed' || $status === 'resolved') {
        $woCheck = $db->prepare("SELECT work_order_id, status FROM WORK_ORDER WHERE ticket_id = ?");
        $woCheck->execute([$ticketId]);
        $wo = $woCheck->fetch();
        if ($wo && $wo['status'] !== 'completed') {
            $upWo = $db->prepare("UPDATE WORK_ORDER SET status = 'completed' WHERE work_order_id = ?");
            $upWo->execute([$wo['work_order_id']]);
        }
    }

    $db->commit();

    sendResponse([
        'message' => 'Ticket status updated successfully',
        'ticket_id' => $ticketId,
        'old_status' => $oldStatus,
        'new_status' => $status
    ]);

} catch (PDOException $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    sendResponse(['error' => 'Failed to update status: ' . $e->getMessage()], 500);
}
