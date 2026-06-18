<?php
// backend/auth/login.php
require_once __DIR__ . '/../config/db.php';

$input = getJSONInput();
$email = isset($input['email']) ? trim($input['email']) : '';
$password = isset($input['password']) ? $input['password'] : '';

if (empty($email) || empty($password)) {
    sendResponse(['error' => 'Email and password are required'], 400);
}

try {
    $db = getDBConnection();
    
    // Select user by email
    $stmt = $db->prepare("SELECT user_id, name, email, password_hash, role, status FROM USER WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();
    
    if (!$user || !password_verify($password, $user['password_hash'])) {
        sendResponse(['error' => 'Invalid email or password'], 401);
    }
    
    if ($user['status'] !== 'active') {
        sendResponse(['error' => 'Your account is ' . $user['status']], 403);
    }
    
    // Generate simple token "userId-role"
    $token = $user['user_id'] . '-' . $user['role'];
    
    // Construct user profile details
    $profile = [
        'user_id' => (int)$user['user_id'],
        'name' => $user['name'],
        'email' => $user['email'],
        'role' => $user['role'],
        'token' => $token
    ];
    
    // If user is a customer, load address only (no loyalty/tier)
    if ($user['role'] === 'customer') {
        $cStmt = $db->prepare("SELECT customer_id, address FROM CUSTOMER WHERE user_id = ?");
        $cStmt->execute([$user['user_id']]);
        $customer = $cStmt->fetch();
        if ($customer) {
            $profile['customer_id'] = (int)$customer['customer_id'];
            $profile['address'] = $customer['address'];
        }
    } else if ($user['role'] === 'technician') {
        $tStmt = $db->prepare("SELECT technician_id, specialization, experience_years, rating FROM TECHNICIAN WHERE user_id = ?");
        $tStmt->execute([$user['user_id']]);
        $tech = $tStmt->fetch();
        if ($tech) {
            $profile['technician_id'] = (int)$tech['technician_id'];
            $profile['specialization'] = $tech['specialization'];
            $profile['experience_years'] = (int)$tech['experience_years'];
            $profile['rating'] = (float)$tech['rating'];
        }
    } else if ($user['role'] === 'admin') {
        $aStmt = $db->prepare("SELECT admin_id FROM ADMIN WHERE user_id = ?");
        $aStmt->execute([$user['user_id']]);
        $admin = $aStmt->fetch();
        if ($admin) {
            $profile['admin_id'] = (int)$admin['admin_id'];
        }
    }
    
    sendResponse($profile);
    
} catch (PDOException $e) {
    sendResponse(['error' => 'Login error: ' . $e->getMessage()], 500);
}
