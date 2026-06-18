<?php
// backend/auth/register.php
require_once __DIR__ . '/../config/db.php';

$input    = getJSONInput();
$name     = isset($input['name'])     ? trim($input['name'])     : '';
$email    = isset($input['email'])    ? trim($input['email'])    : '';
$password = isset($input['password']) ? $input['password']       : '';
$phone    = isset($input['phone'])    ? trim($input['phone'])    : null;
$address  = isset($input['address'])  ? trim($input['address'])  : null;

if (empty($name) || empty($email) || empty($password)) {
    sendResponse(['error' => 'Name, email, and password are required'], 400);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    sendResponse(['error' => 'Invalid email address'], 400);
}

if ($phone !== null && !preg_match('/^[0-9 +\-().]{7,20}$/', $phone)) {
    sendResponse(['error' => 'Invalid phone number format'], 400);
}

// Password strength validation
if (strlen($password) < 8) {
    sendResponse(['error' => 'Password must be at least 8 characters'], 400);
}
if (!preg_match('/[A-Z]/', $password)) {
    sendResponse(['error' => 'Password must contain at least one uppercase letter'], 400);
}
if (!preg_match('/[a-z]/', $password)) {
    sendResponse(['error' => 'Password must contain at least one lowercase letter'], 400);
}
if (!preg_match('/[0-9]/', $password)) {
    sendResponse(['error' => 'Password must contain at least one number'], 400);
}
if (!preg_match('/[\W_]/', $password)) {
    sendResponse(['error' => 'Password must contain at least one special character (e.g. @, #, !)'], 400);
}

try {
    $db = getDBConnection();

    // Check if email already exists
    $stmt = $db->prepare("SELECT user_id FROM USER WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        sendResponse(['error' => 'Email is already registered'], 409);
    }

    $db->beginTransaction();

    $passwordHash = password_hash($password, PASSWORD_BCRYPT);
    $uStmt = $db->prepare("INSERT INTO USER (name, email, password_hash, phone, role, status, created_at) VALUES (?, ?, ?, ?, 'customer', 'active', NOW())");
    $uStmt->execute([$name, $email, $passwordHash, $phone]);
    $userId = $db->lastInsertId();

    // Insert into CUSTOMER (no loyalty fields referenced)
    $cStmt = $db->prepare("INSERT INTO CUSTOMER (user_id, address) VALUES (?, ?)");
    $cStmt->execute([$userId, $address]);
    $customerId = $db->lastInsertId();

    $db->commit();

    $token = $userId . '-customer';

    sendResponse([
        'message'     => 'Registration successful',
        'user_id'     => (int)$userId,
        'customer_id' => (int)$customerId,
        'name'        => $name,
        'email'       => $email,
        'role'        => 'customer',
        'address'     => $address,
        'token'       => $token
    ], 201);

} catch (PDOException $e) {
    if (isset($db) && $db->inTransaction()) {
        $db->rollBack();
    }
    sendResponse(['error' => 'Registration failed: ' . $e->getMessage()], 500);
}
