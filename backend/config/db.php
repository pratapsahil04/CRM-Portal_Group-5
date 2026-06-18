<?php
// backend/config/db.php

// CORS and Preflight Request Handling
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Database Credentials
define('DB_HOST', 'crm-db');
define('DB_PORT', '3306');
define('DB_NAME', 'crm');
define('DB_USER', 'root');
define('DB_PASS', 'secret');

// Helper to parse and load .env file
function loadEnv() {
    // Try backend-root first (works in Docker where backend/ is mounted at /app)
    // Then fall back to project root (../../.env) for local dev
    $candidates = [
        __DIR__ . '/../.env',   // backend/.env  → /app/.env in container
        __DIR__ . '/../../.env' // project root .env for bare local runs
    ];
    $envPath = null;
    foreach ($candidates as $c) {
        if (file_exists($c)) { $envPath = $c; break; }
    }
    if (!$envPath) return;
    $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        if (empty($line) || strpos($line, '#') === 0) continue;
        if (strpos($line, '=') === false) continue;
        list($name, $value) = explode('=', $line, 2);
        $name = trim($name);
        $value = trim(trim($value), '"\'');
        putenv("$name=$value");
        $_ENV[$name] = $value;
    }
}

function getDBConnection() {
    static $pdo = null;
    if ($pdo !== null) {
        return $pdo;
    }
    try {
        $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4";
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];
        $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        
        // Auto-create otp_verifications table if missing
        $pdo->exec("CREATE TABLE IF NOT EXISTS otp_verifications (
            email VARCHAR(150) NOT NULL,
            otp_code VARCHAR(6) NOT NULL,
            purpose ENUM('register', 'recover') NOT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (email, purpose)
        )");
        
        return $pdo;
    } catch (PDOException $e) {
        sendResponse(['error' => 'Database connection failed: ' . $e->getMessage()], 500);
    }
}

// Google SMTP sender — TCP 587 + STARTTLS (verified working)
function sendSMTPEmail($to, $subject, $body) {
    loadEnv();
    $smtp_email    = getenv('SMTP_EMAIL')    ?: '';
    $smtp_password = getenv('SMTP_PASSWORD') ?: '';

    if (empty($smtp_email) || empty($smtp_password)) {
        error_log("SMTP: credentials missing, skipping email to $to");
        return false;
    }

    // Open plain TCP connection (we will STARTTLS ourselves)
    $socket = @stream_socket_client('tcp://smtp.gmail.com:587', $errno, $errstr, 15);
    if (!$socket) {
        error_log("SMTP: connect failed: $errno – $errstr");
        return false;
    }
    stream_set_timeout($socket, 15);

    // Read one complete SMTP response (handles multi-line 250- replies)
    $read = function() use ($socket) {
        $out = '';
        while ($line = fgets($socket, 1024)) {
            $out .= $line;
            // RFC 5321: final line has a space at position 3, continuation lines use '-'
            if (strlen($line) >= 4 && $line[3] === ' ') break;
        }
        return $out;
    };
    $write = function($cmd) use ($socket) { fwrite($socket, $cmd . "\r\n"); };
    $code  = function($r) { return (int) substr(trim($r), 0, 3); };

    // --- SMTP dialog ---
    $r = $read(); // 220 greeting
    if ($code($r) !== 220) { error_log("SMTP: bad greeting: $r"); fclose($socket); return false; }

    $write('EHLO localhost');
    $r = $read();
    if ($code($r) !== 250) { error_log("SMTP: EHLO failed: $r"); fclose($socket); return false; }

    $write('STARTTLS');
    $r = $read();
    if ($code($r) !== 220) { error_log("SMTP: STARTTLS rejected: $r"); fclose($socket); return false; }

    // Upgrade socket to TLS
    if (!stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
        error_log("SMTP: TLS handshake failed");
        fclose($socket);
        return false;
    }

    // Re-introduce ourselves after TLS
    $write('EHLO localhost');
    $r = $read();
    if ($code($r) !== 250) { error_log("SMTP: EHLO(TLS) failed: $r"); fclose($socket); return false; }

    // AUTH LOGIN
    $write('AUTH LOGIN');
    $r = $read();
    if ($code($r) !== 334) { error_log("SMTP: AUTH LOGIN failed: $r"); fclose($socket); return false; }

    $write(base64_encode($smtp_email));
    $r = $read();
    if ($code($r) !== 334) { error_log("SMTP: username rejected: $r"); fclose($socket); return false; }

    $write(base64_encode($smtp_password));
    $r = $read();
    if ($code($r) !== 235) { error_log("SMTP: password rejected: $r"); fclose($socket); return false; }

    // Envelope
    $write("MAIL FROM: <$smtp_email>");
    $r = $read();
    if ($code($r) !== 250) { error_log("SMTP: MAIL FROM failed: $r"); fclose($socket); return false; }

    $write("RCPT TO: <$to>");
    $r = $read();
    if ($code($r) !== 250) { error_log("SMTP: RCPT TO failed: $r"); fclose($socket); return false; }

    // Message data
    $write('DATA');
    $r = $read();
    if ($code($r) !== 354) { error_log("SMTP: DATA failed: $r"); fclose($socket); return false; }

    $msg  = "From: AutoCRM <$smtp_email>\r\n";
    $msg .= "To: <$to>\r\n";
    $msg .= "Subject: $subject\r\n";
    $msg .= "MIME-Version: 1.0\r\n";
    $msg .= "Content-Type: text/html; charset=UTF-8\r\n";
    $msg .= "Date: " . date('r') . "\r\n";
    $msg .= "\r\n";
    $msg .= $body . "\r\n.\r\n";   // <-- end-of-data marker on its own line
    fwrite($socket, $msg);

    $r = $read();
    if ($code($r) !== 250) { error_log("SMTP: message rejected: $r"); fclose($socket); return false; }

    $write('QUIT');
    fclose($socket);
    return true;
}

// Helper to send a JSON response
function sendResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data);
    exit;
}

// Helper to get raw JSON payload
function getJSONInput() {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

// Helper to verify JWT / Bearer Token (Simulated for this CRM)
// In a full system, this decodes a JWT. Here we decode/validate simple tokens.
// Token shape: "USERID-ROLE" (e.g. "1-customer", "2-technician", "3-admin")
function authenticate() {
    $headers = getallheaders();
    $authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';
    if (empty($authHeader) && isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
    }

    if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
        $token = $matches[1];
        $parts = explode('-', $token);
        if (count($parts) === 2) {
            $userId = (int)$parts[0];
            $role = $parts[1];
            
            // Fetch user from DB to verify
            try {
                $db = getDBConnection();
                $stmt = $db->prepare("SELECT user_id, name, email, role, status FROM USER WHERE user_id = ?");
                $stmt->execute([$userId]);
                $user = $stmt->fetch();
                if ($user && $user['role'] === $role && $user['status'] === 'active') {
                    // If customer or technician, fetch the sub-entity ID
                    $user['customer_id'] = null;
                    $user['technician_id'] = null;
                    $user['admin_id'] = null;

                    if ($role === 'customer') {
                        $cStmt = $db->prepare("SELECT customer_id, address FROM CUSTOMER WHERE user_id = ?");
                        $cStmt->execute([$userId]);
                        $customer = $cStmt->fetch();
                        if ($customer) {
                            $user['customer_id'] = (int)$customer['customer_id'];
                        }
                    } else if ($role === 'technician') {
                        $tStmt = $db->prepare("SELECT technician_id, specialization, experience_years, rating FROM TECHNICIAN WHERE user_id = ?");
                        $tStmt->execute([$userId]);
                        $tech = $tStmt->fetch();
                        if ($tech) {
                            $user['technician_id'] = (int)$tech['technician_id'];
                        }
                    } else if ($role === 'admin') {
                        $aStmt = $db->prepare("SELECT admin_id FROM ADMIN WHERE user_id = ?");
                        $aStmt->execute([$userId]);
                        $admin = $aStmt->fetch();
                        if ($admin) {
                            $user['admin_id'] = (int)$admin['admin_id'];
                        }
                    }
                    return $user;
                }
            } catch (PDOException $e) {
                // Ignore, let auth fail
            }
        }
    }
    sendResponse(['error' => 'Unauthorized access'], 410);
}
