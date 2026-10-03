<?php
// Router for PHP built-in server with no-cache headers
$uri = $_SERVER['REQUEST_URI'];
$path = parse_url($uri, PHP_URL_PATH);

// Serve static files normally but with cache-busting headers
$file = __DIR__ . '/public' . $path;

if ($path !== '/' && is_file($file)) {
    // Add no-cache headers for HTML files
    $ext = pathinfo($file, PATHINFO_EXTENSION);
    if (in_array($ext, ['html', 'css', 'js'])) {
        header('Cache-Control: no-cache, no-store, must-revalidate');
        header('Pragma: no-cache');
        header('Expires: 0');
    }
    return false; // Let the built-in server handle it
}

return false;
