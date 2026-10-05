<?php
/**
 * API Endpoint: Auto-Generate Questions
 * 
 * POST /api/qbank/auto_generate.php
 *   - Triggers automatic question generation for upcoming exams
 *   - Can also be called by cron job
 * 
 * GET /api/qbank/auto_generate.php?action=status
 *   - Returns auto-generation log/status
 * 
 * GET /api/qbank/auto_generate.php?action=settings
 *   - Returns current auto-generation settings
 * 
 * POST /api/qbank/auto_generate.php  (action=update_settings)
 *   - Updates auto-generation settings (lead_time, auto_approve, etc.)
 */

require_once __DIR__ . '/../../../src/core/bootstrap.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? ($_POST['action'] ?? '');

// Read JSON body for POST
$rawInput = file_get_contents('php://input');
$requestData = json_decode($rawInput, true) ?: [];
if (isset($requestData['action'])) {
    $action = $requestData['action'];
}

// ============================================================================
// GET: Fetch auto-generation status/logs
// ============================================================================
if ($method === 'GET' && $action === 'status') {
    require_admin_access($conn);

    $logs = [];
    $result = $conn->query("
        SELECT 
            agl.id,
            agl.assessment_id,
            agl.schedule_id,
            agl.questions_generated,
            agl.status,
            agl.details,
            agl.created_at,
            a.title AS assessment_title,
            es.exam_date,
            eslot.start_time
        FROM auto_question_generation_log agl
        LEFT JOIN assessments a ON a.id = agl.assessment_id
        LEFT JOIN exam_schedules es ON es.id = agl.schedule_id
        LEFT JOIN exam_slots eslot ON eslot.exam_schedule_id = es.id
        ORDER BY agl.created_at DESC
        LIMIT 50
    ");

    if ($result) {
        $logs = $result->fetch_all(MYSQLI_ASSOC);
    }

    // Get upcoming exams that need auto-generation
    $nowStr = date('Y-m-d H:i:s');
    $cutoffStr = date('Y-m-d H:i:s', time() + (90 * 60));

    $upcoming = [];
    $upStmt = $conn->prepare("
        SELECT DISTINCT
            es.id AS schedule_id,
            es.exam_date,
            eslot.start_time,
            b.assessment_id,
            a.title AS assessment_title,
            a.total_questions,
            (SELECT COUNT(*) FROM questions q 
             JOIN question_banks qb ON q.question_bank_id = qb.id 
             WHERE qb.assessment_id = b.assessment_id AND q.approval_status = 'approved') AS approved_count,
            (SELECT COUNT(*) FROM auto_question_generation_log gl 
             WHERE gl.assessment_id = b.assessment_id AND gl.schedule_id = es.id AND gl.status = 'completed') AS already_generated
        FROM exam_schedules es
        JOIN exam_slots eslot ON eslot.exam_schedule_id = es.id
        JOIN batches b ON b.id = es.batch_id
        JOIN assessments a ON a.id = b.assessment_id
        WHERE es.status IN ('scheduled', 'provisional')
          AND a.status = 'active'
          AND CONCAT(es.exam_date, ' ', eslot.start_time) > ?
        ORDER BY es.exam_date ASC, eslot.start_time ASC
        LIMIT 20
    ");
    if ($upStmt) {
        $upStmt->bind_param("s", $nowStr);
        $upStmt->execute();
        $upcoming = $upStmt->get_result()->fetch_all(MYSQLI_ASSOC);
        $upStmt->close();
    }

    // Get auto-gen settings
    $settings = get_auto_gen_settings($conn);

    send_json_response('success', 'Auto-generation status retrieved.', [
        'logs' => $logs,
        'upcoming_exams' => $upcoming,
        'settings' => $settings,
        'server_time' => date('Y-m-d H:i:s'),
        'next_trigger_window' => $cutoffStr
    ]);
}

// ============================================================================
// GET: Fetch auto-generation settings
// ============================================================================
if ($method === 'GET' && $action === 'settings') {
    require_admin_access($conn);
    $settings = get_auto_gen_settings($conn);
    send_json_response('success', 'Settings retrieved.', $settings);
}

// ============================================================================
// POST: Update auto-generation settings
// ============================================================================
if ($method === 'POST' && $action === 'update_settings') {
    require_admin_access($conn);
    require_csrf();

    $leadTime = isset($requestData['lead_time_minutes']) ? (int)$requestData['lead_time_minutes'] : null;
    $autoApprove = isset($requestData['auto_approve']) ? (int)$requestData['auto_approve'] : null;
    $enabled = isset($requestData['auto_gen_enabled']) ? (int)$requestData['auto_gen_enabled'] : null;

    if ($leadTime !== null && $leadTime >= 15 && $leadTime <= 360) {
        upsert_setting('auto_gen_lead_time_minutes', (string)$leadTime, $conn);
    }
    if ($autoApprove !== null) {
        upsert_setting('auto_gen_auto_approve', $autoApprove ? '1' : '0', $conn);
    }
    if ($enabled !== null) {
        upsert_setting('auto_gen_enabled', $enabled ? '1' : '0', $conn);
    }

    send_json_response('success', 'Auto-generation settings updated.', get_auto_gen_settings($conn));
}

// ============================================================================
// POST: Trigger auto-generation NOW
// ============================================================================
if ($method === 'POST') {
    require_admin_access($conn);
    require_csrf();

    // Execute the auto-generate script and capture output
    $scriptPath = realpath(__DIR__ . '/../../../scripts/auto_generate_questions.php');
    
    if (!$scriptPath || !file_exists($scriptPath)) {
        send_json_response('error', 'Auto-generation script not found.', null, 500);
    }

    // Execute inline instead of shelling out for better error handling
    ob_start();
    try {
        // The script is designed to be included
        require $scriptPath;
        $outputText = ob_get_clean();
        
        // Already sent JSON response from the script itself
        exit;
    } catch (Throwable $e) {
        ob_end_clean();
        send_json_response('error', 'Auto-generation failed: ' . $e->getMessage(), null, 500);
    }
}

// Fallback: method not allowed
send_json_response('error', 'Invalid request. Use GET with action=status or POST to trigger generation.', null, 405);

// ============================================================================
// HELPERS
// ============================================================================

function get_auto_gen_settings(mysqli $conn): array {
    // Check if the table exists first
    $tableExists = $conn->query("SHOW TABLES LIKE 'settings'")->num_rows > 0;
    
    return [
        'auto_gen_enabled' => $tableExists ? (get_setting_value_safe('auto_gen_enabled', $conn) ?? '1') : '1',
        'lead_time_minutes' => $tableExists ? (get_setting_value_safe('auto_gen_lead_time_minutes', $conn) ?? '90') : '90',
        'auto_approve' => $tableExists ? (get_setting_value_safe('auto_gen_auto_approve', $conn) ?? '1') : '1',
    ];
}

function get_setting_value_safe(string $key, mysqli $conn): ?string {
    try {
        if (function_exists('get_setting_value')) {
            return get_setting_value($key, $conn);
        }
        $stmt = $conn->prepare("SELECT setting_value FROM settings WHERE setting_key = ? LIMIT 1");
        $stmt->bind_param("s", $key);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        $stmt->close();
        return $row ? (string)$row['setting_value'] : null;
    } catch (Throwable $e) {
        return null;
    }
}

function upsert_setting(string $key, string $value, mysqli $conn): void {
    $stmt = $conn->prepare(
        "INSERT INTO settings (setting_key, setting_value, description) VALUES (?, ?, 'Auto-generated setting')
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = NOW()"
    );
    $stmt->bind_param("ss", $key, $value);
    $stmt->execute();
    $stmt->close();
}
