<?php
$c = file_get_contents('public/assets/css/auth-v3.css');
if (preg_match_all('/\.gc\{[^\}]+\}/', $c, $m)) {
    print_r($m[0]);
}
if (preg_match_all('/\.g-lvl\{[^\}]+\}/', $c, $m)) {
    print_r($m[0]);
}
if (preg_match_all('/\.g-cert\{[^\}]+\}/', $c, $m)) {
    print_r($m[0]);
}
