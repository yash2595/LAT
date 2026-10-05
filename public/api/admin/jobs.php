<?php
declare(strict_types=1);

require_once __DIR__ . '/../../../src/core/bootstrap.php';
require_admin_access($conn);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// ─── LIST ALL JOBS ────────────────────────────────────────────────────────────
if ($method === 'GET' && $action === 'list') {
    $result = $conn->query("
        SELECT j.*,
               (SELECT COUNT(*) FROM job_applications a WHERE a.job_id = j.id) as application_count
        FROM job_opportunities j
        ORDER BY j.created_at DESC
    ");
    $jobs = $result ? $result->fetch_all(MYSQLI_ASSOC) : [];
    send_json_response('success', 'Jobs fetched', $jobs);
}

// ─── CREATE JOB ───────────────────────────────────────────────────────────────
if ($method === 'POST' && $action === 'create') {
    require_csrf();
    
    // Support both JSON and multipart/form-data
    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
    if (strpos($contentType, 'application/json') !== false) {
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
    } else {
        if (empty($_POST) && isset($_SERVER['CONTENT_LENGTH']) && (int)$_SERVER['CONTENT_LENGTH'] > 0) {
            send_json_response('error', 'The uploaded file is too large and exceeds the server limit.', null, 413);
        }
        $data = $_POST;
    }

    $companyName  = trim((string)($data['company_name']  ?? ''));
    $jobTitle     = trim((string)($data['job_title']     ?? ''));
    $description  = trim((string)($data['description']  ?? ''));
    $targetLevels = trim((string)($data['target_levels'] ?? '')); // e.g. "1,2,3"
    $salary       = trim((string)($data['salary_range']  ?? ''));
    $location     = trim((string)($data['location']      ?? ''));
    $applyLink    = trim((string)($data['apply_link']    ?? ''));

    if (!$companyName || !$jobTitle || !$targetLevels) {
        send_json_response('error', 'Company name, job title, and target levels are required.', null, 400);
    }

    $pdfPath = null;
    if (isset($_FILES['jd_pdf']) && $_FILES['jd_pdf']['error'] === UPLOAD_ERR_OK) {
        $file = $_FILES['jd_pdf'];
        
        // Validate size (e.g. 5MB)
        if ($file['size'] > 5 * 1024 * 1024) {
            send_json_response('error', 'PDF file exceeds 5MB limit.', null, 400);
        }

        // Validate type
        $mime = $file['type'] ?? '';
        if ($mime !== 'application/pdf') {
            send_json_response('error', 'Only PDF files are allowed.', null, 400);
        }

        $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        if ($ext !== 'pdf') {
            send_json_response('error', 'Only PDF files are allowed.', null, 400);
        }

        $filename = uniqid('jd_', true) . '.pdf';
        $uploadDir = __DIR__ . '/../../../storage/jd_pdfs';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }
        
        $destPath = $uploadDir . '/' . $filename;
        if (move_uploaded_file($file['tmp_name'], $destPath)) {
            $pdfPath = 'jd_pdfs/' . $filename; // Relative path
        } else {
            send_json_response('error', 'Failed to save uploaded file.', null, 500);
        }
    }

    $stmt = $conn->prepare(
        "INSERT INTO job_opportunities (company_name, job_title, description, target_levels, salary_range, location, jd_pdf_path, apply_link)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    );
    $stmt->bind_param("ssssssss", $companyName, $jobTitle, $description, $targetLevels, $salary, $location, $pdfPath, $applyLink);
    if ($stmt->execute()) {
        send_json_response('success', 'Job opportunity posted successfully', ['id' => $conn->insert_id]);
    } else {
        send_json_response('error', 'Database error: ' . $conn->error, null, 500);
    }
}

// ─── EDIT JOB ─────────────────────────────────────────────────────────────────
if ($method === 'POST' && $action === 'edit') {
    require_csrf();
    
    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
    if (strpos($contentType, 'application/json') !== false) {
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
    } else {
        if (empty($_POST) && isset($_SERVER['CONTENT_LENGTH']) && (int)$_SERVER['CONTENT_LENGTH'] > 0) {
            send_json_response('error', 'The uploaded file is too large and exceeds the server limit.', null, 413);
        }
        $data = $_POST;
    }

    $jobId        = (int)($data['id'] ?? 0);
    $companyName  = trim((string)($data['company_name']  ?? ''));
    $jobTitle     = trim((string)($data['job_title']     ?? ''));
    $description  = trim((string)($data['description']  ?? ''));
    $targetLevels = trim((string)($data['target_levels'] ?? ''));
    $salary       = trim((string)($data['salary_range']  ?? ''));
    $location     = trim((string)($data['location']      ?? ''));
    $applyLink    = trim((string)($data['apply_link']    ?? ''));

    if (!$jobId || !$companyName || !$jobTitle || !$targetLevels) {
        error_log('[JD-EDIT-DEBUG] POST=' . json_encode($_POST) . ' FILES=' . json_encode(array_keys($_FILES)));
        send_json_response('error', 'Job ID, Company name, job title, and target levels are required.', null, 400);
    }

    $pdfPath = null;
    $hasNewPdf = false;
    if (isset($_FILES['jd_pdf']) && $_FILES['jd_pdf']['error'] === UPLOAD_ERR_OK) {
        $file = $_FILES['jd_pdf'];
        if ($file['size'] > 5 * 1024 * 1024) send_json_response('error', 'PDF file exceeds 5MB limit.', null, 400);
        $mime = $file['type'] ?? '';
        if ($mime !== 'application/pdf') send_json_response('error', 'Only PDF files are allowed.', null, 400);
        $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        if ($ext !== 'pdf') send_json_response('error', 'Only PDF files are allowed.', null, 400);

        $filename = uniqid('jd_', true) . '.pdf';
        $uploadDir = __DIR__ . '/../../../storage/jd_pdfs';
        if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);
        
        $destPath = $uploadDir . '/' . $filename;
        if (move_uploaded_file($file['tmp_name'], $destPath)) {
            $pdfPath = 'jd_pdfs/' . $filename;
            $hasNewPdf = true;
        } else {
            send_json_response('error', 'Failed to save uploaded file.', null, 500);
        }
    }

    if ($hasNewPdf) {
        $stmt = $conn->prepare(
            "UPDATE job_opportunities 
             SET company_name=?, job_title=?, description=?, target_levels=?, salary_range=?, location=?, apply_link=?, jd_pdf_path=? 
             WHERE id=?"
        );
        $stmt->bind_param("ssssssssi", $companyName, $jobTitle, $description, $targetLevels, $salary, $location, $applyLink, $pdfPath, $jobId);
    } else {
        $stmt = $conn->prepare(
            "UPDATE job_opportunities 
             SET company_name=?, job_title=?, description=?, target_levels=?, salary_range=?, location=?, apply_link=? 
             WHERE id=?"
        );
        $stmt->bind_param("sssssssi", $companyName, $jobTitle, $description, $targetLevels, $salary, $location, $applyLink, $jobId);
    }

    if ($stmt->execute()) {
        send_json_response('success', 'Job opportunity updated successfully');
    } else {
        send_json_response('error', 'Database error: ' . $conn->error, null, 500);
    }
}

// ─── TOGGLE JOB STATUS (active / inactive) ────────────────────────────────────
if ($method === 'POST' && $action === 'update_status') {
    require_csrf();
    $data   = json_decode(file_get_contents('php://input'), true);
    $jobId  = (int)($data['job_id'] ?? 0);
    $status = trim((string)($data['status'] ?? ''));

    if (!$jobId || !in_array($status, ['active', 'inactive'], true)) {
        send_json_response('error', 'Invalid parameters', null, 400);
    }

    $stmt = $conn->prepare("UPDATE job_opportunities SET status = ? WHERE id = ?");
    $stmt->bind_param("si", $status, $jobId);
    $stmt->execute();
    send_json_response('success', 'Job status updated');
}

// ─── DELETE JOB ───────────────────────────────────────────────────────────────
if ($method === 'POST' && $action === 'delete') {
    require_csrf();
    $data  = json_decode(file_get_contents('php://input'), true);
    $jobId = (int)($data['job_id'] ?? 0);

    if (!$jobId) {
        send_json_response('error', 'Job ID required', null, 400);
    }

    $stmt = $conn->prepare("DELETE FROM job_opportunities WHERE id = ?");
    $stmt->bind_param("i", $jobId);
    $stmt->execute();
    send_json_response('success', 'Job deleted successfully');
}

// ─── LIST APPLICANTS FOR A JOB ────────────────────────────────────────────────
if ($method === 'GET' && $action === 'applications') {
    $jobId = (int)($_GET['job_id'] ?? 0);
    if (!$jobId) {
        send_json_response('error', 'Job ID required', null, 400);
    }

    $stmt = $conn->prepare("
        SELECT ja.id AS application_id, ja.status, ja.applied_at,
               c.id  AS candidate_id, c.full_name, c.phone, u.email,
               r.level_assigned, r.percentage
        FROM job_applications ja
        JOIN candidates c ON c.id = ja.candidate_id
        LEFT JOIN users u ON u.id = c.user_id
        LEFT JOIN (
            SELECT att.candidate_id, MAX(att.id) as max_attempt_id
            FROM attempts att
            WHERE att.status = 'submitted'
            GROUP BY att.candidate_id
        ) max_att ON max_att.candidate_id = c.id
        LEFT JOIN results r ON r.attempt_id = max_att.max_attempt_id
        WHERE ja.job_id = ?
        ORDER BY ja.applied_at DESC
    ");
    $stmt->bind_param("i", $jobId);
    $stmt->execute();
    $apps = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $stmt->close();
    send_json_response('success', 'Applications fetched', $apps);
}

// ─── DELETE APPLICATION ───────────────────────────────────────────────────────
if ($method === 'POST' && $action === 'delete_application') {
    require_csrf();
    $data  = json_decode(file_get_contents('php://input'), true);
    $appId = (int)($data['application_id'] ?? 0);
    if (!$appId) {
        send_json_response('error', 'Application ID required', null, 400);
    }
    $stmt = $conn->prepare("DELETE FROM job_applications WHERE id = ?");
    $stmt->bind_param("i", $appId);
    $stmt->execute();
    send_json_response('success', 'Application deleted successfully');
}

send_json_response('error', 'Invalid action', null, 400);
