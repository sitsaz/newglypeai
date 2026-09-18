<?php
/**
 * Session Import Handler for Chrome Extension
 * Receives cookies from Chrome extension and imports them into the proxy session
 */

// Enable error reporting for debugging (disable in production)
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit();
}

// Get JSON input
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data || !isset($data['cookies']) || !isset($data['username'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid data format']);
    exit();
}

// Validate username (alphanumeric only)
$username = preg_replace('/[^a-zA-Z0-9_]/', '', $data['username']);
if (empty($username)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid username']);
    exit();
}

// Define session directory
$sessionDir = __DIR__ . '/sessions/' . $username;
if (!is_dir($sessionDir)) {
    mkdir($sessionDir, 0755, true);
}

// Process cookies
$cookies = $data['cookies'];
$importedCount = 0;
$failedCount = 0;

foreach ($cookies as $cookie) {
    if (!isset($cookie['name']) || !isset($cookie['value'])) {
        $failedCount++;
        continue;
    }
    
    // Create cookie file
    $cookieFile = $sessionDir . '/' . md5($cookie['name'] . '_' . $cookie['domain']) . '.cookie';
    $cookieData = [
        'name' => $cookie['name'],
        'value' => $cookie['value'],
        'domain' => $cookie['domain'] ?? '',
        'path' => $cookie['path'] ?? '/',
        'secure' => $cookie['secure'] ?? false,
        'httpOnly' => $cookie['httpOnly'] ?? false,
        'sameSite' => $cookie['sameSite'] ?? 'Lax',
        'expirationDate' => $cookie['expirationDate'] ?? null,
        'imported_at' => time()
    ];
    
    if (file_put_contents($cookieFile, json_encode($cookieData))) {
        $importedCount++;
    } else {
        $failedCount++;
    }
}

// Return success response
echo json_encode([
    'success' => true,
    'imported' => $importedCount,
    'failed' => $failedCount,
    'username' => $username,
    'message' => "Successfully imported {$importedCount} cookies"
]);
