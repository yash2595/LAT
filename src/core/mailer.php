<?php
// Path: src/core/mailer.php

$autoloadPath = dirname(__DIR__, 2) . '/vendor/autoload.php';
if (file_exists($autoloadPath)) {
    require_once $autoloadPath;
}

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

if (!function_exists('env_value')) {
    function env_value(string $key, ?string $default = null): ?string
    {
        if (array_key_exists($key, $_ENV)) return (string)$_ENV[$key];
        $value = getenv($key);
        return $value === false ? $default : (string)$value;
    }
}

/**
 * Shared internal mail dispatcher handling SMTP and PHPMailer configuration.
 *
 * @param string $toEmail Recipient email address
 * @param string $toName Recipient display name (raw string; MIME-encoded by PHPMailer)
 * @param string $subject Email subject line
 * @param string $htmlBody Rendered HTML email body (dynamic variables must be HTML-escaped)
 * @param string|null $altBody Plain-text email body (must NOT be HTML-escaped)
 * @param PHPMailer|null &$mailOut Optional output reference to the prepared PHPMailer instance (for testing/inspection)
 * @param bool $send Whether to invoke $mail->send() (default true; set false for testing/dry-runs)
 * @param string|null $replyToEmail Optional Reply-To email address
 * @param string|null $replyToName Optional Reply-To display name
 * @return bool True on success, false on failure
 */
function send_mail(
    string $toEmail,
    string $toName,
    string $subject,
    string $htmlBody,
    ?string $altBody = null,
    ?PHPMailer &$mailOut = null,
    bool $send = true,
    ?string $replyToEmail = null,
    ?string $replyToName = null
): bool {
    $fromAddress = env_value('MAIL_FROM_ADDRESS');
    $fromName = env_value('MAIL_FROM_NAME', 'MyLAT');
    $transport = strtolower((string)env_value(
        'MAIL_TRANSPORT',
        !empty(env_value('RESEND_API_KEY')) ? 'resend' : 'smtp'
    ));

    if ($transport === 'resend') {
        $apiKey = env_value('RESEND_API_KEY');
        if (empty($apiKey) || empty($fromAddress)) {
            throw new RuntimeException('Resend mail is not configured. Set RESEND_API_KEY and MAIL_FROM_ADDRESS.');
        }

        if (!$send) {
            return true;
        }

        $payload = [
            'from' => trim($fromName) !== '' ? trim($fromName) . ' <' . $fromAddress . '>' : $fromAddress,
            'to' => [$toEmail],
            'subject' => $subject,
            'html' => $htmlBody,
        ];
        if ($altBody !== null) {
            $payload['text'] = $altBody;
        }
        if ($replyToEmail !== null && filter_var($replyToEmail, FILTER_VALIDATE_EMAIL)) {
            $payload['reply_to'] = $replyToEmail;
        }

        $requestBody = json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        if ($requestBody === false) {
            throw new RuntimeException('Could not encode email payload.');
        }

        $context = stream_context_create([
            'http' => [
                'method' => 'POST',
                'header' => "Authorization: Bearer {$apiKey}\r\nContent-Type: application/json\r\nAccept: application/json\r\n",
                'content' => $requestBody,
                'timeout' => 10,
                'ignore_errors' => true,
            ],
        ]);
        $response = @file_get_contents('https://api.resend.com/emails', false, $context);
        $statusLine = $http_response_header[0] ?? '';
        preg_match('/\\s(\\d{3})\\s/', $statusLine, $statusMatch);
        $statusCode = isset($statusMatch[1]) ? (int)$statusMatch[1] : 0;

        if ($response === false || $statusCode < 200 || $statusCode >= 300) {
            error_log('Resend API email delivery failed with HTTP status ' . ($statusCode ?: 'unavailable') . '.');
            return false;
        }

        return true;
    }

    if ($transport !== 'smtp') {
        throw new RuntimeException('Unsupported MAIL_TRANSPORT. Use smtp or resend.');
    }

    $autoloadPath = dirname(__DIR__, 2) . '/vendor/autoload.php';
    if (!file_exists($autoloadPath)) {
        throw new RuntimeException('Mail dependencies not installed. Run composer install.');
    }
    require_once $autoloadPath;

    if (!class_exists('PHPMailer\\PHPMailer\\PHPMailer')) {
        throw new RuntimeException('Mail dependencies not installed. Run composer install.');
    }

    $host = env_value('MAIL_HOST');
    if (empty($host) || empty($fromAddress)) {
        throw new RuntimeException('Mail is not configured. Set MAIL_* variables in .env.');
    }

    $port = (int) env_value('MAIL_PORT', '587');
    if ($port < 1 || $port > 65535) {
        $port = 587;
    }

    $username = env_value('MAIL_USERNAME', '');
    $password = env_value('MAIL_PASSWORD', '');
    $encryption = strtolower((string) env_value('MAIL_ENCRYPTION', 'tls'));
    $mail = new PHPMailer(true);

    try {
        $mail->isSMTP();
        $mail->Host       = $host;
        $mail->SMTPAuth   = !empty($username);
        if (!empty($username)) {
            $mail->Username   = $username;
            $mail->Password   = $password;
        }

        if ($encryption === 'ssl') {
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
        } elseif ($encryption === 'tls') {
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        } else {
            $mail->SMTPSecure = '';
            $mail->SMTPAutoTLS = false;
        }

        $mail->Port       = $port;
        $mail->Timeout    = 5;

        $mail->setFrom($fromAddress, $fromName);
        if ($replyToEmail !== null && filter_var($replyToEmail, FILTER_VALIDATE_EMAIL)) {
            $mail->addReplyTo($replyToEmail, $replyToName ?? '');
        }
        $mail->addAddress($toEmail, $toName);

        $mail->isHTML(true);
        $mail->Subject = $subject;
        $mail->Body    = $htmlBody;
        if ($altBody !== null) {
            $mail->AltBody = $altBody;
        }

        $mailOut = $mail;

        if ($send) {
            $mail->send();
        }
        return true;
    } catch (Throwable $e) {
        error_log("Mailer Error: {$mail->ErrorInfo} | Exception: {$e->getMessage()}");
        return false;
    }
}

/**
 * Sends a registration/verification OTP email with safely escaped dynamic values.
 *
 * @param string $toEmail Recipient email address
 * @param string $toName Recipient name (untrusted user input, escaped for HTML)
 * @param string $otp 6-digit verification code
 * @param PHPMailer|null &$mailOut Optional output reference to PHPMailer instance
 * @param bool $send Whether to invoke send()
 * @return bool
 */
function send_otp_email(string $toEmail, string $toName, string $otp, ?PHPMailer &$mailOut = null, bool $send = true): bool {
    // Escape untrusted user-supplied name to prevent HTML injection / phishing links
    $safeName = htmlspecialchars($toName, ENT_QUOTES, 'UTF-8');

    // $otp is generated by random_int(100000, 999999) and is strictly a 6-digit integer string,
    // so it contains only [0-9] and cannot contain HTML-special characters. We also apply htmlspecialchars
    // as defense-in-depth against future changes to code format.
    $safeOtp = htmlspecialchars($otp, ENT_QUOTES, 'UTF-8');

    $subject = 'Your MyLAT verification code';
    $htmlBody = "
        <div style='font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;'>
            <h2 style='color:#2F6FEB;'>MyLAT Email Verification</h2>
            <p>Hi {$safeName},</p>
            <p>Your verification code is:</p>
            <div style='font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #1E4FD1; margin: 20px 0;'>{$safeOtp}</div>
            <p>This code expires in 10 minutes. If you didn't request this, you can safely ignore this email.</p>
        </div>
    ";

    // Plain-text alternative must NOT be HTML-escaped to avoid showing raw entities in plain-text clients
    $altBody = "Your MyLAT verification code is: {$otp} (expires in 10 minutes)";

    return send_mail($toEmail, $toName, $subject, $htmlBody, $altBody, $mailOut, $send);
}

/**
 * Sends a password reset email with safely escaped dynamic values.
 *
 * @param string $toEmail Recipient email address
 * @param string $toName Recipient name (untrusted user input, escaped for HTML)
 * @param string $resetLink Password reset URL (escaped in both href and link text)
 * @param PHPMailer|null &$mailOut Optional output reference to PHPMailer instance
 * @param bool $send Whether to invoke send()
 * @return bool
 */
function send_password_reset_email(string $toEmail, string $toName, string $resetLink, ?PHPMailer &$mailOut = null, bool $send = true): bool {
    // Escape untrusted user-supplied name to prevent HTML injection / phishing links
    $safeName = htmlspecialchars($toName, ENT_QUOTES, 'UTF-8');

    // Escape reset link in both href attribute and displayed text for defense-in-depth
    $safeResetLink = htmlspecialchars($resetLink, ENT_QUOTES, 'UTF-8');

    $subject = 'Reset your MyLAT password';
    $htmlBody = "
        <div style='font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;'>
            <h2 style='color:#2F6FEB;'>Reset your password</h2>
            <p>Hi {$safeName},</p>
            <p>Click the link below to reset your MyLAT password. This link expires in 30 minutes.</p>
            <p><a href='{$safeResetLink}' style='background:#1E4FD1;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;'>Reset Password</a></p>
            <p style='font-size: 13px; color: #64748b; word-break: break-all;'>Or copy and paste this link into your browser:<br><a href='{$safeResetLink}'>{$safeResetLink}</a></p>
            <p>If you didn't request this, you can safely ignore this email.</p>
        </div>
    ";

    // Plain-text alternative must NOT be HTML-escaped to avoid showing raw entities in plain-text clients
    $altBody = "Reset your MyLAT password: {$resetLink} (expires in 30 minutes)";

    return send_mail($toEmail, $toName, $subject, $htmlBody, $altBody, $mailOut, $send);
}

