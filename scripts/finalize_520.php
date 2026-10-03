<?php
require 'src/core/bootstrap.php';

// Finalize the 5:20 batch specifically
$r = $conn->query("SELECT es.id, es.batch_id, sl.id as slot_id, sl.start_time FROM exam_schedules es JOIN exam_slots sl ON sl.exam_schedule_id=es.id JOIN batches b ON b.id=es.batch_id WHERE b.batch_number='BATCH-520-20261003' LIMIT 1");
$s = $r->fetch_assoc();
if (!$s) { die("BATCH-520-20261003 not found\n"); }

echo "Finalizing BATCH-520: Schedule ID={$s['id']}, Slot ID={$s['slot_id']}, Time={$s['start_time']}\n";
$conn->query("UPDATE exam_schedules SET status='scheduled' WHERE id={$s['id']}");

// Also update ALL provisional enrolled candidates to batch_id
$conn->query("UPDATE enrollments SET batch_id={$s['batch_id']}, provisional_schedule_id=NULL WHERE provisional_schedule_id IN (SELECT id FROM exam_schedules WHERE batch_id={$s['batch_id']})");
echo "All enrollments linked to batch.\n";

// Get candidate for livematch2501@gmail.com
$r2 = $conn->query("SELECT c.id FROM candidates c JOIN users u ON u.id=c.user_id WHERE u.email='livematch2501@gmail.com'");
$cand = $r2->fetch_assoc();
if (!$cand) { die("Candidate not found!\n"); }
$cand_id = (int)$cand['id'];

$r3 = $conn->query("SELECT id FROM assessments LIMIT 1");
$ass_id = (int)$r3->fetch_assoc()['id'];
$slot_id = (int)$s['slot_id'];

// Update existing attempt or create new one linked to 5:20 slot
$r4 = $conn->query("SELECT id FROM attempts WHERE candidate_id=$cand_id ORDER BY id DESC LIMIT 1");
if ($ex = $r4->fetch_assoc()) {
    $conn->query("UPDATE attempts SET exam_slot_id=$slot_id, status='in_progress', start_time=NULL WHERE id={$ex['id']}");
    $attempt_id = $ex['id'];
    echo "Existing attempt #{$attempt_id} updated to slot $slot_id\n";
} else {
    $stmt = $conn->prepare("INSERT INTO attempts (candidate_id, assessment_id, exam_slot_id, status) VALUES (?,?,?,'in_progress')");
    $stmt->bind_param('iii', $cand_id, $ass_id, $slot_id);
    $stmt->execute();
    $attempt_id = $conn->insert_id;
    echo "New attempt created: #$attempt_id\n";
}

echo "\n========================================\n";
echo "DONE! BATCH-520-20261003 is now SCHEDULED\n";
echo "Attempt ID for livematch2501: $attempt_id\n";
echo "Direct link: http://localhost:8000/take-exam.php?attempt_id=$attempt_id\n";
echo "========================================\n";
