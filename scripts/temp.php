<?php
require_once __DIR__ . '/../src/core/bootstrap.php';
$res = $conn->query('DESCRIBE candidates');
while ($row = $res->fetch_assoc()) {
    echo $row['Field'] . "\n";
}
