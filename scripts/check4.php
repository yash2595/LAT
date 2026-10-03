<?php
require_once __DIR__ . '/../src/core/bootstrap.php';
$res = $conn->query("SELECT id, candidate_id, eligibility_status, provisional_schedule_id, batch_id FROM enrollments WHERE provisional_schedule_id = 87 LIMIT 5");
print_r($res->fetch_all(MYSQLI_ASSOC));
