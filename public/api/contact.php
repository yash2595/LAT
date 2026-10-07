<?php
declare(strict_types=1);

require_once __DIR__ . '/../../src/core/bootstrap.php';
require_once __DIR__ . '/../../src/core/mailer.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_json_response('error', 'Only POST requests are supported.', null, 405);
}

// Support both JSON body and standard Form POST
$rawInput = file_get_contents('php://input');
$data = [];
if (!empty($rawInput)) {
    $decoded = json_decode($rawInput, true);
    if (is_array($decoded)) {
        $data = $decoded;
    }
}
if (empty($data)) {
    $data = $_POST;
}

$firstName = trim((string)($data['first_name'] ?? $data['firstName'] ?? ''));
$lastName = trim((string)($data['last_name'] ?? $data['lastName'] ?? ''));
if ($firstName === '' && !empty($data['name'])) {
    $parts = explode(' ', trim((string)$data['name']), 2);
    $firstName = $parts[0];
    $lastName = $parts[1] ?? '';
}
$email = trim((string)($data['email'] ?? ''));
$phone = trim((string)($data['phone'] ?? $data['phone_number'] ?? ''));
$inquiryType = trim((string)($data['inquiry_type'] ?? $data['inquiryType'] ?? $data['type_of_inquiry'] ?? $data['subject'] ?? 'General Inquiry'));
$inquiryType = substr(preg_replace('/[\r\n\t]+/', ' ', $inquiryType) ?? 'General Inquiry', 0, 120);
$message = trim((string)($data['message'] ?? ''));

if ($firstName === '') {
    send_json_response('error', 'First name is required.', ['field' => 'first_name'], 422);
}

if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    send_json_response('error', 'A valid email address is required.', ['field' => 'email'], 422);
}

if ($message === '' || strlen($message) < 5) {
    send_json_response('error', 'Please enter a message with at least 5 characters.', ['field' => 'message'], 422);
}

$ticketId = 'IB-TKT-' . date('ymd') . '-' . strtoupper(substr(md5(uniqid((string)mt_rand(), true)), 0, 4));

$inquiryRecord = [
    'ticket_id' => $ticketId,
    'first_name' => htmlspecialchars($firstName, ENT_QUOTES, 'UTF-8'),
    'last_name' => htmlspecialchars($lastName, ENT_QUOTES, 'UTF-8'),
    'full_name' => trim(htmlspecialchars($firstName . ' ' . $lastName, ENT_QUOTES, 'UTF-8')),
    'email' => filter_var($email, FILTER_SANITIZE_EMAIL),
    'phone' => htmlspecialchars($phone, ENT_QUOTES, 'UTF-8'),
    'inquiry_type' => htmlspecialchars($inquiryType, ENT_QUOTES, 'UTF-8'),
    'message' => htmlspecialchars($message, ENT_QUOTES, 'UTF-8'),
    'created_at' => date('Y-m-d H:i:s'),
    'ip' => $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1'
];

// Persist to local JSON storage log
$storageDir = __DIR__ . '/../../storage';
if (!is_dir($storageDir)) {
    @mkdir($storageDir, 0755, true);
}
$logFile = $storageDir . '/inquiries.json';
$existing = [];
if (file_exists($logFile)) {
    $content = file_get_contents($logFile);
    if (!empty($content)) {
        $decoded = json_decode($content, true);
        if (is_array($decoded)) {
            $existing = $decoded;
        }
    }
}
$existing[] = $inquiryRecord;
// Keep the last 200 inquiries
if (count($existing) > 200) {
    $existing = array_slice($existing, -200);
}
@file_put_contents($logFile, json_encode($existing, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

$recipient = trim((string)env_value('MAIL_CONTACT_TO', env_value('MAIL_USERNAME', '')));
$fullName = trim($firstName . ' ' . $lastName);
$safeTicketId = htmlspecialchars($ticketId, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
$safeName = htmlspecialchars($fullName, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
$safeEmail = htmlspecialchars($email, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
$safePhone = htmlspecialchars($phone !== '' ? $phone : 'Not provided', ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
$safeInquiryType = htmlspecialchars($inquiryType, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
$safeMessage = nl2br(htmlspecialchars($message, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'));
$subject = '[LAT contact] ' . $inquiryType;
$htmlBody = "<div style='font-family:Arial,sans-serif;max-width:640px;margin:0 auto;color:#172033'>"
    . "<h2>New website contact message</h2>"
    . "<p><strong>Ticket:</strong> {$safeTicketId}</p>"
    . "<p><strong>Name:</strong> {$safeName}<br><strong>Email:</strong> {$safeEmail}<br>"
    . "<strong>Phone:</strong> {$safePhone}<br><strong>Topic:</strong> {$safeInquiryType}</p>"
    . "<hr><p><strong>Message</strong></p><p>{$safeMessage}</p></div>";
$altBody = "New website contact message\n"
    . "Ticket: {$ticketId}\nName: {$fullName}\nEmail: {$email}\n"
    . "Phone: " . ($phone !== '' ? $phone : 'Not provided') . "\nTopic: {$inquiryType}\n\nMessage:\n{$message}";

try {
    $mailOut = null;
    $sent = $recipient !== '' && send_mail(
        $recipient,
        'LAT Support',
        $subject,
        $htmlBody,
        $altBody,
        $mailOut,
        true,
        $email,
        $fullName
    );
} catch (Throwable $e) {
    error_log('[Contact] Email delivery could not be initialized: ' . $e->getMessage());
    $sent = false;
}

if (!$sent) {
    send_json_response('error', 'We could not send your message right now. Please try again later.', [
        'ticket_id' => $ticketId
    ], 503);
}

send_json_response('success', 'Thank you! Your message has been received. Our candidate support team will get back to you shortly.', [
    'ticket_id' => $ticketId,
    'full_name' => $inquiryRecord['full_name'],
    'inquiry_type' => $inquiryRecord['inquiry_type']
]);
