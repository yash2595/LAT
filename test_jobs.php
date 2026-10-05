<?php
require 'src/core/bootstrap.php';
$candidateId = 1;
$stmt = $conn->prepare("
    SELECT j.id, j.company_name, j.job_title, j.description, j.salary_range, j.location, j.created_at, j.jd_pdf_path, j.apply_link,
           (SELECT COUNT(*) FROM job_applications a WHERE a.job_id = j.id AND a.candidate_id = ?) as has_applied
    FROM job_opportunities j
    WHERE j.status = 'active'
    ORDER BY j.created_at DESC
");
$stmt->bind_param("i", $candidateId);
$stmt->execute();
$allJobs = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
echo json_encode($allJobs, JSON_PRETTY_PRINT);
