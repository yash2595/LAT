<?php
require_once __DIR__ . '/../db.php';

$sqls = [
    "CREATE TABLE IF NOT EXISTS `job_opportunities` (
        `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        `company_name` VARCHAR(200) NOT NULL,
        `job_title` VARCHAR(200) NOT NULL,
        `description` TEXT DEFAULT NULL,
        `target_levels` VARCHAR(20) NOT NULL,
        `salary_range` VARCHAR(100) DEFAULT NULL,
        `location` VARCHAR(200) DEFAULT NULL,
        `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
        `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX `idx_jobs_status` (`status`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

    "CREATE TABLE IF NOT EXISTS `job_applications` (
        `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        `job_id` BIGINT UNSIGNED NOT NULL,
        `candidate_id` BIGINT UNSIGNED NOT NULL,
        `status` ENUM('applied', 'shortlisted', 'rejected', 'hired') NOT NULL DEFAULT 'applied',
        `applied_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY `uk_job_candidate` (`job_id`, `candidate_id`),
        CONSTRAINT `fk_jobapp_job` FOREIGN KEY (`job_id`) REFERENCES `job_opportunities` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT `fk_jobapp_candidate` FOREIGN KEY (`candidate_id`) REFERENCES `candidates` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
        INDEX `idx_jobapp_job` (`job_id`),
        INDEX `idx_jobapp_candidate` (`candidate_id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
];

foreach ($sqls as $sql) {
    if ($conn->query($sql)) {
        echo "OK: " . substr(trim($sql), 0, 60) . "...\n";
    } else {
        echo "ERROR: " . $conn->error . "\n";
    }
}

echo "\nDone.\n";
