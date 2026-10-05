<?php
require 'src/core/bootstrap.php';
$res = $conn->query("SELECT j.*, (SELECT COUNT(*) FROM job_applications a WHERE a.job_id = j.id) as application_count FROM job_opportunities j ORDER BY j.created_at DESC");
if (!$res) {
    echo "Error: " . $conn->error;
} else {
    $jobs = $res->fetch_all(MYSQLI_ASSOC);
    echo json_encode($jobs, JSON_PRETTY_PRINT);
}
