<?php
require_once __DIR__ . '/../src/core/bootstrap.php';

$sql = "SELECT 
        s.id as schedule_id,
        b.batch_number,
        (SELECT COUNT(*) FROM enrollments e WHERE (e.provisional_schedule_id = s.id OR e.batch_id = b.id) AND e.eligibility_status = 'eligible') as candidate_count
        FROM exam_schedules s
        JOIN batches b ON s.batch_id = b.id
        WHERE s.id = 87";
$res = $conn->query($sql);
print_r($res->fetch_all(MYSQLI_ASSOC));
