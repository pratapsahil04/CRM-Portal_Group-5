<?php
// backend/reports/dashboard.php
require_once __DIR__ . '/../config/db.php';

$user = authenticate();

if ($user['role'] !== 'admin' && $user['role'] !== 'technician') {
    sendResponse(['error' => 'Unauthorized access'], 403);
}

$db = getDBConnection();

try {
    $stats = [];

    // 1. Ticket Status Breakdown
    $statusStmt = $db->query("SELECT status, COUNT(*) as count FROM TICKET GROUP BY status");
    $stats['status_breakdown'] = $statusStmt->fetchAll();

    // 2. Ticket Priority Breakdown
    $priorityStmt = $db->query("SELECT priority, COUNT(*) as count FROM TICKET GROUP BY priority");
    $stats['priority_breakdown'] = $priorityStmt->fetchAll();

    // 3. Revenue Metrics
    $revStmt = $db->query("SELECT SUM(actual_cost) as total_revenue, COUNT(*) as completed_jobs FROM WORK_ORDER WHERE status = 'completed'");
    $rev = $revStmt->fetch();
    $stats['revenue'] = [
        'total_revenue' => (float)($rev['total_revenue'] ?? 0.00),
        'completed_jobs' => (int)($rev['completed_jobs'] ?? 0)
    ];

    // 4. Low Stock Inventory Items
    // quantity <= minimum_quantity
    $stockStmt = $db->query("
        SELECT item_id, part_number, name, quantity, minimum_quantity 
        FROM INVENTORY_ITEM 
        WHERE quantity <= minimum_quantity
    ");
    $stats['low_stock_items'] = $stockStmt->fetchAll();

    // 5. Technician Performance
    $techStmt = $db->query("
        SELECT t.technician_id, u.name, t.specialization, t.rating,
               (SELECT COUNT(*) FROM TICKET WHERE technician_id = t.technician_id AND status IN ('open','in_progress','on_hold')) as active_jobs
        FROM TECHNICIAN t
        INNER JOIN USER u ON t.user_id = u.user_id
    ");
    $stats['technician_performance'] = $techStmt->fetchAll();

    // 6. SLA Tracking
    // Fetch all active tickets with SLA info to calculate real-time SLA metrics
    $slaStmt = $db->query("
        SELECT t.ticket_id, t.title, t.priority, t.status, t.created_at,
               sla.response_deadline, sla.resolution_deadline, sla.breached
        FROM TICKET t
        INNER JOIN SLA sla ON t.ticket_id = sla.ticket_id
        WHERE t.status IN ('open', 'in_progress', 'on_hold')
    ");
    $activeSlas = $slaStmt->fetchAll();
    
    $breachedCount = 0;
    $nearBreachCount = 0;
    $nearBreachDetails = [];
    
    $now = time();
    
    foreach ($activeSlas as $row) {
        $createdAt = strtotime($row['created_at']);
        $resolutionDeadline = strtotime($row['resolution_deadline']);
        
        if ($resolutionDeadline < $now) {
            $breachedCount++;
        } else {
            // Calculate % SLA consumed
            $totalSlaTime = $resolutionDeadline - $createdAt;
            if ($totalSlaTime > 0) {
                $elapsedTime = $now - $createdAt;
                $pctConsumed = ($elapsedTime / $totalSlaTime) * 100;
                
                if ($pctConsumed >= 80.0) {
                    $nearBreachCount++;
                    $nearBreachDetails[] = [
                        'ticket_id' => (int)$row['ticket_id'],
                        'title' => $row['title'],
                        'priority' => $row['priority'],
                        'pct_consumed' => round($pctConsumed, 1),
                        'time_left' => round(($resolutionDeadline - $now) / 3600, 1) . ' hours'
                    ];
                }
            }
        }
    }

    $stats['sla_metrics'] = [
        'total_active' => count($activeSlas),
        'breached_count' => $breachedCount,
        'near_breach_count' => $nearBreachCount,
        'near_breach_tickets' => $nearBreachDetails
    ];

    // 7. Recent Service Logs
    $logStmt = $db->query("
        SELECT l.*, v.make, v.model, v.license_plate
        FROM SERVICE_LOG l
        INNER JOIN VEHICLE v ON l.vehicle_id = v.vehicle_id
        ORDER BY l.performed_date DESC
        LIMIT 5
    ");
    $stats['recent_logs'] = $logStmt->fetchAll();

    sendResponse($stats);

} catch (PDOException $e) {
    sendResponse(['error' => 'Failed to generate report: ' . $e->getMessage()], 500);
}
