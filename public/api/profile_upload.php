<?php
declare(strict_types=1);

require_once __DIR__ . '/../../src/core/bootstrap.php';
require_once __DIR__ . '/../../src/core/candidate_resolver.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_json_response('error', 'Method not allowed.', null, 405);
}

require_csrf();

$destination = null;
try {
    $candidateId = resolve_candidate_id($_POST);
    $type = $_POST['type'] ?? '';

    if (!in_array($type, ['photo', 'resume'], true)) {
        send_json_response('error', 'Choose a profile photo or resume to upload.', null, 400);
    }

    $file = $_FILES['file'] ?? null;
    if (!$file || !isset($file['error'])) {
        send_json_response('error', 'Select a file to upload.', null, 400);
    }
    if ($file['error'] !== UPLOAD_ERR_OK) {
        $status = in_array($file['error'], [UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE], true) ? 413 : 400;
        $message = $status === 413
            ? 'The selected file exceeds the 5 MB upload limit.'
            : 'The file could not be uploaded. Please select it again.';
        send_json_response('error', $message, null, $status);
    }
    if ((int)$file['size'] > 5 * 1024 * 1024) {
        send_json_response('error', 'The selected file exceeds the 5 MB upload limit.', null, 413);
    }

    $mime = (new finfo(FILEINFO_MIME_TYPE))->file($file['tmp_name']);
    if ($type === 'photo') {
        $extensions = [
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/webp' => 'webp',
        ];
        if (!isset($extensions[$mime])) {
            send_json_response('error', 'Profile photos must be JPG, PNG, or WebP images.', null, 400);
        }
        $extension = $extensions[$mime];
    } else {
        if ($mime !== 'application/pdf' || strtolower(pathinfo($file['name'], PATHINFO_EXTENSION)) !== 'pdf') {
            send_json_response('error', 'Resumes must be PDF files.', null, 400);
        }
        $extension = 'pdf';
    }

    $storageDir = __DIR__ . '/../../storage/candidate_profiles';
    if (!is_dir($storageDir) && !mkdir($storageDir, 0750, true) && !is_dir($storageDir)) {
        throw new RuntimeException('Unable to create candidate profile storage directory.');
    }

    $filename = bin2hex(random_bytes(16)) . '.' . $extension;
    $destination = $storageDir . DIRECTORY_SEPARATOR . $filename;
    if (!move_uploaded_file($file['tmp_name'], $destination)) {
        throw new RuntimeException('Unable to store uploaded candidate profile file.');
    }

    global $conn;
    $stmt = $conn->prepare('SELECT profile_details FROM candidates WHERE id = ? LIMIT 1');
    if (!$stmt) {
        throw new RuntimeException('Unable to read candidate profile details.');
    }
    $stmt->bind_param('i', $candidateId);
    if (!$stmt->execute()) {
        throw new RuntimeException('Unable to read candidate profile details.');
    }
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$row) {
        unlink($destination);
        send_json_response('error', 'Candidate profile not found.', null, 404);
    }

    $profileDetails = [];
    if (!empty($row['profile_details'])) {
        $decoded = json_decode($row['profile_details'], true);
        if (is_array($decoded)) {
            $profileDetails = $decoded;
        }
    }

    $fileKey = $type . '_file';
    $previousFilename = $profileDetails[$fileKey] ?? null;
    $profileDetails[$fileKey] = $filename;
    $encodedDetails = json_encode($profileDetails, JSON_THROW_ON_ERROR);

    $update = $conn->prepare('UPDATE candidates SET profile_details = ? WHERE id = ?');
    if (!$update) {
        throw new RuntimeException('Unable to save candidate profile details.');
    }
    $update->bind_param('si', $encodedDetails, $candidateId);
    if (!$update->execute()) {
        $update->close();
        throw new RuntimeException('Unable to save candidate profile details.');
    }
    $update->close();

    if (is_string($previousFilename) && preg_match('/\A[a-f0-9]{32}\.(?:jpg|png|webp|pdf)\z/', $previousFilename)) {
        $previousPath = $storageDir . DIRECTORY_SEPARATOR . $previousFilename;
        if (is_file($previousPath) && !unlink($previousPath)) {
            error_log('Unable to remove replaced candidate profile file: ' . $previousFilename);
        }
    }

    send_json_response('success', 'Profile file uploaded successfully.', ['type' => $type]);
} catch (Throwable $e) {
    if (is_string($destination) && is_file($destination) && !unlink($destination)) {
        error_log('Unable to remove failed candidate profile upload: ' . basename($destination));
    }
    error_log('Candidate profile upload error: ' . $e->getMessage());
    send_json_response('error', 'Unable to upload the file. Please try again.', null, 500);
}
