<?php
// backend/auth/reset_password.php
// Called after OTP is verified on the client side.
// Expects: email, new_password
require_once __DIR__ . '/../config/db.php';

$input       = getJSONInput();
$email       = isset($input['email'])        ? trim($input['email'])        : '';
$newPassword = isset($input['new_password']) ? $input['new_password']       : '';

if (empty($email) || empty($newPassword)) {
    sendResponse(['error' => 'Email and new password are required'], 400);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    sendResponse(['error' => 'Invalid email address'], 400);
}

// Server-side password strength check
if (strlen($newPassword) < 8) {
    sendResponse(['error' => 'Password must be at least 8 characters'], 400);
}
if (!preg_match('/[A-Z]/', $newPassword)) {
    sendResponse(['error' => 'Password must contain at least one uppercase letter'], 400);
}
if (!preg_match('/[a-z]/', $newPassword)) {
    sendResponse(['error' => 'Password must contain at least one lowercase letter'], 400);
}
if (!preg_match('/[0-9]/', $newPassword)) {
    sendResponse(['error' => 'Password must contain at least one number'], 400);
}
if (!preg_match('/[\W_]/', $newPassword)) {
    sendResponse(['error' => 'Password must contain at least one special character'], 400);
}

try {
    $db = getDBConnection();

    $stmt = $db->prepare("SELECT user_id FROM USER WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user) {
        sendResponse(['error' => 'Email address not found'], 404);
    }

    $hash = password_hash($newPassword, PASSWORD_BCRYPT);
    $upd  = $db->prepare("UPDATE USER SET password_hash = ? WHERE email = ?");
    $upd->execute([$hash, $email]);

    sendResponse(['message' => 'Password reset successfully. You can now log in.']);

} catch (PDOException $e) {
    sendResponse(['error' => 'Reset failed: ' . $e->getMessage()], 500);
}
