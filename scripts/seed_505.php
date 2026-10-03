<?php
require_once __DIR__ . '/../src/core/bootstrap.php';
require_once __DIR__ . '/../src/modules/m1_ai_qbank/queries.php';
$conn->begin_transaction();

// 1. Generate 100 questions
echo "Generating 100 questions...\n";
$bank_id = 1; // Assuming bank_id 1 is valid, we can create it if not.
$res = $conn->query("SELECT id FROM question_banks LIMIT 1");
if ($row = $res->fetch_assoc()) {
    $bank_id = $row['id'];
} else {
    $conn->query("INSERT INTO question_banks (name, description) VALUES ('Default Bank', 'Generated')");
    $bank_id = $conn->insert_id;
}

$q_count = 0;
for ($i = 0; $i < 100; $i++) {
    $title = "Auto Generated Question " . time() . " - " . $i;
    $q_id = insert_question($bank_id, $title, 'Medium', $conn, 'approved');
    
    // Insert 4 options
    insert_question_option($q_id, 'Correct option', 1, $conn);
    insert_question_option($q_id, 'Wrong option 1', 0, $conn);
    insert_question_option($q_id, 'Wrong option 2', 0, $conn);
    insert_question_option($q_id, 'Wrong option 3', 0, $conn);
    $q_count++;
}
echo "Created $q_count questions.\n";

// 2. Create provisional schedule for 5:05
$assessment_id = 1;
$res = $conn->query("SELECT id FROM assessments LIMIT 1");
if ($row = $res->fetch_assoc()) {
    $assessment_id = $row['id'];
} else {
    $conn->query("INSERT INTO assessments (title, description, duration_minutes, total_questions, passing_percentage, status) VALUES ('Full Stack Developer Assessment', 'Generated', 60, 100, 60.00, 'published')");
    $assessment_id = $conn->insert_id;
}

$exam_date = date('Y-m-d', strtotime('+3 days'));
$start_time = '17:05:00';
$end_time = '18:05:00';

$batch_number = 'PROV-' . date('Ymd-His');
$stmt = $conn->prepare('INSERT INTO batches(batch_number,assessment_id) VALUES(?,?)');
$stmt->bind_param('si', $batch_number, $assessment_id);
$stmt->execute();
$batch_id = $stmt->insert_id;
$stmt->close();

$stmt = $conn->prepare("INSERT INTO exam_schedules (batch_id, exam_date, status) VALUES (?, ?, 'provisional')");
$stmt->bind_param("is", $batch_id, $exam_date);
$stmt->execute();
$schedule_id = $stmt->insert_id;
$stmt->close();

$stmt = $conn->prepare("INSERT INTO exam_slots (exam_schedule_id, start_time, end_time, capacity, seats_remaining) VALUES (?, ?, ?, 150, 150)");
$stmt->bind_param("iss", $schedule_id, $start_time, $end_time);
$stmt->execute();
$stmt->close();
echo "Created provisional schedule $schedule_id for $start_time.\n";

// 3. Create 120 candidates
$c_count = 0;
$pwd_hash = password_hash('password123', PASSWORD_BCRYPT); // hash once for speed
for ($i = 0; $i < 120; $i++) {
    $email = ($i === 0) ? "livematch2501@gmail.com" : "auto_cand_505_" . time() . "_$i@example.com";
    $name = ($i === 0) ? "Live Match User" : "Candidate 505 $i";

    // check if user exists
    $stmt = $conn->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $res = $stmt->get_result();
    if ($row = $res->fetch_assoc()) {
        $user_id = $row['id'];
    } else {
        $stmt_ins = $conn->prepare("INSERT INTO users (email, password, role) VALUES (?, ?, 'candidate')");
        $stmt_ins->bind_param("ss", $email, $pwd_hash);
        $stmt_ins->execute();
        $user_id = $stmt_ins->insert_id;
        $stmt_ins->close();
    }
    $stmt->close();

    // check if candidate exists
    $stmt = $conn->prepare("SELECT id FROM candidates WHERE user_id = ?");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $res = $stmt->get_result();
    if ($row = $res->fetch_assoc()) {
        $cand_id = $row['id'];
    } else {
        $phone = "99" . str_pad($i, 8, "0", STR_PAD_LEFT);
        $stmt_ins = $conn->prepare("INSERT INTO candidates (user_id, full_name, phone) VALUES (?, ?, ?)");
        $stmt_ins->bind_param("iss", $user_id, $name, $phone);
        $stmt_ins->execute();
        $cand_id = $stmt_ins->insert_id;
        $stmt_ins->close();
    }
    $stmt->close();
    
    // create enrollment (ignore if exists for this assessment to avoid duplicates)
    $stmt = $conn->prepare("SELECT id FROM enrollments WHERE candidate_id = ? AND assessment_id = ?");
    $stmt->bind_param("ii", $cand_id, $assessment_id);
    $stmt->execute();
    $res = $stmt->get_result();
    if ($row = $res->fetch_assoc()) {
        // update existing enrollment to new provisional schedule
        $stmt_up = $conn->prepare("UPDATE enrollments SET provisional_schedule_id = ?, batch_id = NULL WHERE id = ?");
        $eid = $row['id'];
        $stmt_up->bind_param("ii", $schedule_id, $eid);
        $stmt_up->execute();
        $stmt_up->close();
    } else {
        $stmt_ins = $conn->prepare("INSERT INTO enrollments (candidate_id, assessment_id, provisional_schedule_id, eligibility_status) VALUES (?, ?, ?, 'eligible')");
        $stmt_ins->bind_param("iii", $cand_id, $assessment_id, $schedule_id);
        $stmt_ins->execute();
        $stmt_ins->close();
    }
    $stmt->close();
    
    // create payment if none exists
    $stmt = $conn->prepare("SELECT id FROM payments WHERE candidate_id = ? AND assessment_id = ? AND status = 'success'");
    $stmt->bind_param("ii", $cand_id, $assessment_id);
    $stmt->execute();
    $res = $stmt->get_result();
    if (!$row = $res->fetch_assoc()) {
        $ref = "REF_505_" . time() . "_$i";
        $stmt_ins = $conn->prepare("INSERT INTO payments (candidate_id, assessment_id, amount, status, reference_number) VALUES (?, ?, 500, 'success', ?)");
        $stmt_ins->bind_param("iis", $cand_id, $assessment_id, $ref);
        $stmt_ins->execute();
        $stmt_ins->close();
    }
    $stmt->close();
    
    $c_count++;
}
echo "Created/Updated $c_count candidates and enrolled them in the provisional schedule (including livematch2501@gmail.com).\n";

$conn->commit();
echo "Done!\n";
