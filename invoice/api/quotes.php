<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, DELETE");
header("Access-Control-Allow-Headers: Content-Type");

require_once 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $sql = "SELECT * FROM quotes ORDER BY createdAt DESC";
    $result = $conn->query($sql);
    $quotes = [];
    while ($row = $result->fetch_assoc()) {
        // Fetch items for each quote
        $qId = $row['id'];
        $itemsResult = $conn->query("SELECT * FROM quote_items WHERE quote_id='$qId'");
        $items = [];
        while ($itemRow = $itemsResult->fetch_assoc()) {
            $itemRow['price'] = (float)$itemRow['price'];
            $itemRow['qty'] = (float)$itemRow['qty'];
            $itemRow['isTaxable'] = (bool)$itemRow['isTaxable'];
            $items[] = $itemRow;
        }
        $row['items'] = $items;
        $row['subtotal'] = (float)$row['subtotal'];
        $row['vatRate'] = (float)$row['vatRate'];
        $row['vat'] = (float)$row['vat'];
        $row['total'] = (float)$row['total'];
        $quotes[] = $row;
    }
    jsonResponse($quotes);

} elseif ($method === 'POST') {
    $data = getJsonBody();
    if (!isset($data['id']) || !isset($data['number'])) {
        http_response_code(400);
        jsonResponse(['error' => 'Missing required fields']);
    }

    $id = $conn->real_escape_string($data['id']);
    $number = $conn->real_escape_string($data['number']);
    $clientName = $conn->real_escape_string($data['clientName']);
    $clientPhone = $conn->real_escape_string($data['clientPhone']);
    $clientEmail = $conn->real_escape_string($data['clientEmail']);
    $clientAddress = $conn->real_escape_string($data['clientAddress']);
    $date = $conn->real_escape_string($data['date']);
    $validUntil = $conn->real_escape_string($data['validUntil']);
    $subtotal = (float)$data['subtotal'];
    $vatRate = (float)$data['vatRate'];
    $vat = (float)$data['vat'];
    $total = (float)$data['total'];
    $notes = $conn->real_escape_string($data['notes']);
    $status = $conn->real_escape_string($data['status']);

    $conn->begin_transaction();
    try {
        $check = $conn->query("SELECT id FROM quotes WHERE id='$id'");
        
        if ($check->num_rows > 0) {
            $sql = "UPDATE quotes SET number='$number', clientName='$clientName', clientPhone='$clientPhone', clientEmail='$clientEmail', clientAddress='$clientAddress', date='$date', validUntil='$validUntil', subtotal=$subtotal, vatRate=$vatRate, vat=$vat, total=$total, notes='$notes', status='$status' WHERE id='$id'";
            $conn->query($sql);
            $conn->query("DELETE FROM quote_items WHERE quote_id='$id'");
        } else {
            $sql = "INSERT INTO quotes (id, number, clientName, clientPhone, clientEmail, clientAddress, date, validUntil, subtotal, vatRate, vat, total, notes, status) VALUES ('$id', '$number', '$clientName', '$clientPhone', '$clientEmail', '$clientAddress', '$date', '$validUntil', $subtotal, $vatRate, $vat, $total, '$notes', '$status')";
            $conn->query($sql);
        }

        if (isset($data['items']) && is_array($data['items'])) {
            foreach ($data['items'] as $item) {
                $desc = $conn->real_escape_string($item['description']);
                $qty = (float)$item['qty'];
                $price = (float)$item['price'];
                $taxable = $item['isTaxable'] ? 1 : 0;
                $pId = isset($item['productId']) && $item['productId'] !== null ? "'" . $conn->real_escape_string($item['productId']) . "'" : "NULL";
                
                $conn->query("INSERT INTO quote_items (quote_id, description, qty, price, isTaxable, productId) VALUES ('$id', '$desc', $qty, $price, $taxable, $pId)");
            }
        }
        
        $conn->commit();
        jsonResponse(['success' => true]);
    } catch (Exception $e) {
        $conn->rollback();
        http_response_code(500);
        jsonResponse(['error' => $e->getMessage()]);
    }

} elseif ($method === 'DELETE') {
    $data = getJsonBody();
    if (!isset($data['id'])) {
        http_response_code(400);
        jsonResponse(['error' => 'Missing ID']);
    }
    $id = $conn->real_escape_string($data['id']);
    if ($conn->query("DELETE FROM quotes WHERE id='$id'") === TRUE) {
        jsonResponse(['success' => true]);
    } else {
        http_response_code(500);
        jsonResponse(['error' => $conn->error]);
    }
}
$conn->close();
?>
