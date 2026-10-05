<?php
require_once __DIR__ . '/../../../src/core/bootstrap.php';
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed.']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$email = $data['email'] ?? '';

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid email']);
    exit;
}

$stmt = $conn->prepare("SELECT full_name FROM candidates c JOIN users u ON u.id = c.user_id WHERE u.email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$res = $stmt->get_result()->fetch_assoc();
$stmt->close();

if ($res && !empty($res['full_name'])) {
    $parts = explode(' ', trim($res['full_name']));
    $firstName = htmlspecialchars($parts[0], ENT_QUOTES, 'UTF-8');
    echo json_encode(['status' => 'success', 'name' => $firstName]);
} else {
    echo json_encode(['status' => 'error', 'message' => 'Not found']);
}
