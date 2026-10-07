<?php
/**
 * Seed: 5:20 PM TODAY batch with 110 registered candidates
 * Run: php scripts/seed_520.php
 */
require_once __DIR__ . '/../src/core/bootstrap.php';
require_once __DIR__ . '/../src/modules/m1_ai_qbank/queries.php';

$conn->begin_transaction();
try {

// ---------- 1. Get assessment ----------
$res = $conn->query("SELECT id FROM assessments LIMIT 1");
$assessment_id = ($row = $res->fetch_assoc()) ? (int)$row['id'] : null;
if (!$assessment_id) {
    $conn->query("INSERT INTO assessments (title, description, duration_minutes, total_questions, passing_percentage, status) VALUES ('MYLAT Level Assessment', 'Auto seeded', 60, 100, 60.00, 'active')");
    $assessment_id = (int)$conn->insert_id;
}
echo "Assessment ID: $assessment_id\n";

// ---------- 2. Get question bank ----------
$res = $conn->query("SELECT id FROM question_banks WHERE assessment_id = $assessment_id LIMIT 1");
if (!($row = $res->fetch_assoc())) {
    $conn->query("INSERT INTO question_banks (name, assessment_id) VALUES ('Auto Bank $assessment_id', $assessment_id)");
    $bank_id = (int)$conn->insert_id;
} else {
    $bank_id = (int)$row['id'];
}
echo "Question Bank ID: $bank_id\n";

// ---------- 3. Generate 100 questions ----------
echo "Generating 100 questions...\n";
$topics = ['PHP', 'MySQL', 'JavaScript', 'HTML', 'CSS', 'React', 'Laravel', 'Node.js', 'Git', 'REST API'];
$difficulties = ['Easy', 'Medium', 'Hard'];
for ($i = 0; $i < 100; $i++) {
    $topic = $topics[$i % count($topics)];
    $diff  = $difficulties[$i % count($difficulties)];
    $q_text = "Question #{$i}: Which of the following best describes a concept in {$topic}?";
    $q_id = insert_question($bank_id, $q_text, $diff, $conn, 'approved');
    insert_question_option($q_id, "Correct answer for Q{$i}", 1, $conn);
    insert_question_option($q_id, "Wrong choice A for Q{$i}", 0, $conn);
    insert_question_option($q_id, "Wrong choice B for Q{$i}", 0, $conn);
    insert_question_option($q_id, "Wrong choice C for Q{$i}", 0, $conn);
}
echo "100 questions created.\n";

// ---------- 4. Create batch ----------
$batch_number = 'BATCH-520-' . date('Ymd');
// Check duplicate
$res = $conn->query("SELECT id FROM batches WHERE batch_number = '$batch_number'");
if ($row = $res->fetch_assoc()) {
    $batch_id = (int)$row['id'];
    echo "Reusing existing batch $batch_number (ID: $batch_id)\n";
} else {
    $stmt = $conn->prepare('INSERT INTO batches(batch_number, assessment_id) VALUES(?, ?)');
    $stmt->bind_param('si', $batch_number, $assessment_id);
    $stmt->execute();
    $batch_id = (int)$stmt->insert_id;
    $stmt->close();
    echo "Created batch $batch_number (ID: $batch_id)\n";
}

// ---------- 5. Create exam schedule (provisional) for TODAY 5:20 PM ----------
$exam_date  = date('Y-m-d'); // TODAY
$start_time = '17:20:00';
$end_time   = '18:20:00';
$capacity   = 150;

$stmt = $conn->prepare("INSERT INTO exam_schedules (batch_id, exam_date, status) VALUES (?, ?, 'provisional')");
$stmt->bind_param('is', $batch_id, $exam_date);
$stmt->execute();
$schedule_id = (int)$stmt->insert_id;
$stmt->close();

$stmt = $conn->prepare("INSERT INTO exam_slots (exam_schedule_id, start_time, end_time, capacity, seats_remaining) VALUES (?, ?, ?, ?, ?)");
$stmt->bind_param('issii', $schedule_id, $start_time, $end_time, $capacity, $capacity);
$stmt->execute();
$stmt->close();
echo "Schedule ID: $schedule_id | Slot: $start_time - $end_time | Date: $exam_date\n";

// ---------- 6. Create 110 candidates ----------
echo "Creating 110 candidates...\n";
$pwd_hash = password_hash('Password@123', PASSWORD_BCRYPT);

for ($i = 0; $i < 110; $i++) {
    // livematch2501@gmail.com goes in as candidate 0
    if ($i === 0) {
        $email = 'livematch2501@gmail.com';
        $name  = 'Yash Mishra (You)';
    } else {
        $ts    = substr(time(), -4);
        $email = "cand520_{$ts}_{$i}@mylat.test";
        $name  = "Candidate 520-{$i}";
    }

    // --- user ---
    $stmt = $conn->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->bind_param('s', $email);
    $stmt->execute();
    $user_id = (int)(($stmt->get_result()->fetch_assoc())['id'] ?? 0);
    $stmt->close();

    if (!$user_id) {
        $stmt = $conn->prepare("INSERT INTO users (email, password, role) VALUES (?, ?, 'candidate')");
        $stmt->bind_param('ss', $email, $pwd_hash);
        $stmt->execute();
        $user_id = (int)$conn->insert_id;
        $stmt->close();
    }

    // --- candidate ---
    $stmt = $conn->prepare("SELECT id FROM candidates WHERE user_id = ?");
    $stmt->bind_param('i', $user_id);
    $stmt->execute();
    $cand_id = (int)(($stmt->get_result()->fetch_assoc())['id'] ?? 0);
    $stmt->close();

    if (!$cand_id) {
        $phone = '9' . str_pad($i + 800000000, 9, '0', STR_PAD_LEFT);
        $stmt  = $conn->prepare("INSERT INTO candidates (user_id, full_name, phone) VALUES (?, ?, ?)");
        $stmt->bind_param('iss', $user_id, $name, $phone);
        $stmt->execute();
        $cand_id = (int)$conn->insert_id;
        $stmt->close();
    }

    // --- payment (if not already paid) ---
    $stmt = $conn->prepare("SELECT id FROM payments WHERE candidate_id = ? AND assessment_id = ? AND status = 'success'");
    $stmt->bind_param('ii', $cand_id, $assessment_id);
    $stmt->execute();
    $pay_id = (int)(($stmt->get_result()->fetch_assoc())['id'] ?? 0);
    $stmt->close();

    if (!$pay_id) {
        $ref  = 'REF-520-' . $cand_id . '-' . time();
        $stmt = $conn->prepare("INSERT INTO payments (candidate_id, assessment_id, amount, status, reference_number) VALUES (?, ?, 500, 'success', ?)");
        $stmt->bind_param('iis', $cand_id, $assessment_id, $ref);
        $stmt->execute();
        $pay_id = (int)$conn->insert_id;
        $stmt->close();
    }

    // --- enrollment ---
    $stmt = $conn->prepare("SELECT id FROM enrollments WHERE candidate_id = ? AND assessment_id = ?");
    $stmt->bind_param('ii', $cand_id, $assessment_id);
    $stmt->execute();
    $enr = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if ($enr) {
        // Update to new provisional schedule, clear old batch
        $eid = (int)$enr['id'];
        $stmt = $conn->prepare("UPDATE enrollments SET provisional_schedule_id = ?, batch_id = NULL, eligibility_status = 'eligible', payment_id = ? WHERE id = ?");
        $stmt->bind_param('iii', $schedule_id, $pay_id, $eid);
        $stmt->execute();
        $stmt->close();
    } else {
        $stmt = $conn->prepare("INSERT INTO enrollments (candidate_id, assessment_id, payment_id, provisional_schedule_id, eligibility_status) VALUES (?, ?, ?, ?, 'eligible')");
        $stmt->bind_param('iiii', $cand_id, $assessment_id, $pay_id, $schedule_id);
        $stmt->execute();
        $stmt->close();
    }
}
echo "110 candidates enrolled.\n";

$conn->commit();
echo "\n========================================\n";
echo "SUCCESS!\n";
echo "Batch    : $batch_number (ID: $batch_id)\n";
echo "Date     : $exam_date\n";
echo "Time     : $start_time - $end_time\n";
echo "Candidates: 110\n";
echo "livematch2501@gmail.com is enrolled.\n";
echo "========================================\n";

} catch (Throwable $e) {
    $conn->rollback();
    echo "ERROR on line " . $e->getLine() . ": " . $e->getMessage() . "\n";
}
