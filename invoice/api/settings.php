<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST");
header("Access-Control-Allow-Headers: Content-Type");

require_once 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $settings = [];
    $counters = [];
    
    $res = $conn->query("SELECT setting_key, setting_value FROM settings");
    while ($row = $res->fetch_assoc()) {
        if ($row['setting_key'] === 'pn_settings') {
            $settings = json_decode($row['setting_value'], true);
        } else if ($row['setting_key'] === 'pn_counters') {
            $counters = json_decode($row['setting_value'], true);
        }
    }
    jsonResponse(['settings' => $settings, 'counters' => $counters]);

} elseif ($method === 'POST') {
    $data = getJsonBody();
    if (isset($data['settings'])) {
        $sval = $conn->real_escape_string(json_encode($data['settings'], JSON_UNESCAPED_UNICODE));
        $conn->query("UPDATE settings SET setting_value='$sval' WHERE setting_key='pn_settings'");
    }
    if (isset($data['counters'])) {
        $cval = $conn->real_escape_string(json_encode($data['counters'], JSON_UNESCAPED_UNICODE));
        $conn->query("UPDATE settings SET setting_value='$cval' WHERE setting_key='pn_counters'");
    }
    jsonResponse(['success' => true]);
}
?>
