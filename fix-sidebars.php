<?php
$dashboardContent = file_get_contents(__DIR__ . '/public/dashboard.html');
preg_match('/<aside[^>]*>.*?<\/aside>/s', $dashboardContent, $matches);
if (!$matches) {
    die("Could not find <aside> in dashboard.html");
}
$dashboardSidebar = $matches[0];

$files = [
    'profile.html',
    'payment.html',
    'enrollment.html',
    'batches-slots.html',
    'exam.html',
    'results.html',
    'certificates.html',
    'placement.html'
];

foreach ($files as $file) {
    $path = __DIR__ . '/public/' . $file;
    if (!file_exists($path)) continue;
    
    $content = file_get_contents($path);
    
    // Replace the existing sidebar
    $content = preg_replace('/<aside[^>]*>.*?<\/aside>/s', $dashboardSidebar, $content);
    
    // Now we need to fix the active class.
    // First remove ' act' from dashboard link (or any link)
    $content = preg_replace('/class="nl act"/', 'class="nl"', $content);
    
    // Then add ' act' to the correct link based on $file
    $content = preg_replace(
        '/href="' . preg_quote($file, '/') . '"(.*?)class="nl"/',
        'href="' . $file . '"$1class="nl act"',
        $content
    );
    
    file_put_contents($path, $content);
    echo "Updated $file\n";
}
echo "Done.\n";
