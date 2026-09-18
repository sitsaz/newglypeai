<?php
/**
 * NewGlype Modernized PHP Proxy Gateway
 * Entry point for all proxied requests and dynamic fetch/XHR calls.
 */

error_reporting(0);
ini_set('display_errors', '0');

require_once __DIR__ . '/includes/ProxyEngine.php';

$engine = new NewGlypeProxyEngine();

// 1. Handle dynamic document.cookie beacon synchronization from client
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

// 2. Extract target URL
$targetUrl = isset($_GET['url']) ? trim($_GET['url']) : (isset($_POST['url']) ? trim($_POST['url']) : '');
if (empty($targetUrl)) {
    header('Location: index.php');
    exit;
}

if (!preg_match('#^https?://#i', $targetUrl)) {
    $targetUrl = 'https://' . $targetUrl;
}

$removeScripts = isset($_GET['removeScripts']) && $_GET['removeScripts'] == '1';
$removeImages = isset($_GET['removeImages']) && $_GET['removeImages'] == '1';

$method = $_SERVER['REQUEST_METHOD'];
$postData = ($method === 'POST') ? file_get_contents('php://input') : null;

$customHeaders = [];
if (isset($_SERVER['CONTENT_TYPE'])) {
    $customHeaders['content-type'] = $_SERVER['CONTENT_TYPE'];
}

try {
    $result = $engine->executeRequest($targetUrl, $method, $postData, $customHeaders);

    // Sanitize headers to allow framing & CORS
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: *');

    // Remove restrictive security headers from PHP response
    if (function_exists('header_remove')) {
        header_remove('X-Frame-Options');
        header_remove('Content-Security-Policy');
    }

    $contentType = $result['contentType'];
    header('Content-Type: ' . $contentType);
    http_response_code($result['status']);

    $body = $result['body'];

    if (stripos($contentType, 'text/html') !== false) {
        $body = $engine->rewriteHtml($body, $targetUrl, $removeScripts, $removeImages);
    } elseif (stripos($contentType, 'text/css') !== false) {
        $body = $engine->rewriteCss($body, $targetUrl);
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
        <title>خطا در پردازش پروکسی - NewGlype</title>
        <style>
            body { font-family: Tahoma, sans-serif; background: #f8fafc; color: #1e293b; padding: 40px; margin: 0; }
            .box { max-width: 600px; margin: 40px auto; background: #fff; padding: 24px; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
            h2 { color: #e11d48; margin-top: 0; }
            p { font-size: 14px; line-height: 1.6; }
            a { display: inline-block; margin-top: 15px; color: #4f46e5; text-decoration: none; font-weight: bold; }
        </style>
    </head>
    <body>
        <div class="box">
            <h2>خطا در برقراری ارتباط با سایت مقصد</h2>
            <p><?php echo htmlspecialchars($e->getMessage()); ?></p>
            <p><strong>آدرس درخواست شده:</strong> <?php echo htmlspecialchars($targetUrl); ?></p>
            <a href="index.php">← بازگشت به صفحه اصلی پروکسی</a>
        </div>
    </body>
    </html>
    <?php
}
