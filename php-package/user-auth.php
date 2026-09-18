<?php
/**
 * User Authentication & Session Upload Handler for Cloud Portal
 * Handles user registration, login, and session file upload from Chrome extension
 */

if (!defined('ABSPATH')) {
    exit;
}

// Handle AJAX actions for non-logged-in users too
add_action('wp_ajax_cp_register', 'cp_handle_register');
add_action('wp_ajax_nopriv_cp_register', 'cp_handle_register');
add_action('wp_ajax_cp_login', 'cp_handle_login');
add_action('wp_ajax_nopriv_cp_login', 'cp_handle_login');
add_action('wp_ajax_cp_upload_session', 'cp_handle_upload_session');
add_action('wp_ajax_nopriv_cp_upload_session', 'cp_handle_upload_session');
add_action('wp_ajax_cp_clear_sessions', 'cp_handle_clear_sessions');
add_action('wp_ajax_nopriv_cp_clear_sessions', 'cp_handle_clear_sessions');

/**
 * Ensure sessions directory exists
 */
function cp_ensure_sessions_dir() {
    if (!is_dir(CLOUD_PORTAL_SESSIONS_DIR)) {
        wp_mkdir_p(CLOUD_PORTAL_SESSIONS_DIR);
    }
    // Add .htaccess to prevent direct access
    $htaccessFile = CLOUD_PORTAL_SESSIONS_DIR . '.htaccess';
    if (!file_exists($htaccessFile)) {
        file_put_contents($htaccessFile, "deny from all\n");
    }
}

/**
 * Handle user registration
 */
function cp_handle_register() {
    header('Content-Type: application/json');
    
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        wp_send_json_error(['message' => 'Method not allowed']);
        return;
    }
    
    $username = isset($_POST['username']) ? sanitize_text_field($_POST['username']) : '';
    $password = isset($_POST['password']) ? $_POST['password'] : '';
    
    if (empty($username) || empty($password)) {
        wp_send_json_error(['message' => 'نام کاربری و رمز عبور الزامی است']);
        return;
    }
    
    // Validate username (alphanumeric only)
    $username = preg_replace('/[^a-zA-Z0-9_]/', '', $username);
    if (strlen($username) < 3 || strlen($username) > 20) {
        wp_send_json_error(['message' => 'نام کاربری باید بین ۳ تا ۲۰ کاراکتر باشد']);
        return;
    }
    
    // Check if user already exists
    if (username_exists($username)) {
        wp_send_json_error(['message' => 'این نام کاربری قبلاً ثبت شده است']);
        return;
    }
    
    // Create user
    $user_id = wp_create_user($username, $password, $username . '@cloudportal.local');
    
    if (is_wp_error($user_id)) {
        wp_send_json_error(['message' => $user_id->get_error_message()]);
        return;
    }
    
    // Auto login
    wp_set_current_user($user_id);
    wp_set_auth_cookie($user_id, true);
    
    cp_ensure_sessions_dir();
    
    wp_send_json_success([
        'message' => 'ثبت‌نام با موفقیت انجام شد',
        'username' => $username
    ]);
}

/**
 * Handle user login
 */
function cp_handle_login() {
    header('Content-Type: application/json');
    
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        wp_send_json_error(['message' => 'Method not allowed']);
        return;
    }
    
    $username = isset($_POST['username']) ? sanitize_text_field($_POST['username']) : '';
    $password = isset($_POST['password']) ? $_POST['password'] : '';
    
    if (empty($username) || empty($password)) {
        wp_send_json_error(['message' => 'نام کاربری و رمز عبور الزامی است']);
        return;
    }
    
    $user = wp_authenticate($username, $password);
    
    if (is_wp_error($user)) {
        wp_send_json_error(['message' => 'نام کاربری یا رمز عبور اشتباه است']);
        return;
    }
    
    wp_set_current_user($user->ID);
    wp_set_auth_cookie($user->ID, true);
    
    cp_ensure_sessions_dir();
    
    wp_send_json_success([
        'message' => 'ورود با موفقیت انجام شد',
        'username' => $user->user_login
    ]);
}

/**
 * Handle session file upload from Chrome extension
 */
function cp_handle_upload_session() {
    header('Content-Type: application/json');
    
    // Verify nonce if logged in
    if (is_user_logged_in()) {
        check_ajax_referer('cp_upload_nonce', 'nonce', false);
    }
    
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        wp_send_json_error(['message' => 'Method not allowed']);
        return;
    }
    
    // Get JSON input
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if (!$data || !isset($data['cookies'])) {
        wp_send_json_error(['message' => 'داده‌های نامعتبر']);
        return;
    }
    
    // Determine username
    if (is_user_logged_in()) {
        $current_user = wp_get_current_user();
        $username = $current_user->user_login;
    } elseif (isset($data['username'])) {
        $username = preg_replace('/[^a-zA-Z0-9_]/', '', $data['username']);
        if (empty($username) || !username_exists($username)) {
            wp_send_json_error(['message' => 'کاربر یافت نشد. لطفاً ابتدا وارد حساب خود شوید']);
            return;
        }
    } else {
        wp_send_json_error(['message' => 'لطفاً ابتدا وارد حساب کاربری خود شوید']);
        return;
    }
    
    cp_ensure_sessions_dir();
    
    $sessionDir = CLOUD_PORTAL_SESSIONS_DIR . $username;
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
        
        $cookieFile = $sessionDir . '/' . md5($cookie['name'] . '_' . $cookie['domain'] . '_' . time()) . '.cookie';
        $cookieData = [
            'name' => $cookie['name'],
            'value' => $cookie['value'],
            'domain' => $cookie['domain'] ?? '',
            'path' => $cookie['path'] ?? '/',
            'secure' => $cookie['secure'] ?? false,
            'httpOnly' => $cookie['httpOnly'] ?? false,
            'sameSite' => $cookie['sameSite'] ?? 'Lax',
            'expirationDate' => $cookie['expirationDate'] ?? null,
            'imported_at' => time(),
            'source_url' => $data['url'] ?? ''
        ];
        
        if (file_put_contents($cookieFile, json_encode($cookieData))) {
            $importedCount++;
        } else {
            $failedCount++;
        }
    }
    
    wp_send_json_success([
        'imported' => $importedCount,
        'failed' => $failedCount,
        'message' => "{$importedCount} کوکی با موفقیت وارد شد"
    ]);
}

/**
 * Handle clearing user sessions
 */
function cp_handle_clear_sessions() {
    header('Content-Type: application/json');
    
    if (!is_user_logged_in()) {
        wp_send_json_error(['message' => 'لطفاً ابتدا وارد شوید']);
        return;
    }
    
    $current_user = wp_get_current_user();
    $username = $current_user->user_login;
    $sessionDir = CLOUD_PORTAL_SESSIONS_DIR . $username;
    
    if (is_dir($sessionDir)) {
        cp_delete_directory($sessionDir);
    }
    
    wp_send_json_success(['message' => 'تمام سشن‌ها پاکسازی شدند']);
}

/**
 * Helper function to delete directory recursively
 */
function cp_delete_directory($dir) {
    if (!is_dir($dir)) {
        return false;
    }
    
    $files = array_diff(scandir($dir), ['.', '..']);
    foreach ($files as $file) {
        $path = $dir . '/' . $file;
        if (is_dir($path)) {
            cp_delete_directory($path);
        } else {
            unlink($path);
        }
    }
    rmdir($dir);
    return true;
}

/**
 * Get user's session count
 */
function cp_get_user_session_count() {
    if (!is_user_logged_in()) {
        return 0;
    }
    
    $current_user = wp_get_current_user();
    $username = $current_user->user_login;
    $sessionDir = CLOUD_PORTAL_SESSIONS_DIR . $username;
    
    if (!is_dir($sessionDir)) {
        return 0;
    }
    
    $files = glob($sessionDir . '/*.cookie');
    return $files ? count($files) : 0;
}

/**
 * Load user's session cookies into CookieJar
 */
function cp_load_user_sessions($cookieJar) {
    if (!is_user_logged_in()) {
        return;
    }
    
    $current_user = wp_get_current_user();
    $username = $current_user->user_login;
    $sessionDir = CLOUD_PORTAL_SESSIONS_DIR . $username;
    
    if (!is_dir($sessionDir)) {
        return;
    }
    
    $files = glob($sessionDir . '/*.cookie');
    if (!$files) {
        return;
    }
    
    foreach ($files as $file) {
        $cookieData = json_decode(file_get_contents($file), true);
        if ($cookieData && isset($cookieData['domain'], $cookieData['name'], $cookieData['value'])) {
            $domain = $cookieData['domain'];
            if (!isset($_SESSION['_c_vault_store'][$domain])) {
                $_SESSION['_c_vault_store'][$domain] = [];
            }
            $_SESSION['_c_vault_store'][$domain][$cookieData['name']] = [
                'key' => $cookieData['name'],
                'value' => $cookieData['value'],
                'domain' => $domain,
                'path' => $cookieData['path'] ?? '/',
                'expires' => $cookieData['expirationDate'] ?? null,
                'secure' => $cookieData['secure'] ?? false,
                'httpOnly' => $cookieData['httpOnly'] ?? false,
                'sameSite' => $cookieData['sameSite'] ?? 'Lax',
                'created' => $cookieData['imported_at'] ?? time()
            ];
        }
    }
}
