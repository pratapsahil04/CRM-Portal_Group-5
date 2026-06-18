<?php
// backend/ticket/details.php
require_once __DIR__ . '/../config/db.php';

$user = authenticate();
$ticketId = isset($_GET['ticket_id']) ? (int)$_GET['ticket_id'] : 0;

if (!$ticketId) {
    sendResponse(['error' => 'Ticket ID is required'], 400);
}

$db = getDBConnection();

try {
    // 1. Fetch Ticket details
    $tStmt = $db->prepare("
        SELECT t.*, 
               v.make, v.model, v.year, v.license_plate, v.vin, v.mileage, v.health_score,
               u_cust.name AS customer_name, u_cust.email AS customer_email, u_cust.phone AS customer_phone,
               c.membership_tier, c.loyalty_points,
               u_tech.name AS technician_name, tech.specialization, tech.rating AS technician_rating,
               sla.response_deadline, sla.resolution_deadline, sla.breached AS sla_breached
        FROM TICKET t
        INNER JOIN CUSTOMER c ON t.customer_id = c.customer_id
        INNER JOIN USER u_cust ON c.user_id = u_cust.user_id
        INNER JOIN VEHICLE v ON t.vehicle_id = v.vehicle_id
        LEFT JOIN TECHNICIAN tech ON t.technician_id = tech.technician_id
        LEFT JOIN USER u_tech ON tech.user_id = u_tech.user_id
        LEFT JOIN SLA sla ON t.ticket_id = sla.ticket_id
        WHERE t.ticket_id = ?
    ");
    $tStmt->execute([$ticketId]);
    $ticket = $tStmt->fetch();

    if (!$ticket) {
        sendResponse(['error' => 'Ticket not found'], 404);
    }

    // Role-based Access Control
    if ($user['role'] === 'customer' && (int)$ticket['customer_id'] !== $user['customer_id']) {
        sendResponse(['error' => 'You do not have access to this ticket'], 403);
    }
    if ($user['role'] === 'technician' && (int)$ticket['technician_id'] !== $user['technician_id']) {
        sendResponse(['error' => 'You are not assigned to this ticket'], 403);
    }

    // 2. Fetch Status History
    $hStmt = $db->prepare("SELECT * FROM STATUS_HISTORY WHERE ticket_id = ? ORDER BY changed_at ASC");
    $hStmt->execute([$ticketId]);
    $ticket['status_history'] = $hStmt->fetchAll();

    // 3. Fetch Work Order (if exists)
    $wStmt = $db->prepare("SELECT * FROM WORK_ORDER WHERE ticket_id = ?");
    $wStmt->execute([$ticketId]);
    $workOrder = $wStmt->fetch();

    if ($workOrder) {
        // Fetch parts used in this work order
        $pStmt = $db->prepare("
            SELECT pu.*, item.name, item.part_number, item.quantity AS current_stock
            FROM PARTS_USED pu
            INNER JOIN INVENTORY_ITEM item ON pu.inventory_item_id = item.item_id
            WHERE pu.work_order_id = ?
        ");
        $pStmt->execute([$workOrder['work_order_id']]);
        $workOrder['parts_used'] = $pStmt->fetchAll();

        // Fetch service log (if exists)
        $sStmt = $db->prepare("SELECT * FROM SERVICE_LOG WHERE work_order_id = ?");
        $sStmt->execute([$workOrder['work_order_id']]);
        $workOrder['service_log'] = $sStmt->fetch();

        $ticket['work_order'] = $workOrder;
    } else {
        $ticket['work_order'] = null;
    }

    // 4. Fetch Conversation & Messages
    $cStmt = $db->prepare("SELECT conversation_id FROM CONVERSATION WHERE ticket_id = ?");
    $cStmt->execute([$ticketId]);
    $conv = $cStmt->fetch();

    if ($conv) {
        $convId = $conv['conversation_id'];
        $mStmt = $db->prepare("
            SELECT m.*, u.name AS sender_name, u.role AS sender_role
            FROM MESSAGE m
            INNER JOIN USER u ON m.sender_id = u.user_id
            WHERE m.conversation_id = ?
            ORDER BY m.created_at ASC
        ");
        $mStmt->execute([$convId]);
        $messages = $mStmt->fetchAll();

        // Fetch attachments for messages
        foreach ($messages as &$msg) {
            $aStmt = $db->prepare("SELECT * FROM ATTACHMENT WHERE message_id = ?");
            $aStmt->execute([$msg['message_id']]);
            $msg['attachments'] = $aStmt->fetchAll();
        }

        $ticket['conversation'] = [
            'conversation_id' => $convId,
            'messages' => $messages
        ];
    } else {
        $ticket['conversation'] = null;
    }

    sendResponse($ticket);

} catch (PDOException $e) {
    sendResponse(['error' => 'Failed to retrieve ticket details: ' . $e->getMessage()], 500);
}
