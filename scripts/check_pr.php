<?php
require 'src/core/bootstrap.php';
$r = $conn->query('SELECT * FROM placement_records');
while($row = $r->fetch_assoc()) {
    print_r($row);
}
