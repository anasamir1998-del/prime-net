<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, DELETE");
header("Access-Control-Allow-Headers: Content-Type");

require_once 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $sql = "SELECT * FROM invoices ORDER BY createdAt DESC";
    $result = $conn->query($sql);
    $invoices = [];
    while ($row = $result->fetch_assoc()) {
        // Fetch items for each invoice
        $invId = $row['id'];
        $itemsResult = $conn->query("SELECT * FROM invoice_items WHERE invoice_id='$invId'");
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
        $invoices[] = $row;
    }
    jsonResponse($invoices);

} elseif ($method === 'POST') {
    // Add or Update Invoice
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
    $clientTax = $conn->real_escape_string($data['clientTax']);
    $date = $conn->real_escape_string($data['date']);
    $subtotal = (float)$data['subtotal'];
    $vatRate = (float)$data['vatRate'];
    $vat = (float)$data['vat'];
    $total = (float)$data['total'];
    $notes = $conn->real_escape_string($data['notes']);
    $status = $conn->real_escape_string($data['status']);

    $conn->begin_transaction();
    try {
        $check = $conn->query("SELECT id FROM invoices WHERE id='$id'");
        
        if ($check->num_rows > 0) {
            $sql = "UPDATE invoices SET number='$number', clientName='$clientName', clientPhone='$clientPhone', clientEmail='$clientEmail', clientAddress='$clientAddress', clientTax='$clientTax', date='$date', subtotal=$subtotal, vatRate=$vatRate, vat=$vat, total=$total, notes='$notes', status='$status' WHERE id='$id'";
            $conn->query($sql);
            // Delete old items to insert new
            $conn->query("DELETE FROM invoice_items WHERE invoice_id='$id'");
        } else {
            $sql = "INSERT INTO invoices (id, number, clientName, clientPhone, clientEmail, clientAddress, clientTax, date, subtotal, vatRate, vat, total, notes, status) VALUES ('$id', '$number', '$clientName', '$clientPhone', '$clientEmail', '$clientAddress', '$clientTax', '$date', $subtotal, $vatRate, $vat, $total, '$notes', '$status')";
            $conn->query($sql);
        }

        // Insert items
        if (isset($data['items']) && is_array($data['items'])) {
            foreach ($data['items'] as $item) {
                $desc = $conn->real_escape_string($item['description']);
                $qty = (float)$item['qty'];
                $price = (float)$item['price'];
                $taxable = $item['isTaxable'] ? 1 : 0;
                $pId = isset($item['productId']) && $item['productId'] !== null ? "'" . $conn->real_escape_string($item['productId']) . "'" : "NULL";
                
                $conn->query("INSERT INTO invoice_items (invoice_id, description, qty, price, isTaxable, productId) VALUES ('$id', '$desc', $qty, $price, $taxable, $pId)");
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
    // Items will cascade delete if foreign key cascade is active
    if ($conn->query("DELETE FROM invoices WHERE id='$id'") === TRUE) {
        jsonResponse(['success' => true]);
    } else {
        http_response_code(500);
        jsonResponse(['error' => $conn->error]);
    }
}
$conn->close();
?>
