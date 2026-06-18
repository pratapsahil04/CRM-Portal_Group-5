<?php
// backend/auth/verify_otp.php
require_once __DIR__ . '/../config/db.php';

$input = getJSONInput();
$email   = isset($input['email'])    ? trim($input['email'])    : '';
$otp     = isset($input['otp'])      ? trim($input['otp'])      : '';
$purpose = isset($input['purpose'])  ? trim($input['purpose'])  : '';

if (empty($email) || empty($otp) || empty($purpose)) {
    sendResponse(['error' => 'Email, OTP, and purpose are required'], 400);
}

if (!in_array($purpose, ['register', 'recover'])) {
    sendResponse(['error' => 'Invalid purpose'], 400);
}

try {
    $db = getDBConnection();

    $stmt = $db->prepare("SELECT otp_code, created_at FROM otp_verifications WHERE email = ? AND purpose = ?");
    $stmt->execute([$email, $purpose]);
    $row = $stmt->fetch();

    if (!$row) {
        sendResponse(['error' => 'No OTP found for this email. Please request a new one.'], 404);
    }

    // OTP expires after 10 minutes
    $createdAt = strtotime($row['created_at']);
    if ((time() - $createdAt) > 600) {
        $db->prepare("DELETE FROM otp_verifications WHERE email = ? AND purpose = ?")->execute([$email, $purpose]);
        sendResponse(['error' => 'OTP has expired. Please request a new one.'], 410);
    }

    if ($row['otp_code'] !== $otp) {
        sendResponse(['error' => 'Incorrect OTP. Please check and try again.'], 400);
    }

    // OTP is valid – delete it so it cannot be reused
    $db->prepare("DELETE FROM otp_verifications WHERE email = ? AND purpose = ?")->execute([$email, $purpose]);

    sendResponse(['message' => 'OTP verified successfully', 'verified' => true]);

} catch (PDOException $e) {
    sendResponse(['error' => 'Verification failed: ' . $e->getMessage()], 500);
}
