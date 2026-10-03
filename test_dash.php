<?php
require 'src/core/bootstrap.php';
$stmt = $conn->prepare("SELECT id FROM users WHERE email='livematch2501@gmail.com'");
$stmt->execute();
$uid = $stmt->get_result()->fetch_assoc()['id'];
$_SESSION['user_id'] = $uid;
$_SESSION['role'] = 'candidate';
$_SERVER['REQUEST_METHOD'] = 'GET';

try {
    require 'public/api/dashboard.php';
} catch (Throwable $e) {
    echo "ERROR ON LINE " . $e->getLine() . " IN " . $e->getFile() . "\n";
    echo $e->getMessage() . "\n";
}
