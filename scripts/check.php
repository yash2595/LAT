<?php
require_once __DIR__ . '/../src/core/bootstrap.php';
$res = $conn->query("SELECT * FROM enrollments WHERE provisional_schedule_id = 87 LIMIT 5");
while ($row = $res->fetch_assoc()) {
    print_r($row);
}
echo "Total count for 87: ";
$res2 = $conn->query("SELECT COUNT(*) as c FROM enrollments WHERE provisional_schedule_id = 87 AND eligibility_status = 'eligible'");
$row2 = $res2->fetch_assoc();
echo $row2['c'] . "\n";
