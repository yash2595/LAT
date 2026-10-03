<?php
require 'src/core/bootstrap.php';

// 1. Get the latest provisional schedule (our 5:20 batch)
$r = $conn->query("SELECT es.id as sched_id, es.batch_id, es.exam_date, sl.id as slot_id, sl.start_time, sl.end_time FROM exam_schedules es JOIN exam_slots sl ON sl.exam_schedule_id=es.id WHERE es.status='provisional' ORDER BY es.id DESC LIMIT 1");
$s = $r->fetch_assoc();
if (!$s) { die("No provisional schedule found!\n"); }
echo "Schedule ID: {$s['sched_id']}, Batch ID: {$s['batch_id']}, Slot ID: {$s['slot_id']}, Time: {$s['start_time']}\n";

// 2. Finalize batch: provisional -> scheduled
$conn->query("UPDATE exam_schedules SET status='scheduled' WHERE id={$s['sched_id']}");
echo "Batch finalized to 'scheduled'.\n";

// 3. Get candidate for livematch2501@gmail.com
$r2 = $conn->query("SELECT c.id FROM candidates c JOIN users u ON u.id=c.user_id WHERE u.email='livematch2501@gmail.com'");
$c = $r2->fetch_assoc();
if (!$c) { die("Candidate not found!\n"); }
$cand_id = (int)$c['id'];
echo "Candidate ID: $cand_id\n";

// 4. Get assessment
$r3 = $conn->query("SELECT id FROM assessments LIMIT 1");
$a = $r3->fetch_assoc();
$ass_id = (int)$a['id'];
$batch_id = (int)$s['batch_id'];

// 5. Update enrollment - remove provisional, attach batch
$conn->query("UPDATE enrollments SET batch_id=$batch_id, provisional_schedule_id=NULL WHERE candidate_id=$cand_id AND assessment_id=$ass_id");
echo "Enrollment updated: batch_id=$batch_id\n";

// 6. Check if attempt already exists
$r4 = $conn->query("SELECT id FROM attempts WHERE candidate_id=$cand_id AND assessment_id=$ass_id ORDER BY id DESC LIMIT 1");
$existing = $r4->fetch_assoc();
if ($existing) {
    // Update existing attempt slot
    $slot_id = (int)$s['slot_id'];
    $conn->query("UPDATE attempts SET exam_slot_id=$slot_id, status='in_progress' WHERE id={$existing['id']}");
    $attempt_id = $existing['id'];
    echo "Existing attempt {$attempt_id} updated.\n";
} else {
    // Create fresh attempt
    $slot_id = (int)$s['slot_id'];
    $stmt = $conn->prepare("INSERT INTO attempts (candidate_id, assessment_id, exam_slot_id, status) VALUES (?,?,?,'in_progress')");
    $stmt->bind_param('iii', $cand_id, $ass_id, $slot_id);
    $stmt->execute();
    $attempt_id = $conn->insert_id;
    echo "New attempt created: $attempt_id\n";
}

echo "\n========================================\n";
echo "SUCCESS!\n";
echo "Batch: SCHEDULED\n";
echo "Candidate ID: $cand_id\n";
echo "Attempt ID: $attempt_id\n";
echo "Go to: http://localhost:8000/take-exam.php?attempt_id=$attempt_id\n";
echo "========================================\n";
