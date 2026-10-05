<?php
/**
 * =============================================================================
 * AUTO QUESTION GENERATOR — Cron Job Script
 * =============================================================================
 * 
 * Purpose: Automatically generates AI-powered questions 1.5 hours (90 minutes)
 *          before any scheduled exam starts. Removes admin dependency entirely.
 * 
 * Scheduling:
 *   - Linux/cPanel Cron:  [every 5 mins] php /path/to/scripts/auto_generate_questions.php >> /path/to/storage/logs/auto_gen.log 2>&1
 *   - Windows Task Scheduler: Run every 5 minutes
 *   - Can also be triggered via API: POST /api/qbank/auto_generate.php
 * 
 * Flow:
 *   1. Finds all exam_schedules starting within the next 90 minutes
 *   2. For each schedule's assessment, checks if auto-generation already ran
 *   3. If not, finds the question bank for that assessment
 *   4. Generates high-quality questions via AI (with upgraded prompts)
 *   5. Auto-approves generated questions (no admin review needed)
 *   6. Logs the operation in auto_question_generation_log table
 * 
 * @author AutoGen System
 */

// CLI or Web context detection
$isCli = (php_sapi_name() === 'cli');

// Load bootstrap
require_once __DIR__ . '/../src/core/bootstrap.php';
require_once __DIR__ . '/../src/modules/m1_ai_qbank/service.php';

// Allow generous execution time for AI API calls
@set_time_limit(600);
@ini_set('memory_limit', '256M');

// Ensure auto_question_generation_log table exists
ensure_auto_gen_table($conn);

$output = [];
$output[] = "[" . date('Y-m-d H:i:s') . "] Auto Question Generator started.";

// ============================================================================
// STEP 1: Find all exams starting within the next 90 minutes that need questions
// ============================================================================
$leadTimeMinutes = 90; // 1.5 hours before exam
$nowStr = date('Y-m-d H:i:s');
$cutoffStr = date('Y-m-d H:i:s', time() + ($leadTimeMinutes * 60));

$sql = "
    SELECT DISTINCT
        es.id AS schedule_id,
        es.batch_id,
        es.exam_date,
        es.status AS schedule_status,
        eslot.start_time,
        eslot.end_time,
        b.assessment_id,
        a.title AS assessment_title,
        a.total_questions,
        a.status AS assessment_status
    FROM exam_schedules es
    JOIN exam_slots eslot ON eslot.exam_schedule_id = es.id
    JOIN batches b ON b.id = es.batch_id
    JOIN assessments a ON a.id = b.assessment_id
    WHERE es.status IN ('scheduled', 'provisional')
      AND a.status = 'active'
      AND CONCAT(es.exam_date, ' ', eslot.start_time) > ?
      AND CONCAT(es.exam_date, ' ', eslot.start_time) <= ?
    ORDER BY es.exam_date ASC, eslot.start_time ASC
";

$stmt = $conn->prepare($sql);
$stmt->bind_param("ss", $nowStr, $cutoffStr);
$stmt->execute();
$upcomingExams = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
$stmt->close();

if (empty($upcomingExams)) {
    $output[] = "No exams found starting within the next {$leadTimeMinutes} minutes. Nothing to generate.";
    finish($output, $isCli);
    exit(0);
}

$output[] = "Found " . count($upcomingExams) . " upcoming exam schedule(s) within {$leadTimeMinutes} minutes.";

// ============================================================================
// STEP 2: Process each assessment — check if already auto-generated
// ============================================================================
$processedAssessments = []; // Prevent duplicate processing for same assessment
$totalGenerated = 0;
$totalErrors = 0;

foreach ($upcomingExams as $exam) {
    $assessmentId = (int)$exam['assessment_id'];
    $scheduleId = (int)$exam['schedule_id'];

    // Skip if already processed this assessment in this run
    if (isset($processedAssessments[$assessmentId])) {
        continue;
    }
    $processedAssessments[$assessmentId] = true;

    $output[] = "";
    $output[] = "--- Processing Assessment #{$assessmentId}: {$exam['assessment_title']} ---";
    $output[] = "    Exam Date: {$exam['exam_date']} | Start: {$exam['start_time']} | Required Questions: {$exam['total_questions']}";

    // Check if auto-generation already ran for this assessment + schedule combo
    $checkStmt = $conn->prepare(
        "SELECT id, questions_generated, status FROM auto_question_generation_log 
         WHERE assessment_id = ? AND schedule_id = ? AND status = 'completed'
         LIMIT 1"
    );
    $checkStmt->bind_param("ii", $assessmentId, $scheduleId);
    $checkStmt->execute();
    $existingLog = $checkStmt->get_result()->fetch_assoc();
    $checkStmt->close();

    if ($existingLog) {
        $output[] = "    ✅ SKIP — Already auto-generated {$existingLog['questions_generated']} questions (Log #{$existingLog['id']}).";
        continue;
    }

    // Check how many approved, UNUSED questions already exist for this assessment
    $countStmt = $conn->prepare(
        "SELECT COUNT(DISTINCT q.id) as cnt FROM questions q
         JOIN question_banks qb ON q.question_bank_id = qb.id
         LEFT JOIN attempt_questions aq ON aq.question_id = q.id
         WHERE qb.assessment_id = ? AND q.approval_status = 'approved' AND aq.id IS NULL"
    );
    $countStmt->bind_param("i", $assessmentId);
    $countStmt->execute();
    $existingCount = (int)$countStmt->get_result()->fetch_assoc()['cnt'];
    $countStmt->close();

    $requiredQuestions = (int)$exam['total_questions'];
    $questionsToGenerate = max(0, $requiredQuestions - $existingCount);

    // Always generate a buffer of 20% extra questions for variety
    $questionsToGenerate = max($questionsToGenerate, (int)ceil($requiredQuestions * 1.2) - $existingCount);
    
    if ($questionsToGenerate <= 0) {
        $output[] = "    ✅ SKIP — Already have {$existingCount} approved questions (required: {$requiredQuestions}).";
        
        // Log as completed even if no generation needed
        log_auto_generation($conn, $assessmentId, $scheduleId, 0, 'completed', 
            "Sufficient approved questions already exist ({$existingCount}/{$requiredQuestions}).");
        continue;
    }

    $output[] = "    📊 Existing approved: {$existingCount} | Required: {$requiredQuestions} | To Generate: {$questionsToGenerate}";

    // Find the question bank for this assessment
    $qbankStmt = $conn->prepare(
        "SELECT id, name FROM question_banks WHERE assessment_id = ? ORDER BY id ASC LIMIT 1"
    );
    $qbankStmt->bind_param("i", $assessmentId);
    $qbankStmt->execute();
    $qbank = $qbankStmt->get_result()->fetch_assoc();
    $qbankStmt->close();

    if (!$qbank) {
        // Auto-create a question bank if none exists
        $bankName = "Auto-Generated Bank - " . $exam['assessment_title'];
        $createBankStmt = $conn->prepare(
            "INSERT INTO question_banks (assessment_id, name, status) VALUES (?, ?, 'approved')"
        );
        $createBankStmt->bind_param("is", $assessmentId, $bankName);
        $createBankStmt->execute();
        $qbankId = (int)$createBankStmt->insert_id;
        $createBankStmt->close();
        $output[] = "    📁 Created new question bank: {$bankName} (ID: {$qbankId})";
    } else {
        $qbankId = (int)$qbank['id'];
        $output[] = "    📁 Using question bank: {$qbank['name']} (ID: {$qbankId})";
    }

    // ========================================================================
    // STEP 3: Generate high-quality questions with UPGRADED AI prompt
    // ========================================================================
    try {
        $result = auto_generate_premium_questions(
            $qbankId, 
            $questionsToGenerate, 
            $exam['assessment_title'],
            $conn
        );

        $insertedCount = $result['inserted'] ?? 0;
        $totalGenerated += $insertedCount;

        $output[] = "    ✅ Generated {$insertedCount} questions (requested: {$questionsToGenerate}).";
        if (!empty($result['skipped_reasons'])) {
            $output[] = "    ⚠️  Skipped: " . implode('; ', array_slice($result['skipped_reasons'], 0, 3));
        }

        // Log successful generation
        log_auto_generation($conn, $assessmentId, $scheduleId, $insertedCount, 'completed',
            "Auto-generated {$insertedCount} questions. Requested: {$questionsToGenerate}.");

    } catch (Throwable $e) {
        $totalErrors++;
        $errorMsg = $e->getMessage();
        $output[] = "    ❌ ERROR: {$errorMsg}";
        error_log("[AutoGen] Failed for assessment #{$assessmentId}: {$errorMsg}");

        // Log failed attempt
        log_auto_generation($conn, $assessmentId, $scheduleId, 0, 'failed', $errorMsg);
    }
}

// ============================================================================
// STEP 4: Summary
// ============================================================================
$output[] = "";
$output[] = "======================================";
$output[] = "Auto Generation Complete!";
$output[] = "  Total Questions Generated: {$totalGenerated}";
$output[] = "  Errors: {$totalErrors}";
$output[] = "  Assessments Processed: " . count($processedAssessments);
$output[] = "[" . date('Y-m-d H:i:s') . "] Done.";
$output[] = "======================================";

finish($output, $isCli);

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generates premium-quality AI questions with an upgraded, industry-grade prompt.
 * Questions are auto-approved (no admin review needed).
 */
function auto_generate_premium_questions(
    int $qbankId,
    int $totalCount,
    string $assessmentTitle,
    mysqli $conn
): array {
    // Determine difficulty distribution: 30% easy, 45% medium, 25% hard
    $easyCount = (int)round($totalCount * 0.30);
    $hardCount = max(1, (int)round($totalCount * 0.25));
    $mediumCount = max(0, $totalCount - $easyCount - $hardCount);

    // Split across 3 topic sections
    $aptitudeCount = (int)ceil($totalCount * 0.30);
    $dsaCount = (int)ceil($totalCount * 0.35);
    $coreCount = max(0, $totalCount - $aptitudeCount - $dsaCount);

    $allQuestionIds = [];
    $allErrors = [];

    $sections = [
        [
            'topic' => "Advanced Quantitative & Logical Aptitude for IT Industry Assessment",
            'count' => $aptitudeCount,
            'focus' => 'aptitude'
        ],
        [
            'topic' => "Data Structures & Algorithms (DSA) - Coding Interview Standard",
            'count' => $dsaCount,
            'focus' => 'dsa'
        ],
        [
            'topic' => "Core Computer Science & Software Engineering Fundamentals",
            'count' => $coreCount,
            'focus' => 'core'
        ]
    ];

    foreach ($sections as $section) {
        if ($section['count'] <= 0) continue;

        $sectionEasy = (int)round($section['count'] * 0.30);
        $sectionHard = max(1, (int)round($section['count'] * 0.25));
        $sectionMedium = max(0, $section['count'] - $sectionEasy - $sectionHard);

        $difficultyMix = "easy:{$sectionEasy},medium:{$sectionMedium},hard:{$sectionHard}";

        try {
            $result = generate_premium_questions_via_ai(
                $qbankId,
                $section['topic'],
                $section['count'],
                $difficultyMix,
                $section['focus'],
                $conn
            );

            if (!empty($result['question_ids'])) {
                $allQuestionIds = array_merge($allQuestionIds, $result['question_ids']);
            }
            if (!empty($result['skipped_reasons'])) {
                $allErrors = array_merge($allErrors, $result['skipped_reasons']);
            }
        } catch (Throwable $e) {
            $allErrors[] = "Section '{$section['focus']}' failed: " . $e->getMessage();
        }
    }

    return [
        'requested' => $totalCount,
        'inserted' => count($allQuestionIds),
        'question_ids' => $allQuestionIds,
        'skipped' => count($allErrors),
        'skipped_reasons' => $allErrors
    ];
}

/**
 * Enhanced AI question generation with PREMIUM-QUALITY prompts.
 * Auto-approves questions instead of leaving them as 'pending'.
 */
function generate_premium_questions_via_ai(
    int $qbankId,
    string $topic,
    int $count,
    string $difficultyMix,
    string $focusArea,
    mysqli $conn
): array {
    // Resolve AI Provider & Key
    $provider = strtolower(trim((string)env_value('AI_PROVIDER', 'gemini')));
    if ($provider === 'gemini') {
        $apiKey = env_value('GEMINI_API_KEY', '');
        $model = env_value('GEMINI_MODEL', 'gemini-2.0-flash');
    } elseif ($provider === 'openai') {
        $apiKey = env_value('OPENAI_API_KEY', '');
        $model = env_value('OPENAI_MODEL', 'gpt-4o-mini');
    } else {
        throw new RuntimeException("Unsupported AI provider '{$provider}'.");
    }

    if (empty($apiKey)) {
        throw new RuntimeException("AI API key not configured for provider '{$provider}'.");
    }

    // Build the PREMIUM prompt based on focus area
    $prompt = build_premium_prompt($topic, $count, $difficultyMix, $focusArea);

    // Batching: up to 20 questions per API call
    $batchSize = 20;
    $remaining = $count;
    $allItems = [];

    while ($remaining > 0) {
        $curBatchCount = min($batchSize, $remaining);
        $remaining -= $curBatchCount;

        $batchPrompt = str_replace('{COUNT}', (string)$curBatchCount, $prompt);

        // API call
        $rawText = '';
        if ($provider === 'gemini') {
            $rawText = call_gemini_api($apiKey, $model, $batchPrompt);
        } else {
            $rawText = call_openai_api($apiKey, $model, $batchPrompt);
        }

        // Parse JSON response
        $cleanJson = preg_replace('/^```(?:json)?\s*/i', '', trim($rawText));
        $cleanJson = preg_replace('/\s*```$/', '', $cleanJson);
        $cleanJson = trim($cleanJson);

        $batchItems = json_decode($cleanJson, true);
        if (!is_array($batchItems)) {
            throw new RuntimeException("AI returned invalid JSON.");
        }
        if (isset($batchItems['questions']) && is_array($batchItems['questions'])) {
            $batchItems = $batchItems['questions'];
        } elseif (isset($batchItems['data']) && is_array($batchItems['data'])) {
            $batchItems = $batchItems['data'];
        }

        if (is_array($batchItems)) {
            foreach ($batchItems as $bi) {
                $allItems[] = $bi;
            }
        }

        if ($remaining > 0) usleep(200000); // 200ms pause between batches
    }

    if (empty($allItems)) {
        throw new RuntimeException("AI returned no questions.");
    }

    // Validate and insert — AUTO-APPROVE (not 'pending')
    $validationErrors = [];
    $validatedQuestions = [];
    $allowedDifficulties = ['easy', 'medium', 'hard'];

    foreach ($allItems as $idx => $item) {
        $itemNum = $idx + 1;
        $itemValid = true;

        if (!is_array($item)) {
            $validationErrors[] = "Item #{$itemNum} not a valid object";
            continue;
        }

        $questionText = isset($item['question_text']) ? trim((string)$item['question_text']) : '';
        if ($questionText === '') {
            $validationErrors[] = "Item #{$itemNum} missing question_text";
            continue;
        }

        $difficulty = isset($item['difficulty']) ? strtolower(trim((string)$item['difficulty'])) : 'medium';
        if (!in_array($difficulty, $allowedDifficulties, true)) {
            $difficulty = 'medium';
        }

        $options = $item['options'] ?? null;
        if (!is_array($options) || count($options) !== 4) {
            $validationErrors[] = "Item #{$itemNum} doesn't have exactly 4 options";
            continue;
        }

        $correctCount = 0;
        $validatedOptions = [];

        foreach ($options as $optIdx => $opt) {
            if (!is_array($opt)) { $itemValid = false; continue; }

            $optText = isset($opt['option_text']) ? trim((string)$opt['option_text']) : '';
            if ($optText === '') { $itemValid = false; continue; }

            $isCorrect = false;
            if (isset($opt['is_correct'])) {
                $isCorrect = ($opt['is_correct'] === true || $opt['is_correct'] === 1 || $opt['is_correct'] === '1' || $opt['is_correct'] === 'true');
            }

            if ($isCorrect) $correctCount++;

            $validatedOptions[] = [
                'option_text' => $optText,
                'is_correct' => $isCorrect ? 1 : 0
            ];
        }

        if (!$itemValid) continue;
        if ($correctCount !== 1) {
            $validationErrors[] = "Item #{$itemNum} has {$correctCount} correct options";
            continue;
        }

        $validatedQuestions[] = [
            'question_text' => $questionText,
            'difficulty' => $difficulty,
            'options' => $validatedOptions
        ];
    }

    if (empty($validatedQuestions)) {
        throw new RuntimeException("All AI questions failed validation: " . implode('; ', array_slice($validationErrors, 0, 5)));
    }

    // Atomic DB insert with AUTO-APPROVAL
    $conn->begin_transaction();
    $questionIds = [];

    try {
        // Check for duplicates
        $existingTexts = [];
        $stmt = $conn->prepare("SELECT question_text FROM questions WHERE question_bank_id = ?");
        $stmt->bind_param('i', $qbankId);
        $stmt->execute();
        $res = $stmt->get_result();
        while ($row = $res->fetch_assoc()) {
            $existingTexts[strtolower(trim($row['question_text']))] = true;
        }
        $stmt->close();

        foreach ($validatedQuestions as $q) {
            $normalized = strtolower(trim($q['question_text']));
            if (isset($existingTexts[$normalized])) {
                $validationErrors[] = "Duplicate skipped: \"" . substr($q['question_text'], 0, 60) . "\"";
                continue;
            }
            $existingTexts[$normalized] = true;

            // Insert with 'approved' status — AUTO-APPROVED, no admin review needed
            $qId = insert_question($qbankId, $q['question_text'], $q['difficulty'], $conn, 'approved');
            foreach ($q['options'] as $opt) {
                insert_question_option($qId, $opt['option_text'], $opt['is_correct'], $conn);
            }
            $questionIds[] = $qId;
        }

        if (empty($questionIds)) {
            throw new Exception("No new questions inserted — all duplicates or invalid.");
        }

        $conn->commit();

        return [
            'requested' => $count,
            'inserted' => count($questionIds),
            'question_ids' => $questionIds,
            'skipped' => count($validationErrors),
            'skipped_reasons' => array_slice($validationErrors, 0, 10)
        ];
    } catch (Throwable $e) {
        $conn->rollback();
        throw new Exception("DB insert failed: " . $e->getMessage());
    }
}

/**
 * Builds a PREMIUM-QUALITY prompt that produces interview-grade questions.
 * Much higher standard than the basic prompts.
 */
function build_premium_prompt(string $topic, int $count, string $difficultyMix, string $focusArea): string {
    $countPlaceholder = '{COUNT}';

    $baseInstructions = "You are an expert technical assessment designer for a top-tier IT recruitment platform. ";
    $baseInstructions .= "Your questions are used in high-stakes placement exams where candidates compete for jobs at leading tech companies.\n\n";
    
    $qualityGuidelines = <<<EOT
QUALITY STANDARDS (CRITICAL — Follow Strictly):
1. Questions must be at the level of actual tech company placement tests (TCS NQT, Infosys InfyTQ, Wipro NLTH, Accenture level).
2. NEVER generate trivially simple "What is X?" definition questions. Every question must require THINKING and ANALYSIS.
3. Easy questions should still require applying a concept, not just recalling a definition.
4. Medium questions must involve multi-step reasoning, tracing code, or solving a small problem.
5. Hard questions should challenge strong candidates — involve edge cases, optimization, tricky scenarios, or combining multiple concepts.
6. For code-based questions, use realistic code snippets (C, Java, Python, or pseudocode) with actual logic to trace.
7. All 4 options must be PLAUSIBLE — no obviously wrong "joke" options. Wrong answers should represent common mistakes or misconceptions.
8. The correct answer must be unambiguously correct with no room for debate.
9. Question text must be clear, professional, and well-formatted.
10. Each question should test a DISTINCT concept — no two questions should test the exact same thing.
EOT;

    $focusPrompt = '';
    switch ($focusArea) {
        case 'aptitude':
            $focusPrompt = <<<EOT

TOPIC FOCUS: Advanced Quantitative & Logical Aptitude
Generate questions covering these areas with REAL problem-solving (not textbook definitions):
- Number Series & Pattern Recognition (complex patterns, not obvious sequences)
- Profit & Loss, Percentages, Ratios (multi-step word problems)
- Time & Work, Speed & Distance (involving multiple entities, pipes/cisterns)
- Permutations, Combinations, Probability (practical application scenarios)
- Data Interpretation (tables, charts — derive insights, not just read values)
- Logical Reasoning: Syllogisms, Blood Relations, Coding-Decoding, Direction Sense
- Verbal Reasoning: Reading Comprehension passages with inference-based questions, Sentence Correction, Para-jumbles
- Critical Reasoning: Assumptions, Conclusions, Strengths/Weaknesses of arguments

STYLE: All aptitude questions must present a SCENARIO or PROBLEM to solve, not ask "What is the formula for..."
EOT;
            break;

        case 'dsa':
            $focusPrompt = <<<EOT

TOPIC FOCUS: Data Structures & Algorithms (Coding Interview Standard)
Generate questions that mirror actual coding interview assessments:
- Arrays & Strings: Subarray problems, sliding window, two-pointer, string manipulation
- Linked Lists: Reversal, cycle detection, merge operations — trace through code
- Trees & BSTs: Traversal outputs, height/depth calculations, BST properties
- Graphs: BFS/DFS traversal order, shortest path basics, cycle detection
- Sorting & Searching: Time complexity analysis, trace quicksort/mergesort on given input
- Stacks & Queues: Expression evaluation, next greater element, BFS implementations
- Dynamic Programming: Identify recurrence relations, trace DP tables, optimal substructure
- Hashing: Collision handling, hash map operations, frequency counting
- Time/Space Complexity: Analyze given code snippets for Big-O complexity

STYLE: At least 60% of DSA questions MUST include a code snippet (in C/Java/Python) where the candidate must trace execution or predict output. Include actual variable values, loop iterations, and function calls.
EOT;
            break;

        case 'core':
            $focusPrompt = <<<EOT

TOPIC FOCUS: Core Computer Science & Software Engineering
Generate questions testing deep understanding, not surface-level recall:
- OOP Concepts: Polymorphism edge cases, inheritance ambiguity, design pattern identification from code
- DBMS & SQL: Write/predict output of complex JOINs, subqueries, GROUP BY with HAVING, normalization scenarios
- Operating Systems: Process scheduling outputs, deadlock detection, page replacement trace, semaphore problems
- Computer Networks: Protocol behavior scenarios, TCP vs UDP edge cases, subnet calculations, HTTP methods
- Web Technologies: REST API design, HTTP status codes in context, security vulnerabilities (XSS, CSRF, SQL injection)
- Software Engineering: Design pattern recognition, SOLID principles applied to code, testing strategies
- Core Programming: Pointer arithmetic, recursion trace, type casting edge cases, memory management

STYLE: Questions should present CODE or SCENARIOS and ask "What happens when..." or "What is the output of..." — not "Define X" or "What is X?"
EOT;
            break;
    }

    $prompt = $baseInstructions;
    $prompt .= $qualityGuidelines . "\n";
    $prompt .= $focusPrompt . "\n\n";
    $prompt .= "Generate exactly {$countPlaceholder} multiple-choice questions about: \"{$topic}\".\n";
    if (!empty($difficultyMix)) {
        $prompt .= "Target difficulty distribution: {$difficultyMix}.\n";
    }
    $prompt .= "\nReturn ONLY a valid JSON array. No markdown, no backticks, no prose.\n";
    $prompt .= "Schema:\n";
    $prompt .= "[\n";
    $prompt .= "  {\n";
    $prompt .= "    \"question_text\": \"Detailed question text here?\",\n";
    $prompt .= "    \"difficulty\": \"easy|medium|hard\",\n";
    $prompt .= "    \"options\": [\n";
    $prompt .= "      {\"option_text\": \"Option A\", \"is_correct\": true},\n";
    $prompt .= "      {\"option_text\": \"Option B\", \"is_correct\": false},\n";
    $prompt .= "      {\"option_text\": \"Option C\", \"is_correct\": false},\n";
    $prompt .= "      {\"option_text\": \"Option D\", \"is_correct\": false}\n";
    $prompt .= "    ]\n";
    $prompt .= "  }\n";
    $prompt .= "]\n";
    $prompt .= "Rules:\n";
    $prompt .= "1. Exactly 4 options per question. Exactly 1 correct.\n";
    $prompt .= "2. All text must be non-empty.\n";
    $prompt .= "3. Output ONLY raw JSON array.\n";
    $prompt .= "4. Make distractors (wrong options) plausible — they should represent common mistakes.\n";
    $prompt .= "5. For code questions, format code properly within the question_text string using \\n for newlines.\n";

    return $prompt;
}

/**
 * Call Gemini API with model fallback chain.
 */
function call_gemini_api(string $apiKey, string $model, string $prompt): string {
    $candidates = array_unique(array_filter([$model, 'gemini-flash-lite-latest', 'gemini-3.1-flash-lite', 'gemini-3.5-flash-lite', 'gemini-flash-latest']));
    $lastErr = '';

    foreach ($candidates as $candModel) {
        $url = "https://generativelanguage.googleapis.com/v1beta/models/" . rawurlencode($candModel) . ":generateContent?key=" . rawurlencode($apiKey);
        $payload = [
            'contents' => [
                [
                    'parts' => [
                        ['text' => $prompt]
                    ]
                ]
            ],
            'generationConfig' => [
                'temperature' => 0.85,
                'responseMimeType' => 'application/json'
            ]
        ];

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
            CURLOPT_POSTFIELDS => json_encode($payload),
            CURLOPT_TIMEOUT => 90,
            CURLOPT_CONNECTTIMEOUT => 15,
            CURLOPT_SSL_VERIFYPEER => false
        ]);
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlErr = curl_error($ch);
        curl_close($ch);

        if ($response === false || !empty($curlErr)) {
            $lastErr = ($curlErr ?: 'Network error');
            continue;
        }
        if ($httpCode !== 200) {
            $errData = json_decode((string)$response, true);
            $lastErr = $errData['error']['message'] ?? "HTTP {$httpCode}";
            continue;
        }

        $resData = json_decode((string)$response, true);
        $rawText = $resData['candidates'][0]['content']['parts'][0]['text'] ?? '';
        if ($rawText !== '') {
            return $rawText;
        }
    }

    throw new RuntimeException("Gemini API failed: " . ($lastErr ?: 'All model fallbacks exhausted.'));
}

/**
 * Call OpenAI API.
 */
function call_openai_api(string $apiKey, string $model, string $prompt): string {
    $url = "https://api.openai.com/v1/chat/completions";
    $payload = [
        'model' => $model,
        'messages' => [
            ['role' => 'system', 'content' => 'You are an expert technical assessment designer for IT placement exams. Generate challenging, interview-grade MCQ questions. Respond with a JSON array ONLY.'],
            ['role' => 'user', 'content' => $prompt]
        ],
        'temperature' => 0.85
    ];

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $apiKey
        ],
        CURLOPT_POSTFIELDS => json_encode($payload),
        CURLOPT_TIMEOUT => 90,
        CURLOPT_CONNECTTIMEOUT => 15,
        CURLOPT_SSL_VERIFYPEER => false
    ]);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlErr = curl_error($ch);
    curl_close($ch);

    if ($response === false || !empty($curlErr)) {
        throw new RuntimeException("OpenAI API failed: " . ($curlErr ?: 'Network error'));
    }
    if ($httpCode !== 200) {
        $errData = json_decode((string)$response, true);
        throw new RuntimeException("OpenAI API failed: " . ($errData['error']['message'] ?? "HTTP {$httpCode}"));
    }

    $resData = json_decode((string)$response, true);
    return $resData['choices'][0]['message']['content'] ?? '';
}

/**
 * Ensures the auto_question_generation_log table exists.
 */
function ensure_auto_gen_table(mysqli $conn): void {
    $conn->query("
        CREATE TABLE IF NOT EXISTS `auto_question_generation_log` (
            `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            `assessment_id` BIGINT UNSIGNED NOT NULL,
            `schedule_id` BIGINT UNSIGNED NOT NULL,
            `questions_generated` INT UNSIGNED NOT NULL DEFAULT 0,
            `status` ENUM('started', 'completed', 'failed') NOT NULL DEFAULT 'started',
            `details` TEXT DEFAULT NULL,
            `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX `idx_autogen_assessment` (`assessment_id`),
            INDEX `idx_autogen_schedule` (`schedule_id`),
            INDEX `idx_autogen_status` (`status`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
}

/**
 * Logs an auto-generation run.
 */
function log_auto_generation(mysqli $conn, int $assessmentId, int $scheduleId, int $questionsGenerated, string $status, string $details): void {
    $stmt = $conn->prepare(
        "INSERT INTO auto_question_generation_log (assessment_id, schedule_id, questions_generated, status, details) 
         VALUES (?, ?, ?, ?, ?)"
    );
    $stmt->bind_param("iiiss", $assessmentId, $scheduleId, $questionsGenerated, $status, $details);
    $stmt->execute();
    $stmt->close();
}

/**
 * Outputs all messages and exits.
 */
function finish(array $output, bool $isCli): void {
    $text = implode("\n", $output) . "\n";
    
    if ($isCli) {
        echo $text;
    } else {
        header('Content-Type: application/json');
        echo json_encode([
            'status' => 'success',
            'message' => 'Auto question generation complete.',
            'log' => $output
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    }
}
