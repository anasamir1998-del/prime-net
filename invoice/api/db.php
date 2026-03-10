<?php
// db.php - Database connection and helpers

// 1. Detect Environment (Local vs Production)
if ($_SERVER['SERVER_NAME'] === 'localhost' || $_SERVER['SERVER_NAME'] === '127.0.0.1') {
    // Local environment settings
    define('DB_HOST', 'localhost');
    define('DB_USER', 'root');
    define('DB_PASS', '');
    define('DB_NAME', 'prime_net_invoice');
} else {
    // Hostinger Production settings
    define('DB_HOST', 'localhost');
    define('DB_USER', 'u127645123_prime');
    define('DB_PASS', 'Ss371998');
    define('DB_NAME', 'u127645123_DB_Prime_N');
}

// 2. Establish Connection
try {
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    if ($conn->connect_error) {
        throw new Exception("Connection failed: " . $conn->connect_error);
    }
    $conn->set_charset('utf8mb4');
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed']);
    exit;
}

// 3. Helper Functions
function jsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function getJsonBody() {
    $json = file_get_contents('php://input');
    return json_decode($json, true);
}
?>
