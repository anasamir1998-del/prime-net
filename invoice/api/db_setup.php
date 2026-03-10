<?php
// db_setup.php - Run this once to create the database tables
header('Content-Type: text/html; charset=utf-8');

// Replace these with Hostinger DB details when deploying
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'prime_net_invoice');

// Create connection
$conn = new mysqli(DB_HOST, DB_USER, DB_PASS);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Create database if not exists
$sql = "CREATE DATABASE IF NOT EXISTS " . DB_NAME . " CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci";
if ($conn->query($sql) === TRUE) {
    echo "Database created or already exists.<br>";
} else {
    die("Error creating database: " . $conn->error);
}

// Select the database
$conn->select_db(DB_NAME);

// 1. Users table
$sql_users = "CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role ENUM('admin', 'employee') DEFAULT 'employee',
    permissions JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)";
if ($conn->query($sql_users) === TRUE) {
    echo "Table 'users' created successfully.<br>";
} else {
    echo "Error creating table 'users': " . $conn->error . "<br>";
}

// Insert default Admin if none
$check_admin = $conn->query("SELECT id FROM users WHERE username='admin'");
if ($check_admin->num_rows == 0) {
    // default pass inside local storage was '123'
    $hashed_pass = password_hash('123', PASSWORD_DEFAULT);
    $conn->query("INSERT INTO users (username, password, name, role) VALUES ('admin', '$hashed_pass', 'المدير', 'admin')");
    $conn->query("INSERT INTO users (username, password, name, role) VALUES ('samir', '$hashed_pass', 'Samir', 'admin')");
    echo "Default admins inserted.<br>";
}

// 2. Clients table
$sql_clients = "CREATE TABLE IF NOT EXISTS clients (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(100),
    address TEXT,
    taxNumber VARCHAR(100),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)";
if ($conn->query($sql_clients) === TRUE) echo "Table 'clients' created.<br>";

// 3. Products table
$sql_products = "CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(100),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) DEFAULT 0,
    cost DECIMAL(10,2) DEFAULT 0,
    stock INT DEFAULT 0,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)";
if ($conn->query($sql_products) === TRUE) echo "Table 'products' created.<br>";

// 4. Invoices table
$sql_invoices = "CREATE TABLE IF NOT EXISTS invoices (
    id VARCHAR(50) PRIMARY KEY,
    number VARCHAR(50) NOT NULL,
    clientName VARCHAR(255) NOT NULL,
    clientPhone VARCHAR(50),
    clientEmail VARCHAR(100),
    clientAddress TEXT,
    clientTax VARCHAR(100),
    date DATE NOT NULL,
    subtotal DECIMAL(10,2) DEFAULT 0,
    vatRate DECIMAL(5,2) DEFAULT 15,
    vat DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) DEFAULT 0,
    notes TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)";
if ($conn->query($sql_invoices) === TRUE) echo "Table 'invoices' created.<br>";

// 5. Invoice Items table
$sql_inv_items = "CREATE TABLE IF NOT EXISTS invoice_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_id VARCHAR(50),
    description TEXT,
    qty DECIMAL(10,2) DEFAULT 1,
    price DECIMAL(10,2) DEFAULT 0,
    isTaxable TINYINT(1) DEFAULT 1,
    productId VARCHAR(50) NULL,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
)";
if ($conn->query($sql_inv_items) === TRUE) echo "Table 'invoice_items' created.<br>";


// 6. Quotes table
$sql_quotes = "CREATE TABLE IF NOT EXISTS quotes (
    id VARCHAR(50) PRIMARY KEY,
    number VARCHAR(50) NOT NULL,
    clientName VARCHAR(255) NOT NULL,
    clientPhone VARCHAR(50),
    clientEmail VARCHAR(100),
    clientAddress TEXT,
    date DATE NOT NULL,
    validUntil DATE,
    subtotal DECIMAL(10,2) DEFAULT 0,
    vatRate DECIMAL(5,2) DEFAULT 15,
    vat DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) DEFAULT 0,
    notes TEXT,
    status VARCHAR(50) DEFAULT 'quote',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)";
if ($conn->query($sql_quotes) === TRUE) echo "Table 'quotes' created.<br>";

// 7. Quote Items table
$sql_quote_items = "CREATE TABLE IF NOT EXISTS quote_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quote_id VARCHAR(50),
    description TEXT,
    qty DECIMAL(10,2) DEFAULT 1,
    price DECIMAL(10,2) DEFAULT 0,
    isTaxable TINYINT(1) DEFAULT 1,
    productId VARCHAR(50) NULL,
    FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE
)";
if ($conn->query($sql_quote_items) === TRUE) echo "Table 'quote_items' created.<br>";

// 8. Settings & Counters table
$sql_settings = "CREATE TABLE IF NOT EXISTS settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value JSON NULL
)";
if ($conn->query($sql_settings) === TRUE) {
    echo "Table 'settings' created.<br>";
    // Insert defaults if empty
    $check_set = $conn->query("SELECT id FROM settings");
    if ($check_set->num_rows == 0) {
        $defaults = json_encode([
            "companyName" => "PRIME NET",
            "companyTagline" => "لتقنية المعلومات | حلول رقمية متكاملة",
            "companyAddress" => "المملكة العربية السعودية",
            "companyPhone" => "059 297 3183",
            "companyEmail" => "safiat.msh@gmail.com",
            "companyTaxNumber" => "",
            "companyCR" => "",
            "vatRate" => 15,
            "currency" => "ر.س",
            "invPrefix" => "INV-",
            "quotePrefix" => "QT-",
            "defaultNotes" => "نشكركم على ثقتكم بنا. الأسعار لا تشمل أي أعمال إضافية غير مذكورة في العرض.",
            "vatMode" => "inclusive"
        ], JSON_UNESCAPED_UNICODE);
        
        $counters = json_encode(["invoice" => 1000, "quote" => 1000]);
        
        $conn->query("INSERT INTO settings (setting_key, setting_value) VALUES ('pn_settings', '$defaults')");
        $conn->query("INSERT INTO settings (setting_key, setting_value) VALUES ('pn_counters', '$counters')");
    }
}

echo "<h2>Setup Complete!</h2>";
$conn->close();
?>
