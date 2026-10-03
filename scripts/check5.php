<?php
require_once __DIR__ . '/../src/core/bootstrap.php';
$res = $conn->query("SHOW TRIGGERS");
print_r($res->fetch_all(MYSQLI_ASSOC));
