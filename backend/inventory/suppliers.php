<?php
// backend/inventory/suppliers.php
require_once __DIR__ . '/../config/db.php';

$user = authenticate();

if ($user['role'] !== 'technician' && $user['role'] !== 'admin') {
    sendResponse(['error' => 'Unauthorized access'], 403);
}

$db = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        $stmt = $db->query("SELECT * FROM SUPPLIER ORDER BY name ASC");
        $suppliers = $stmt->fetchAll();
        sendResponse($suppliers);
    } catch (PDOException $e) {
        sendResponse(['error' => 'Failed to retrieve suppliers: ' . $e->getMessage()], 500);
    }
} 

elseif ($method === 'POST') {
    $input = getJSONInput();
    $name = isset($input['name']) ? trim($input['name']) : '';
    $contactPerson = isset($input['contact_person']) ? trim($input['contact_person']) : null;
    $phone = isset($input['phone']) ? trim($input['phone']) : null;

    if (empty($name)) {
        sendResponse(['error' => 'Supplier name is required'], 400);
    }

    if ($phone !== null && !preg_match('/^[0-9 +\-().]{7,20}$/', $phone)) {
        sendResponse(['error' => 'Invalid phone number format'], 400);
    }

    try {
        $stmt = $db->prepare("
            INSERT INTO SUPPLIER (name, contact_person, phone)
            VALUES (?, ?, ?)
        ");
        $stmt->execute([$name, $contactPerson, $phone]);
        $supplierId = $db->lastInsertId();

        sendResponse(['message' => 'Supplier created successfully', 'supplier_id' => (int)$supplierId], 201);
    } catch (PDOException $e) {
        sendResponse(['error' => 'Failed to create supplier: ' . $e->getMessage()], 500);
    }
} else {
    sendResponse(['error' => 'Method not allowed'], 450);
}
