<?php
require_once __DIR__ . '/../src/core/bootstrap.php';
$res = $conn->query('SELECT * FROM exam_slots WHERE exam_schedule_id = 87');
print_r($res->fetch_all(MYSQLI_ASSOC));
