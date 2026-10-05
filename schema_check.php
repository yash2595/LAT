<?php
require 'db.php';
$res = $conn->query('DESCRIBE assessments');
while ($r = $res->fetch_assoc()) echo $r['Field']."\n";
echo "---\n";
$res = $conn->query('DESCRIBE question_banks');
while ($r = $res->fetch_assoc()) echo $r['Field']."\n";
