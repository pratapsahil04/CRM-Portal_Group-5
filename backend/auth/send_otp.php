<?php
// backend/auth/send_otp.php
require_once __DIR__ . '/../config/db.php';

$input = getJSONInput();
$email = isset($input['email']) ? trim($input['email']) : '';
$purpose = isset($input['purpose']) ? trim($input['purpose']) : '';

if (empty($email) || empty($purpose)) {
    sendResponse(['error' => 'Email and purpose are required'], 400);
}

if (!in_array($purpose, ['register', 'recover'])) {
    sendResponse(['error' => 'Invalid purpose'], 400);
}

// Simple email check
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    sendResponse(['error' => 'Invalid email address'], 400);
}

try {
    $db = getDBConnection();

    // If purpose is register, email must NOT already exist in USER
    if ($purpose === 'register') {
        $stmt = $db->prepare("SELECT user_id FROM USER WHERE email = ?");
        $stmt->execute([$email]);
        if ($stmt->fetch()) {
            sendResponse(['error' => 'Email is already registered'], 409);
        }
    }

    // If purpose is recover, email MUST exist in USER
    if ($purpose === 'recover') {
        $stmt = $db->prepare("SELECT user_id FROM USER WHERE email = ?");
        $stmt->execute([$email]);
        if (!$stmt->fetch()) {
            sendResponse(['error' => 'Email address not found'], 404);
        }
    }

    // Generate a random 6-digit OTP
    $otpCode = (string)mt_rand(100000, 999999);

    // Save/Replace OTP in database
    $stmt = $db->prepare("INSERT INTO otp_verifications (email, otp_code, purpose, created_at) 
                          VALUES (?, ?, ?, NOW()) 
                          ON DUPLICATE KEY UPDATE otp_code = VALUES(otp_code), created_at = NOW()");
    $stmt->execute([$email, $otpCode, $purpose]);

    // Send email using SMTP helper
    $subject = "AutoCRM - One-Time Password (OTP) Verification";
    $body = "
        <div style='font-family: sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; background-color: #ffffff;'>
            <h2 style='color: #1f533a; margin-top: 0;'>AutoCRM Security</h2>
            <p style='color: #4e6357; font-size: 15px;'>You requested a verification code for the following action: <strong>" . ($purpose === 'register' ? 'New Account Registration' : 'Password Recovery') . "</strong>.</p>
            <div style='background-color: #f1f5f9; border-radius: 8px; padding: 16px; text-align: center; margin: 24px 0;'>
                <span style='font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #11261c;'>" . $otpCode . "</span>
            </div>
            <p style='color: #4e6357; font-size: 13px; margin-bottom: 0;'>This code will expire shortly. If you did not make this request, please ignore this email.</p>
        </div>
    ";

    $sent = sendSMTPEmail($email, $subject, $body);

    if ($sent) {
        sendResponse(['message' => 'OTP dispatched successfully. Check your email inbox.']);
    } else {
        // Fallback to allow progress in local development if SMTP port is blocked
        sendResponse([
            'message' => 'OTP generated (SMTP send failed / mock mode)',
            'dev_otp' => $otpCode // return code for easier dev/debug testing
        ]);
    }

} catch (PDOException $e) {
    sendResponse(['error' => 'Failed to generate OTP: ' . $e->getMessage()], 500);
}
