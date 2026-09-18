<?php
/**
 * Plugin Name: NewGlype Web Proxy
 * Plugin URI: https://github.com/sitsaz/newglype
 * Description: افزونه حرفه‌ای وب پروکسی نوین برای وردپرس با پشتیبانی از سایت‌های مدرن، مدیریت کوکی RFC 6265 و قلاب جاوااسکریپت کلاینت.
 * Version: 1.0.0
 * Author: sitsaz
 * Author URI: https://github.com/sitsaz
 * License: MIT
 * Text Domain: newglype-proxy
 */

if (!defined('ABSPATH')) {
    exit; // Prevent direct access
}

define('NEWGLYPE_VERSION', '1.0.0');
define('NEWGLYPE_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('NEWGLYPE_PLUGIN_URL', plugin_dir_url(__FILE__));

require_once NEWGLYPE_PLUGIN_DIR . 'includes/CookieJar.php';
require_once NEWGLYPE_PLUGIN_DIR . 'includes/ProxyEngine.php';

class NewGlypeWordPressPlugin {
    private static $instance = null;
    private $engine;

    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        // Activation & Deactivation
        register_activation_hook(__FILE__, [$this, 'activate']);
        register_deactivation_hook(__FILE__, [$this, 'deactivate']);

        // Gateway Request Interception (Priority 1 to capture before theme headers)
        add_action('init', [$this, 'handleGatewayRequest'], 1);

        // Shortcode
        add_shortcode('newglype_proxy', [$this, 'renderShortcode']);

        // Admin Menu
        add_action('admin_menu', [$this, 'registerAdminMenu']);
        add_action('admin_init', [$this, 'registerSettings']);
    }

    /**
     * Creates a dedicated page on activation if it doesn't already exist.
     */
    public function activate() {
        $existingPage = get_page_by_path('web-proxy');
        if (!$existingPage) {
            $pageId = wp_insert_post([
                'post_title'     => 'وب پروکسی NewGlype',
                'post_name'      => 'web-proxy',
                'post_content'   => '[newglype_proxy]',
                'post_status'    => 'publish',
                'post_type'      => 'page',
                'comment_status' => 'closed',
            ]);
            if ($pageId && !is_wp_error($pageId)) {
                update_option('newglype_page_id', $pageId);
            }
        }
    }

    public function deactivate() {
        // Safe deactivation
    }

    /**
     * Intercepts gateway requests (?newglype_gateway=1&url=...) before WordPress template rendering.
     */
    public function handleGatewayRequest() {
        if (!isset($_GET['newglype_gateway']) && !isset($_POST['newglype_gateway'])) {
            return;
        }

        // Initialize proxy engine with WordPress gateway URL
        $gatewayUrl = add_query_arg(['newglype_gateway' => '1'], home_url('/'));
        $engine = new NewGlypeProxyEngine($gatewayUrl);

        // 1. Handle Cookie Synchronization Beacon
        if (isset($_GET['action']) && $_GET['action'] === 'sync_cookie') {
            $url = isset($_POST['url']) ? sanitize_text_field($_POST['url']) : (isset($_GET['url']) ? sanitize_text_field($_GET['url']) : '');
            $cookie = isset($_POST['cookie']) ? sanitize_text_field($_POST['cookie']) : (isset($_GET['cookie']) ? sanitize_text_field($_GET['cookie']) : '');
            if (!empty($url) && !empty($cookie)) {
                $engine->getCookieJar()->addCookieFromHeader($cookie, $url);
            }
            header('Content-Type: application/json');
            echo json_encode(['success' => true]);
            exit;
        }

        // 2. Extract Target URL
        $targetUrl = isset($_GET['url']) ? trim($_GET['url']) : (isset($_POST['url']) ? trim($_POST['url']) : '');
        if (empty($targetUrl)) {
            wp_redirect(home_url('/web-proxy/'));
            exit;
        }

        if (!preg_match('#^https?://#i', $targetUrl)) {
            $targetUrl = 'https://' . $targetUrl;
        }

        $removeScripts = get_option('newglype_remove_scripts', '0') === '1' || (isset($_GET['removeScripts']) && $_GET['removeScripts'] == '1');
        $removeImages = get_option('newglype_remove_images', '0') === '1' || (isset($_GET['removeImages']) && $_GET['removeImages'] == '1');

        $method = $_SERVER['REQUEST_METHOD'];
        $postData = ($method === 'POST') ? file_get_contents('php://input') : null;

        $customHeaders = [];
        if (isset($_SERVER['CONTENT_TYPE'])) {
            $customHeaders['content-type'] = $_SERVER['CONTENT_TYPE'];
        }

        try {
            $result = $engine->executeRequest($targetUrl, $method, $postData, $customHeaders);

            // Allow framing and CORS
            header('Access-Control-Allow-Origin: *');
            header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
            header('Access-Control-Allow-Headers: *');

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
            exit;
        } catch (Exception $e) {
            http_response_code(502);
            header('Content-Type: text/html; charset=utf-8');
            echo '<div style="direction:rtl; font-family:tahoma; padding:30px; text-align:center;">';
            echo '<h3 style="color:#e11d48;">خطا در برقراری ارتباط با سایت مقصد</h3>';
            echo '<p>' . esc_html($e->getMessage()) . '</p>';
            echo '<p><a href="' . esc_url(home_url('/web-proxy/')) . '">← بازگشت به صفحه پروکسی</a></p>';
            echo '</div>';
            exit;
        }
    }

    /**
     * Renders the frontend UI via Shortcode: [newglype_proxy]
     */
    public function renderShortcode($atts = []) {
        $gatewayUrl = add_query_arg(['newglype_gateway' => '1'], home_url('/'));
        ob_start();
        ?>
        <div class="newglype-proxy-container" style="direction: rtl; font-family: inherit; margin: 25px 0;">
            <style>
                .newglype-proxy-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
                .newglype-header { margin-bottom: 20px; text-align: center; }
                .newglype-header h2 { font-size: 20px; font-weight: bold; margin-bottom: 6px; color: #0f172a; }
                .newglype-header p { font-size: 13px; color: #64748b; margin: 0; }
                .newglype-form-row { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
                .newglype-input { flex: 1; min-width: 250px; padding: 12px 16px; border: 1px solid #cbd5e1; border-radius: 10px; font-size: 14px; font-family: monospace; outline: none; transition: border-color 0.2s; }
                .newglype-input:focus { border-color: #4f46e5; box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15); }
                .newglype-btn { background: #4f46e5; color: #ffffff; border: none; padding: 12px 24px; border-radius: 10px; font-weight: bold; font-size: 14px; cursor: pointer; transition: background 0.2s; }
                .newglype-btn:hover { background: #4338ca; }
                .newglype-quick-links { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; font-size: 12px; color: #64748b; }
                .newglype-quick-badge { background: #f1f5f9; color: #334155; padding: 4px 10px; border-radius: 20px; text-decoration: none; border: 1px solid #e2e8f0; font-weight: 500; transition: all 0.2s; }
                .newglype-quick-badge:hover { background: #e0e7ff; color: #4338ca; border-color: #c7d2fe; }
                .newglype-features { margin-top: 20px; padding-top: 15px; border-top: 1px solid #f1f5f9; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; font-size: 12px; color: #475569; }
                .newglype-feat-item { display: flex; align-items: center; gap: 6px; }
                .newglype-feat-item span.dot { width: 6px; height: 6px; background: #10b981; border-radius: 50%; display: inline-block; }
            </style>

            <div class="newglype-proxy-card">
                <div class="newglype-header">
                    <h2>وب پروکسی NewGlype</h2>
                    <p>آدرس وبسایت مورد نظر خود را وارد کرده و به صورت مستقیم و بدون محدودیت متصل شوید.</p>
                </div>

                <form action="<?php echo esc_url(home_url('/')); ?>" method="GET" target="_blank">
                    <input type="hidden" name="newglype_gateway" value="1">
                    
                    <div class="newglype-form-row">
                        <input 
                            type="text" 
                            name="url" 
                            placeholder="https://example.com" 
                            required 
                            class="newglype-input"
                        >
                        <button type="submit" class="newglype-btn">
                            اتصال به سایت
                        </button>
                    </div>

                    <div class="newglype-quick-links">
                        <span>سایت‌های پرکاربرد:</span>
                        <a href="<?php echo esc_url(add_query_arg(['newglype_gateway' => '1', 'url' => 'https://html.duckduckgo.com/html/'], home_url('/'))); ?>" target="_blank" class="newglype-quick-badge">DuckDuckGo</a>
                        <a href="<?php echo esc_url(add_query_arg(['newglype_gateway' => '1', 'url' => 'https://en.m.wikipedia.org/'], home_url('/'))); ?>" target="_blank" class="newglype-quick-badge">Wikipedia</a>
                        <a href="<?php echo esc_url(add_query_arg(['newglype_gateway' => '1', 'url' => 'https://news.ycombinator.com/'], home_url('/'))); ?>" target="_blank" class="newglype-quick-badge">Hacker News</a>
                        <a href="<?php echo esc_url(add_query_arg(['newglype_gateway' => '1', 'url' => 'https://www.google.com/'], home_url('/'))); ?>" target="_blank" class="newglype-quick-badge">Google</a>
                    </div>

                    <div class="newglype-features">
                        <div class="newglype-feat-item"><span class="dot"></span> قلاب جاوااسکریپت و SPAs فعال</div>
                        <div class="newglype-feat-item"><span class="dot"></span> کوکی جار RFC 6265</div>
                        <div class="newglype-feat-item"><span class="dot"></span> حذف محدودیت‌های CSP و فریم</div>
                    </div>
                </form>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }

    /**
     * Adds Settings Menu to WordPress Admin Dashboard
     */
    public function registerAdminMenu() {
        add_menu_page(
            'تنظیمات پروکسی NewGlype',
            'پروکسی NewGlype',
            'manage_options',
            'newglype-proxy',
            [$this, 'renderAdminSettingsPage'],
            'dashicons-shield',
            65
        );
    }

    public function registerSettings() {
        register_setting('newglype_settings_group', 'newglype_remove_scripts');
        register_setting('newglype_settings_group', 'newglype_remove_images');
    }

    public function renderAdminSettingsPage() {
        $pageId = get_option('newglype_page_id');
        $pageUrl = $pageId ? get_permalink($pageId) : home_url('/web-proxy/');
        ?>
        <div class="wrap" style="direction: rtl; text-align: right;">
            <h1>تنظیمات افزونه وب پروکسی NewGlype</h1>
            
            <div style="background:#fff; border:1px solid #ccd0d4; padding:20px; border-radius:8px; margin-top:20px; max-width:800px;">
                <h2 style="font-size:16px;">صفحه اختصاصی پروکسی در سایت شما</h2>
                <p>این افزونه به صورت خودکار برگه اختصاصی پروکسی را در سایت شما ایجاد کرده است:</p>
                <p>
                    <a href="<?php echo esc_url($pageUrl); ?>" target="_blank" class="button button-primary">
                        مشاهده صفحه پروکسی در سایت: <?php echo esc_html($pageUrl); ?>
                    </a>
                </p>
                <p style="margin-top:15px; font-size:13px; color:#555;">
                    همچنین می‌توانید با قرار دادن شورت‌کد <code>[newglype_proxy]</code> در هر برگه یا نوشته دلخواه، فرم پروکسی را نمایش دهید.
                </p>
            </div>

            <form method="post" action="options.php" style="background:#fff; border:1px solid #ccd0d4; padding:20px; border-radius:8px; margin-top:20px; max-width:800px;">
                <?php settings_fields('newglype_settings_group'); ?>
                <h2 style="font-size:16px;">تنظیمات پیش‌فرض پروکسی</h2>
                <table class="form-table">
                    <tr>
                        <th scope="row">حذف اسکریپت‌ها</th>
                        <td>
                            <label>
                                <input type="checkbox" name="newglype_remove_scripts" value="1" <?php checked('1', get_option('newglype_remove_scripts')); ?>>
                                حذف خودکار تگ‌های &lt;script&gt; جهت امنیت و سرعت بالاتر
                            </label>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">حذف تصاویر</th>
                        <td>
                            <label>
                                <input type="checkbox" name="newglype_remove_images" value="1" <?php checked('1', get_option('newglype_remove_images')); ?>>
                                صرفه‌جویی در ترافیک هاست با عدم بارگذاری تصاویر
                            </label>
                        </td>
                    </tr>
                </table>
                <?php submit_button('ذخیره تنظیمات'); ?>
            </form>
        </div>
        <?php
    }
}

NewGlypeWordPressPlugin::getInstance();
