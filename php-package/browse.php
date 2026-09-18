<?php
/**
 * Modernized Stealth Portal Stream Gateway
 * Disguised entry point for web browsing, SPA requests, and asset delivery.
 * No proxy markers, disguised query parameters, and bi-directional URL decryption.
 */

error_reporting(0);
ini_set('display_errors', '0');

require_once __DIR__ . '/includes/ProxyEngine.php';
require_once __DIR__ . '/includes/StealthCipher.php';

$tempCookies = (isset($_GET['temp']) && $_GET['temp'] == '1') || (isset($_POST['temp']) && $_POST['temp'] == '1');
$engine = new StealthPortalEngine('browse.php', $tempCookies);

// 1. Dynamic cookie beacon synchronization from client
if (isset($_GET['action']) && $_GET['action'] === 'sync_cookie') {
    $url = isset($_POST['url']) ? $_POST['url'] : (isset($_GET['url']) ? $_GET['url'] : '');
    $cookie = isset($_POST['cookie']) ? $_POST['cookie'] : (isset($_GET['cookie']) ? $_GET['cookie'] : '');

    if (!empty($url) && !empty($cookie)) {
        $engine->getCookieJar()->addCookieFromHeader($cookie, $url);
    }
    header('Content-Type: application/json');
    echo json_encode(['success' => true]);
    exit;
}

// 2. Extract and decode target URL
$rawParam = isset($_GET['b']) ? trim($_GET['b']) : (isset($_POST['b']) ? trim($_POST['b']) : '');
if (empty($rawParam)) {
    // Fallback if 'url' was passed
    $rawParam = isset($_GET['url']) ? trim($_GET['url']) : (isset($_POST['url']) ? trim($_POST['url']) : '');
}

if (empty($rawParam)) {
    header('Location: index.php');
    exit;
}

// Decode URL using StealthCipher (supports both encrypted XOR/Base64 and plain URLs)
$targetUrl = StealthCipher::decode($rawParam);

if (!preg_match('#^https?://#i', $targetUrl)) {
    $targetUrl = 'https://' . $targetUrl;
}

// Extract browsing flags matching Glype options
$options = [
    'removeScripts' => (isset($_GET['cp_rs']) && $_GET['cp_rs'] == '1') || (isset($_GET['rs']) && $_GET['rs'] == '1') || (isset($_POST['removeScripts']) && $_POST['removeScripts'] == '1'),
    'removeImages'  => (isset($_GET['cp_ri']) && $_GET['cp_ri'] == '1') || (isset($_GET['ri']) && $_GET['ri'] == '1') || (isset($_POST['removeImages']) && $_POST['removeImages'] == '1'),
    'stripTitle'    => (isset($_GET['cp_st']) && $_GET['cp_st'] == '1') || (isset($_GET['st']) && $_GET['st'] == '1') || (isset($_POST['stripTitle']) && $_POST['stripTitle'] == '1'),
    'showToolbar'   => (isset($_GET['cp_tb']) && $_GET['cp_tb'] == '1') || (isset($_GET['tb']) && $_GET['tb'] == '1') || (isset($_POST['showToolbar']) && $_POST['showToolbar'] == '1'),
    'encodeURL'     => (isset($_GET['cp_enc']) && $_GET['cp_enc'] == '1') || (isset($_GET['enc']) && $_GET['enc'] == '1') || (isset($_POST['encodeURL']) && $_POST['encodeURL'] == '1'),
];

$method = $_SERVER['REQUEST_METHOD'];
$postData = ($method === 'POST') ? file_get_contents('php://input') : null;

$customHeaders = [];
if (isset($_SERVER['CONTENT_TYPE'])) {
    $customHeaders['content-type'] = $_SERVER['CONTENT_TYPE'];
}

try {
    $result = $engine->executeRequest($targetUrl, $method, $postData, $customHeaders);

    // Sanitize headers to allow framing & CORS without revealing gateway signatures
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: *');

    if (function_exists('header_remove')) {
        header_remove('X-Frame-Options');
        header_remove('Content-Security-Policy');
        header_remove('X-Powered-By');
    }

    $contentType = $result['contentType'];
    header('Content-Type: ' . $contentType);
    http_response_code($result['status']);

    $body = $result['body'];

    if (stripos($contentType, 'text/html') !== false) {
        $body = $engine->rewriteHtml($body, $targetUrl, $options);
    } elseif (stripos($contentType, 'text/css') !== false) {
        $body = $engine->rewriteCss($body, $targetUrl, $options);
    }

    echo $body;
} catch (Exception $e) {
    http_response_code(502);
    header('Content-Type: text/html; charset=utf-8');
    ?>
    <!DOCTYPE html>
    <html lang="fa" dir="rtl">
    <head>
        <meta charset="UTF-8">
        <title>خطا در نمایش صفحه</title>
        <style>
            body { font-family: Tahoma, sans-serif; background: #0f172a; color: #f8fafc; padding: 40px; margin: 0; }
            .box { max-width: 580px; margin: 40px auto; background: #1e293b; padding: 28px; border-radius: 16px; border: 1px solid #334155; box-shadow: 0 10px 25px rgba(0,0,0,0.3); }
            h2 { color: #f43f5e; margin-top: 0; font-size: 18px; }
            p { font-size: 13px; line-height: 1.7; color: #cbd5e1; }
            a { display: inline-block; margin-top: 15px; color: #38bdf8; text-decoration: none; font-weight: bold; font-size: 13px; }
        </style>
    </head>
    <body>
        <div class="box">
            <h2>عدم برقراری ارتباط با وبگاه مقصد</h2>
            <p><?php echo htmlspecialchars($e->getMessage()); ?></p>
            <p style="font-family: monospace; font-size: 12px; color: #94a3b8; background: #0f172a; padding: 8px; border-radius: 8px;">
                آدرس: <?php echo htmlspecialchars($targetUrl); ?>
            </p>
            <a href="index.php">← بازگشت به صفحه پرتال</a>
        </div>
    </body>
    </html>
    <?php
}
