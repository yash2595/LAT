<?php
require 'src/core/bootstrap.php';
$conn->query('UPDATE placement_records SET updated_at = NOW() WHERE candidate_id=1');
echo "Updated placement record for cand 1\n";
