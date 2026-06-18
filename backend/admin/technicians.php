<?php
// backend/admin/technicians.php — Admin-only: list all technicians
require_once __DIR__ . '/../config/db.php';

$admin = authenticate();
if ($admin['role'] !== 'admin') {
    sendResponse(['error' => 'Forbidden'], 403);
}

try {
    $db = getDBConnection();
    $stmt = $db->prepare("
        SELECT t.technician_id, u.name, u.email, u.phone, u.status,
               t.specialization, t.experience_years, t.rating
        FROM TECHNICIAN t
        JOIN USER u ON u.user_id = t.user_id
        ORDER BY u.name ASC
    ");
    $stmt->execute();
    $rows = $stmt->fetchAll();
    sendResponse($rows);
} catch (PDOException $e) {
    sendResponse(['error' => $e->getMessage()], 500);
}
