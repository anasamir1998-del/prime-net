<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, DELETE");
header("Access-Control-Allow-Headers: Content-Type");

require_once 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Get all clients
    $sql = "SELECT * FROM clients ORDER BY createdAt DESC";
    $result = $conn->query($sql);
    $clients = [];
    while ($row = $result->fetch_assoc()) {
        $clients[] = $row;
    }
    jsonResponse($clients);

} elseif ($method === 'POST') {
    // Add or Update client
    $data = getJsonBody();
    if (!isset($data['id']) || !isset($data['name'])) {
        http_response_code(400);
        jsonResponse(['error' => 'Missing required fields']);
    }

    $id = $conn->real_escape_string($data['id']);
    $name = $conn->real_escape_string($data['name']);
    $phone = isset($data['phone']) ? $conn->real_escape_string($data['phone']) : '';
    $email = isset($data['email']) ? $conn->real_escape_string($data['email']) : '';
    $address = isset($data['address']) ? $conn->real_escape_string($data['address']) : '';
    $tax = isset($data['taxNumber']) ? $conn->real_escape_string($data['taxNumber']) : '';

    // Check if client exists
    $check = $conn->query("SELECT id FROM clients WHERE id = '$id'");
    
    if ($check->num_rows > 0) {
        $sql = "UPDATE clients SET name='$name', phone='$phone', email='$email', address='$address', taxNumber='$tax' WHERE id='$id'";
    } else {
        $sql = "INSERT INTO clients (id, name, phone, email, address, taxNumber) VALUES ('$id', '$name', '$phone', '$email', '$address', '$tax')";
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
    $id = $conn->real_escape_string($data['id']);
    if ($conn->query("DELETE FROM clients WHERE id='$id'") === TRUE) {
        jsonResponse(['success' => true]);
    } else {
        http_response_code(500);
        jsonResponse(['error' => $conn->error]);
    }
}
$conn->close();
?>
