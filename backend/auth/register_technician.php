<?php
// backend/auth/register_technician.php
// Admin-only endpoint to register a new technician account.
require_once __DIR__ . '/../config/db.php';

$admin = authenticate(); // Validates Bearer token and role
if ($admin['role'] !== 'admin') {
    sendResponse(['error' => 'Only administrators can register technicians.'], 403);
}

$input          = getJSONInput();
$name           = isset($input['name'])            ? trim($input['name'])           : '';
$email          = isset($input['email'])           ? trim($input['email'])          : '';
$password       = isset($input['password'])        ? $input['password']             : '';
$phone          = isset($input['phone'])           ? trim($input['phone'])          : null;
$specialization = isset($input['specialization'])  ? trim($input['specialization']) : null;
$expYears       = isset($input['experience_years'])? (int)$input['experience_years']: 0;

// --- Validation ---
if (empty($name) || empty($email) || empty($password)) {
    sendResponse(['error' => 'Name, email and password are required.'], 400);
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    sendResponse(['error' => 'Invalid email address.'], 400);
}
if ($phone !== null && !preg_match('/^[0-9 +\-().]{7,20}$/', $phone)) {
    sendResponse(['error' => 'Invalid phone number format.'], 400);
}
if (strlen($password) < 8 || !preg_match('/[A-Z]/', $password) ||
    !preg_match('/[a-z]/', $password) || !preg_match('/[0-9]/', $password) ||
    !preg_match('/[\W_]/', $password)) {
    sendResponse(['error' => 'Password must be ≥8 chars and contain uppercase, lowercase, number and special character.'], 400);
}
if ($expYears < 0 || $expYears > 60) {
    sendResponse(['error' => 'Experience years must be between 0 and 60.'], 400);
}

try {
    $db = getDBConnection();

    // Check duplicate email — parameterised, injection-safe
    $chk = $db->prepare("SELECT user_id FROM USER WHERE email = ?");
    $chk->execute([$email]);
    if ($chk->fetch()) {
        sendResponse(['error' => 'This email is already registered.'], 409);
    }

    $db->beginTransaction();

    $hash  = password_hash($password, PASSWORD_BCRYPT);
    $uStmt = $db->prepare(
        "INSERT INTO USER (name, email, password_hash, phone, role, status, created_at)
         VALUES (?, ?, ?, ?, 'technician', 'active', NOW())"
    );
    $uStmt->execute([$name, $email, $hash, $phone]);
    $userId = (int)$db->lastInsertId();

    $tStmt = $db->prepare(
        "INSERT INTO TECHNICIAN (user_id, specialization, experience_years, rating)
         VALUES (?, ?, ?, 0.00)"
    );
    $tStmt->execute([$userId, $specialization ?: null, $expYears]);
    $technicianId = (int)$db->lastInsertId();

    $db->commit();

    sendResponse([
        'message'        => 'Technician registered successfully.',
        'user_id'        => $userId,
        'technician_id'  => $technicianId,
        'name'           => $name,
        'email'          => $email,
        'specialization' => $specialization,
        'experience_years' => $expYears,
    ], 201);

} catch (PDOException $e) {
    if (isset($db) && $db->inTransaction()) $db->rollBack();
    sendResponse(['error' => 'Registration failed: ' . $e->getMessage()], 500);
}
