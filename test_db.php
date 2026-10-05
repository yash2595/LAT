<?php
require_once 'db.php';
$res = $conn->query("SELECT id, job_title, apply_link FROM job_opportunities ORDER BY id DESC LIMIT 5");
while($row = $res->fetch_assoc()) {
    print_r($row);
}
