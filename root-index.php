<?php
/**
 * Laravel Application Entry Point for Hostinger
 * Place this file as index.php in your public_html root directory
 */

// Set the application directory path
$app_path = __DIR__ . '/admin';

// Check if Laravel app exists
if (!is_dir($app_path)) {
    die('Laravel application not found. Please upload your admin folder.');
}

// Set the public path to Laravel's public directory
$public_path = $app_path . '/public';

// Get the requested URI
$request_uri = $_SERVER['REQUEST_URI'];

// Remove query string if present
$request_uri = strtok($request_uri, '?');

// Remove leading slash
$request_uri = ltrim($request_uri, '/');

// If requesting a static file that exists in public directory, serve it
if ($request_uri && file_exists($public_path . '/' . $request_uri)) {
    $file_path = $public_path . '/' . $request_uri;
    
    // Set appropriate MIME type
    $mime_types = [
        'css' => 'text/css',
        'js' => 'application/javascript',
        'png' => 'image/png',
        'jpg' => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'gif' => 'image/gif',
        'ico' => 'image/x-icon',
        'svg' => 'image/svg+xml'
    ];
    
    $extension = pathinfo($file_path, PATHINFO_EXTENSION);
    if (isset($mime_types[$extension])) {
        header('Content-Type: ' . $mime_types[$extension]);
    }
    
    readfile($file_path);
    exit;
}

// Change to Laravel's public directory
chdir($public_path);

// Include Laravel's index.php
require $public_path . '/index.php';
?> 