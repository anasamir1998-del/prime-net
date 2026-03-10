<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, DELETE");
header("Access-Control-Allow-Headers: Content-Type");

require_once 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $sql = "SELECT id, username, name, role, permissions FROM users ORDER BY created_at ASC";
    $result = $conn->query($sql);
    $users = [];
    while ($row = $result->fetch_assoc()) {
        if ($row['permissions'] != null) {
            $row['permissions'] = json_decode($row['permissions'], true);
        }
        $users[] = $row;
    }
    jsonResponse($users);

} elseif ($method === 'POST') {
    $data = getJsonBody();
    if (!isset($data['username']) || !isset($data['name'])) {
        http_response_code(400);
        jsonResponse(['error' => 'Missing fields']);
    }

    $username = $conn->real_escape_string($data['username']);
    $name = $conn->real_escape_string($data['name']);
    $role = isset($data['role']) ? $conn->real_escape_string($data['role']) : 'employee';
    $password = isset($data['password']) && !empty($data['password']) ? password_hash($data['password'], PASSWORD_DEFAULT) : null;
    $perms = isset($data['permissions']) ? $conn->real_escape_string(json_encode($data['permissions'])) : 'NULL';

    if (isset($data['id']) && $data['id'] > 0) {
        $id = (int)$data['id'];
        
        // Cannot change role/delete if samir or admin
        if(strtolower($username) === 'samir') $role = 'admin';

        if ($password) {
            $sql = "UPDATE users SET username='$username', name='$name', password='$password', role='$role', permissions='$perms' WHERE id=$id";
        } else {
            $sql = "UPDATE users SET username='$username', name='$name', role='$role', permissions='$perms' WHERE id=$id";
        }
    } else {
        if (!$password) $password = password_hash('123', PASSWORD_DEFAULT);
        $sql = "INSERT INTO users (username, name, password, role, permissions) VALUES ('$username', '$name', '$password', '$role', '$perms')";
    }

    if ($conn->query($sql) === TRUE) {
        jsonResponse(['success' => true]);
    } else {
        http_response_code(500);
        jsonResponse(['error' => $conn->error]);
    }

} elseif ($method === 'DELETE') {
    $data = getJsonBody();
    if (!isset($data['id'])) {
        http_response_code(400);
        jsonResponse(['error' => 'Missing ID']);
    }
    $id = (int)$data['id'];
    
    // Check not admin/samir
    $res = $conn->query("SELECT username FROM users WHERE id=$id");
    if($res->num_rows > 0) {
        $u = $res->fetch_assoc();
        if(strtolower($u['username']) === 'admin' || strtolower($u['username']) === 'samir') {
            http_response_code(403);
            jsonResponse(['error' => 'Cannot delete system admin']);
            exit;
        }
    }

    if ($conn->query("DELETE FROM users WHERE id=$id") === TRUE) {
        jsonResponse(['success' => true]);
    } else {
        http_response_code(500);
        jsonResponse(['error' => $conn->error]);
    }
}
$conn->close();
?>
