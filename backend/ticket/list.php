<?php
// backend/ticket/list.php
require_once __DIR__ . '/../config/db.php';

$user = authenticate();

$db = getDBConnection();
$role = $user['role'];
$userId = $user['user_id'];

try {
    // Base query selecting ticket and related details
    $sql = "
        SELECT t.*, 
               v.make, v.model, v.license_plate,
               u_cust.name AS customer_name,
               u_tech.name AS technician_name,
               sla.response_deadline, sla.resolution_deadline, sla.breached AS sla_breached
        FROM TICKET t
        INNER JOIN CUSTOMER c ON t.customer_id = c.customer_id
        INNER JOIN USER u_cust ON c.user_id = u_cust.user_id
        INNER JOIN VEHICLE v ON t.vehicle_id = v.vehicle_id
        LEFT JOIN TECHNICIAN tech ON t.technician_id = tech.technician_id
        LEFT JOIN USER u_tech ON tech.user_id = u_tech.user_id
        LEFT JOIN SLA sla ON t.ticket_id = sla.ticket_id
    ";
    
    $params = [];
    $where = [];

    // Filter by role
    if ($role === 'customer') {
        $where[] = "t.customer_id = ?";
        $params[] = $user['customer_id'];
    } else if ($role === 'technician') {
        $where[] = "t.technician_id = ?";
        $params[] = $user['technician_id'];
    }

    // Optional query parameter filters
    if (isset($_GET['status']) && !empty($_GET['status'])) {
        $where[] = "t.status = ?";
        $params[] = $_GET['status'];
    }

    if (isset($_GET['priority']) && !empty($_GET['priority'])) {
        $where[] = "t.priority = ?";
        $params[] = $_GET['priority'];
    }

    if (!empty($where)) {
        $sql .= " WHERE " . implode(" AND ", $where);
    }

    $sql .= " ORDER BY t.created_at DESC";

    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $tickets = $stmt->fetchAll();

    // Check if any SLA is breached in real-time and mark it
    $now = date('Y-m-d H:i:s');
    foreach ($tickets as &$ticket) {
        if ($ticket['status'] !== 'resolved' && $ticket['status'] !== 'closed') {
            if ($ticket['resolution_deadline'] && $ticket['resolution_deadline'] < $now && $ticket['sla_breached'] == 0) {
                // Update breach status in DB
                $upStmt = $db->prepare("UPDATE SLA SET breached = 1 WHERE ticket_id = ?");
                $upStmt->execute([$ticket['ticket_id']]);
                $ticket['sla_breached'] = 1;
            }
        }
    }

    sendResponse($tickets);

} catch (PDOException $e) {
    sendResponse(['error' => 'Failed to retrieve tickets: ' . $e->getMessage()], 500);
}
