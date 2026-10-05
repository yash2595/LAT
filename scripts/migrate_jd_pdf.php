<?php
require_once __DIR__ . '/../db.php';

// Check if column already exists
$check = $conn->query("SHOW COLUMNS FROM `job_opportunities` LIKE 'jd_pdf_path'");
if ($check && $check->num_rows === 0) {
    $sql = "ALTER TABLE `job_opportunities` ADD COLUMN `jd_pdf_path` VARCHAR(500) DEFAULT NULL COMMENT 'Relative path to uploaded JD PDF'";
    if ($conn->query($sql)) {
        echo "OK: jd_pdf_path column added\n";
    } else {
        echo "ERROR: " . $conn->error . "\n";
    }
} else {
    echo "OK: jd_pdf_path column already exists\n";
}

// Also ensure the storage directory exists
$dir = __DIR__ . '/../storage/jd_pdfs';
if (!is_dir($dir)) {
    mkdir($dir, 0755, true);
    echo "OK: created storage/jd_pdfs directory\n";
} else {
    echo "OK: storage/jd_pdfs directory already exists\n";
}
echo "Done.\n";
