<?php
try {
    $pdo = new PDO('mysql:host=127.0.0.1;port=3306', 'root', 'root');
    $pdo->exec('CREATE DATABASE IF NOT EXISTS railway;');
    echo "Database created successfully.\n";
} catch (PDOException $e) {
    echo "Connection failed: " . $e->getMessage() . "\n";
}
