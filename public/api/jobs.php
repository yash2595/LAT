<?php
declare(strict_types=1);

require_once __DIR__ . '/../../src/core/bootstrap.php';
require_once __DIR__ . '/../../src/core/candidate_resolver.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$candidateId = resolve_candidate_id($_GET);

// Get the candidate's level via attempts → results
$stmt = $conn->prepare("
    SELECT r.level_assigned
    FROM results r
    JOIN attempts att ON att.id = r.attempt_id
    WHERE att.candidate_id = ? AND att.status = 'submitted'
    ORDER BY r.id DESC
    LIMIT 1
");
$stmt->bind_param("i", $candidateId);
$stmt->execute();
$row = $stmt->get_result()->fetch_assoc();
$stmt->close();

$candidateLevel = $row['level_assigned'] ?? 0;


if ($method === 'GET' && $action === 'list') {
    // Better SQL filter using FIND_IN_SET
    $stmt = $conn->prepare("
        SELECT j.id, j.company_name, j.job_title, j.description, j.salary_range, j.location, j.created_at, j.jd_pdf_path, j.apply_link,
               (SELECT COUNT(*) FROM job_applications a WHERE a.job_id = j.id AND a.candidate_id = ?) as has_applied
        FROM job_opportunities j
        WHERE j.status = 'active' AND FIND_IN_SET(?, j.target_levels) > 0
        ORDER BY j.created_at DESC
    ");
    
    // Since candidateLevel might be an integer/string, we cast it
    $lvlStr = (string)$candidateLevel;
    $stmt->bind_param("is", $candidateId, $lvlStr);
    $stmt->execute();
    $jobs = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $stmt->close();

    send_json_response('success', 'Jobs fetched', $jobs);
}

if ($method === 'POST' && $action === 'apply') {
    require_csrf();
    $rawInput = file_get_contents('php://input');
    $data = json_decode($rawInput, true);
    
    $jobId = (int)($data['job_id'] ?? 0);
    if (!$jobId) {
        send_json_response('error', 'Job ID is required', null, 400);
    }
    
    // Verify eligibility again
    $stmt = $conn->prepare("SELECT target_levels FROM job_opportunities WHERE id = ? AND status = 'active'");
    $stmt->bind_param("i", $jobId);
    $stmt->execute();
    $job = $stmt->get_result()->fetch_assoc();
    $stmt->close();
    
    if (!$job) {
        send_json_response('error', 'Job not found or inactive', null, 404);
    }
    
    $levels = explode(',', $job['target_levels']);
    $levels = array_map('trim', $levels);
    
    if (!in_array((string)$candidateLevel, $levels, true)) {
        send_json_response('error', 'You are not eligible for this opportunity based on your current level.', null, 403);
    }

    $stmt = $conn->prepare("INSERT INTO job_applications (job_id, candidate_id) VALUES (?, ?)");
    $stmt->bind_param("ii", $jobId, $candidateId);
    try {
        if ($stmt->execute()) {
            send_json_response('success', 'Application submitted successfully');
        } else {
            send_json_response('error', 'Could not submit application', null, 500);
        }
    } catch (Throwable $e) {
        // Likely unique constraint violation
        send_json_response('error', 'You have already applied for this job', null, 400);
    }
}

send_json_response('error', 'Invalid action', null, 400);
