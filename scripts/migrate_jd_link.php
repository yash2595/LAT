<?php
require_once __DIR__ . '/../db.php';

$check = $conn->query("SHOW COLUMNS FROM `job_opportunities` LIKE 'apply_link'");
if ($check && $check->num_rows === 0) {
    $sql = "ALTER TABLE `job_opportunities` ADD COLUMN `apply_link` VARCHAR(1000) DEFAULT NULL COMMENT 'Optional external application URL'";
    if ($conn->query($sql)) {
        echo "OK: apply_link column added\n";
    } else {
        echo "ERROR: " . $conn->error . "\n";
    }
} else {
    echo "OK: apply_link column already exists\n";
}
echo "Done.\n";
