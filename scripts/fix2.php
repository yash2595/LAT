<?php
require_once __DIR__ . '/../src/core/bootstrap.php';
$conn->begin_transaction();
$conn->query("UPDATE enrollments SET eligibility_status = 'eligible' WHERE provisional_schedule_id = 87");
echo "Updated " . $conn->affected_rows . " rows.\n";
$conn->commit();
