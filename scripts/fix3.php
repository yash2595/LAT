<?php
require_once __DIR__ . '/../src/core/bootstrap.php';
$conn->begin_transaction();
$res = $conn->query("SELECT candidate_id, assessment_id FROM enrollments WHERE provisional_schedule_id = 87");
$count = 0;
while ($row = $res->fetch_assoc()) {
    $cid = $row['candidate_id'];
    $aid = $row['assessment_id'];
    $ref = "FAKE_REF_" . time() . "_" . $cid;
    $stmt = $conn->prepare("INSERT INTO payments (candidate_id, assessment_id, amount, status, reference_number) VALUES (?, ?, 500.00, 'success', ?)");
    $stmt->bind_param("iis", $cid, $aid, $ref);
    $stmt->execute();
    $pid = $stmt->insert_id;
    $stmt->close();
    
    // The trg_payments_after_insert trigger will automatically update the enrollment to 'eligible' for us!
    $count++;
}
$conn->commit();
echo "Inserted $count payments and updated eligibility.\n";
