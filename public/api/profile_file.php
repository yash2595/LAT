<?php
declare(strict_types=1);

require_once __DIR__ . '/../../src/core/bootstrap.php';
require_once __DIR__ . '/../../src/core/candidate_resolver.php';

header('Cache-Control: private, no-store');
header('X-Content-Type-Options: nosniff');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    header('Allow: GET');
    exit('Method not allowed.');
}

try {
    $candidateId = resolve_candidate_id($_GET);
    $type = $_GET['type'] ?? '';
    if (!in_array($type, ['photo', 'resume'], true)) {
        http_response_code(400);
        exit('Invalid profile file type.');
    }
    $download = ($_GET['download'] ?? '') === '1';
    if ($type === 'photo' && $download) {
        http_response_code(400);
        exit('Download is only available for resumes.');
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

    $profileDetails = $row && !empty($row['profile_details'])
        ? json_decode($row['profile_details'], true)
        : [];
    $filename = is_array($profileDetails) ? ($profileDetails[$type . '_file'] ?? '') : '';

    if (!is_string($filename) || !preg_match('/\A[a-f0-9]{32}\.(?:jpg|png|webp|pdf)\z/', $filename)) {
        http_response_code(404);
        exit('File not found.');
    }

    $extension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
    $allowedExtensions = $type === 'photo' ? ['jpg', 'png', 'webp'] : ['pdf'];
    if (!in_array($extension, $allowedExtensions, true)) {
        http_response_code(404);
        exit('File not found.');
    }

    $path = __DIR__ . '/../../storage/candidate_profiles/' . $filename;
    if (!is_file($path) || !is_readable($path)) {
        http_response_code(404);
        exit('File not found.');
    }

    $contentTypes = [
        'jpg' => 'image/jpeg',
        'png' => 'image/png',
        'webp' => 'image/webp',
        'pdf' => 'application/pdf',
    ];
    header('Content-Type: ' . $contentTypes[$extension]);
    header('Content-Length: ' . (string)filesize($path));
    $disposition = $type === 'photo' || !$download ? 'inline' : 'attachment';
    header('Content-Disposition: ' . $disposition . '; filename="' . ($type === 'photo' ? 'profile-photo.' . $extension : 'resume.pdf') . '"');
    readfile($path);
} catch (Throwable $e) {
    error_log('Candidate profile file error: ' . $e->getMessage());
    http_response_code(500);
    exit('Unable to load profile file.');
}
