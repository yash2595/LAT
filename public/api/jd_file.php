<?php
declare(strict_types=1);

require_once __DIR__ . '/../../src/core/bootstrap.php';
require_once __DIR__ . '/../../src/core/candidate_resolver.php';

$jobId = (int)($_GET['id'] ?? 0);
if (!$jobId) {
    http_response_code(400);
    die('Invalid job ID');
}

// Check admin vs candidate
$isAdmin = is_admin_authenticated($conn);
$candidateId = 0;
$candidateLevel = 0;

if (!$isAdmin) {
    $candidateId = resolve_candidate_id($_GET);
    if (!$candidateId) {
        http_response_code(401);
        die('Unauthorized');
    }

    // Get candidate's level
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
    $candidateLevel = (int)($row['level_assigned'] ?? 0);
}

// Fetch job — admins can access any job's PDF; candidates only see active ones
$jobQuery = $isAdmin
    ? "SELECT target_levels, jd_pdf_path FROM job_opportunities WHERE id = ?"
    : "SELECT target_levels, jd_pdf_path FROM job_opportunities WHERE id = ? AND status = 'active'";
$stmt = $conn->prepare($jobQuery);
$stmt->bind_param("i", $jobId);
$stmt->execute();
$job = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$job || !$job['jd_pdf_path']) {
    http_response_code(404);
    die('PDF not found.');
}

if (!$isAdmin) {
    // Check if candidate level is allowed
    $levels = array_filter(array_map('trim', explode(',', $job['target_levels'])));
    if (!in_array((string)$candidateLevel, $levels, true)) {
        http_response_code(403);
        die('You do not have permission to view this JD.');
    }
}

// Serve the file
$filepath = __DIR__ . '/../../storage/' . $job['jd_pdf_path'];

if (!file_exists($filepath)) {
    http_response_code(404);
    die('File missing on server.');
}

// Use finfo if available, fallback to application/pdf for .pdf extension
$mime = 'application/pdf';
if (function_exists('mime_content_type')) {
    $detected = mime_content_type($filepath);
    if ($detected !== false) $mime = $detected;
} elseif (class_exists('finfo')) {
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $detected = $finfo->file($filepath);
    if ($detected !== false) $mime = $detected;
}
$filename = basename($filepath);

header('Content-Type: ' . $mime);
header('Content-Disposition: inline; filename="' . $filename . '"');
header('Content-Length: ' . filesize($filepath));
header('Cache-Control: private, max-age=86400'); // Cache for 1 day

readfile($filepath);
exit;
