<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, DELETE");
header("Access-Control-Allow-Headers: Content-Type");

require_once 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Get all products
    $sql = "SELECT * FROM products ORDER BY createdAt DESC";
    $result = $conn->query($sql);
    $products = [];
    while ($row = $result->fetch_assoc()) {
        $products[] = $row;
    }
    jsonResponse($products);

} elseif ($method === 'POST') {
    // Add or Update product
    $data = getJsonBody();
    if (!isset($data['id']) || !isset($data['name'])) {
        http_response_code(400);
        jsonResponse(['error' => 'Missing required fields']);
    }

    $id = $conn->real_escape_string($data['id']);
    $code = isset($data['code']) ? $conn->real_escape_string($data['code']) : '';
    $name = $conn->real_escape_string($data['name']);
    $description = isset($data['description']) ? $conn->real_escape_string($data['description']) : '';
    $price = isset($data['price']) ? (float)$data['price'] : 0;
    $cost = isset($data['cost']) ? (float)$data['cost'] : 0;
    $stock = isset($data['stock']) ? (int)$data['stock'] : 0;

    $check = $conn->query("SELECT id FROM products WHERE id='$id'");
    
    if ($check->num_rows > 0) {
        $sql = "UPDATE products SET code='$code', name='$name', description='$description', price=$price, cost=$cost, stock=$stock WHERE id='$id'";
    } else {
        $sql = "INSERT INTO products (id, code, name, description, price, cost, stock) VALUES ('$id', '$code', '$name', '$description', $price, $cost, $stock)";
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
    if ($conn->query("DELETE FROM products WHERE id='$id'") === TRUE) {
        jsonResponse(['success' => true]);
    } else {
        http_response_code(500);
        jsonResponse(['error' => $conn->error]);
    }
}
$conn->close();
?>
