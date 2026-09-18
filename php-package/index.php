<?php
/**
 * Stealth Web Portal Interface - Version 22.0.0
 * Clean, modern, responsive UI without proxy footprints.
 * Compatible with all shared cPanel/Apache PHP 7.x - 8.x environments.
 * Includes user authentication and session upload from Chrome extension.
 */

session_start();

require_once __DIR__ . '/includes/CookieJar.php';
require_once __DIR__ . '/includes/StealthCipher.php';

$jar = new StealthCookieJar();

// Helper function for sanitization (since WordPress functions not available)
if (!function_exists('sanitize_text_field')) {
    function sanitize_text_field($str) {
        return htmlspecialchars(strip_tags(trim($str)), ENT_QUOTES, 'UTF-8');
    }
}

// Handle actions
$action = isset($_GET['action']) ? $_GET['action'] : (isset($_POST['action']) ? $_POST['action'] : '');

if ($action === 'clear_cookies') {
    $jar->clearAll();
    header('Location: index.php?cleared=1');
    exit;
}

// Handle AJAX for login/register/upload
if ($action === 'login' || $action === 'register' || $action === 'upload_session' || $action === 'clear_sessions') {
    header('Content-Type: application/json');
    
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
        exit;
    }
    
    $sessionsDir = __DIR__ . '/user-sessions/';
    if (!is_dir($sessionsDir)) {
        mkdir($sessionsDir, 0755, true);
        file_put_contents($sessionsDir . '.htaccess', "deny from all\n");
    }
    
    if ($action === 'register') {
        $username = isset($_POST['username']) ? preg_replace('/[^a-zA-Z0-9_]/', '', $_POST['username']) : '';
        $password = isset($_POST['password']) ? $_POST['password'] : '';
        
        if (strlen($username) < 3 || strlen($username) > 20) {
            echo json_encode(['success' => false, 'message' => 'نام کاربری باید بین ۳ تا ۲۰ کاراکتر باشد']);
            exit;
        }
        
        $userFile = $sessionsDir . 'users/' . $username . '.user';
        if (!is_dir($sessionsDir . 'users/')) {
            mkdir($sessionsDir . 'users/', 0755, true);
        }
        
        if (file_exists($userFile)) {
            echo json_encode(['success' => false, 'message' => 'این نام کاربری قبلاً ثبت شده است']);
            exit;
        }
        
        $userData = [
            'username' => $username,
            'password' => password_hash($password, PASSWORD_DEFAULT),
            'created' => time()
        ];
        
        if (file_put_contents($userFile, json_encode($userData))) {
            $_SESSION['logged_in'] = true;
            $_SESSION['username'] = $username;
            echo json_encode(['success' => true, 'message' => 'ثبت‌نام با موفقیت انجام شد', 'username' => $username]);
        } else {
            echo json_encode(['success' => false, 'message' => 'خطا در ثبت‌نام']);
        }
        exit;
    }
    
    if ($action === 'login') {
        $username = isset($_POST['username']) ? preg_replace('/[^a-zA-Z0-9_]/', '', $_POST['username']) : '';
        $password = isset($_POST['password']) ? $_POST['password'] : '';
        
        $userFile = $sessionsDir . 'users/' . $username . '.user';
        if (!file_exists($userFile)) {
            echo json_encode(['success' => false, 'message' => 'نام کاربری یا رمز عبور اشتباه است']);
            exit;
        }
        
        $userData = json_decode(file_get_contents($userFile), true);
        if ($userData && password_verify($password, $userData['password'])) {
            $_SESSION['logged_in'] = true;
            $_SESSION['username'] = $username;
            echo json_encode(['success' => true, 'message' => 'ورود با موفقیت انجام شد', 'username' => $username]);
        } else {
            echo json_encode(['success' => false, 'message' => 'نام کاربری یا رمز عبور اشتباه است']);
        }
        exit;
    }
    
    if ($action === 'logout') {
        unset($_SESSION['logged_in']);
        unset($_SESSION['username']);
        echo json_encode(['success' => true, 'message' => 'خروج با موفقیت انجام شد']);
        exit;
    }
    
    if ($action === 'upload_session') {
        if (!isset($_SESSION['logged_in']) || !isset($_SESSION['username'])) {
            echo json_encode(['success' => false, 'message' => 'لطفاً ابتدا وارد حساب کاربری خود شوید']);
            exit;
        }
        
        // Get raw POST data for cookies JSON
        $rawInput = isset($_POST['cookies']) ? $_POST['cookies'] : file_get_contents('php://input');
        if (empty($rawInput)) {
            echo json_encode(['success' => false, 'message' => 'داده‌های کوکی خالی است']);
            exit;
        }
        
        // Try to decode the JSON - it could be a string or already parsed
        $data = json_decode($rawInput, true);
        
        // If decoding fails, the input might already be an array from $_POST
        if (!$data && is_string($rawInput)) {
            // Try without sanitization first
            $data = json_decode($rawInput, true);
        }
        
        if (!$data || !is_array($data)) {
            echo json_encode(['success' => false, 'message' => 'داده‌های نامعتبر: فرمت JSON صحیح نیست. داده دریافتی: ' . substr($rawInput, 0, 100)]);
            exit;
        }
        
        $username = $_SESSION['username'];
        $userSessionDir = $sessionsDir . $username;
        if (!is_dir($userSessionDir)) {
            mkdir($userSessionDir, 0755, true);
        }
        
        $importedCount = 0;
        $failedCount = 0;
        
        foreach ($data as $cookie) {
            if (!isset($cookie['name']) || !isset($cookie['value'])) {
                $failedCount++;
                continue;
            }
            
            // Clean domain - remove leading dot if present
            $domain = isset($cookie['domain']) ? ltrim($cookie['domain'], '.') : '';
            
            $cookieFile = $userSessionDir . '/' . md5($cookie['name'] . '_' . $domain . '_' . time() . '_' . rand()) . '.cookie';
            $cookieData = [
                'name' => $cookie['name'],
                'value' => $cookie['value'],
                'domain' => $domain,
                'path' => $cookie['path'] ?? '/',
                'secure' => $cookie['secure'] ?? false,
                'httpOnly' => $cookie['httpOnly'] ?? false,
                'sameSite' => $cookie['sameSite'] ?? 'Lax',
                'expirationDate' => $cookie['expirationDate'] ?? null,
                'imported_at' => time(),
                'source_url' => ''
            ];
            
            if (file_put_contents($cookieFile, json_encode($cookieData))) {
                $importedCount++;
            } else {
                $failedCount++;
            }
        }
        
        echo json_encode(['success' => true, 'imported' => $importedCount, 'failed' => $failedCount, 'message' => "{$importedCount} کوکی با موفقیت وارد شد"]);
        exit;
    }
    
    if ($action === 'clear_sessions') {
        if (!isset($_SESSION['logged_in']) || !isset($_SESSION['username'])) {
            echo json_encode(['success' => false, 'message' => 'لطفاً ابتدا وارد شوید']);
            exit;
        }
        
        $username = $_SESSION['username'];
        $userSessionDir = $sessionsDir . $username;
        
        if (is_dir($userSessionDir)) {
            $files = glob($userSessionDir . '/*.cookie');
            if ($files) {
                foreach ($files as $file) {
                    unlink($file);
                }
            }
            @rmdir($userSessionDir);
        }
        
        echo json_encode(['success' => true, 'message' => 'تمام سشن‌ها پاکسازی شدند']);
        exit;
    }
}

$allCookies = $jar->getAllCookies();

// Check if user is logged in
$isLoggedIn = isset($_SESSION['logged_in']) && isset($_SESSION['username']);
$username = $isLoggedIn ? $_SESSION['username'] : '';

// Count user sessions if logged in
$userSessionCount = 0;
if ($isLoggedIn) {
    $userSessionDir = __DIR__ . '/user-sessions/' . $username;
    if (is_dir($userSessionDir)) {
        $files = glob($userSessionDir . '/*.cookie');
        $userSessionCount = $files ? count($files) : 0;
    }
}

$displayCookieCount = $isLoggedIn ? $userSessionCount : count($allCookies);
?>
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>پرتال مرورگر ابری - Web Stream Portal</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Tahoma, sans-serif; }
    </style>
</head>
<body class="bg-slate-900 text-slate-100 min-h-screen flex flex-col justify-between selection:bg-blue-500 selection:text-white">

    <!-- Header -->
    <header class="bg-slate-950/80 backdrop-blur border-b border-slate-800 shadow-md">
        <div class="max-w-5xl mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-3">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-lg text-white shadow-lg shadow-blue-500/20">
                    🌐
                </div>
                <div>
                    <h1 class="text-base font-bold text-white tracking-tight">پرتال مرورگر وب (Cloud Portal)</h1>
                    <p class="text-xs text-slate-400">سامانه نمایش مستقیم و روان اسناد و وبگاه‌ها با کوکی‌جار RFC 6265</p>
                </div>
            </div>
            <div class="flex items-center gap-2 text-xs">
                <span class="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    موتور: PHP <?php echo PHP_VERSION; ?>
                </span>
                <span class="px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-mono">
                    سشن‌های فعال: <?php echo $displayCookieCount; ?>
                </span>
                <?php if ($isLoggedIn): ?>
                <span class="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    ✓ <?php echo htmlspecialchars($username); ?>
                </span>
                <button onclick="cpLogout()" class="px-2.5 py-1 rounded-full bg-slate-700 hover:bg-slate-600 text-slate-300 border border-slate-600 cursor-pointer">
                    خروج
                </button>
                <?php endif; ?>
            </div>
        </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-4xl w-full mx-auto px-4 py-8 flex-1 flex flex-col justify-center">
        
        <?php if (isset($_GET['cleared'])): ?>
            <div class="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs text-center">
                ✓ تمامی کوکی‌ها و سشن‌های ذخیره شده با موفقیت پاکسازی شدند.
            </div>
        <?php endif; ?>

        <!-- Portal Search / Browse Card -->
        <div class="bg-slate-950 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
            <div class="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>

            <div class="text-center max-w-xl mx-auto mb-6">
                <h2 class="text-xl md:text-2xl font-black text-white tracking-tight mb-2">
                    ورود به وبگاه از طریق پرتال
                </h2>
                <p class="text-xs text-slate-400 leading-relaxed">
                    نشانی اینترنتی وبگاه مورد نظر خود را وارد کنید. آدرس‌ها به صورت امن کدگذاری شده و محدودیت‌های فریم برطرف می‌شوند.
                </p>
            </div>

            <form action="browse.php" method="GET" class="space-y-5">
                <div class="flex flex-col sm:flex-row gap-2.5">
                    <input 
                        type="text" 
                        name="b" 
                        placeholder="https://example.com یا آدرس مورد نظر..." 
                        required 
                        class="flex-1 px-4 py-3.5 rounded-2xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-sm font-mono focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    >
                    <button 
                        type="submit" 
                        class="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-blue-500/25 transition-all cursor-pointer shrink-0"
                    >
                        شروع مرور وب ↵
                    </button>
                </div>

                <!-- Comprehensive Glype Feature Checkboxes -->
                <div class="pt-4 border-t border-slate-800/80">
                    <div class="text-[11px] font-bold text-slate-400 mb-3 flex items-center gap-1.5">
                        ⚙️ گزینه‌ها و تنظیمات مرور (Glype Options):
                    </div>
                    <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs text-slate-300">
                        <label class="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 cursor-pointer select-none">
                            <input type="checkbox" name="enc" value="1" checked class="rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-0">
                            <span>کدگذاری آدرس (Encode URL)</span>
                        </label>
                        <label class="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 cursor-pointer select-none">
                            <input type="checkbox" name="tb" value="1" checked class="rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-0">
                            <span>نوار ابزار بالا (Mini Toolbar)</span>
                        </label>
                        <label class="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 cursor-pointer select-none">
                            <input type="checkbox" name="st" value="1" class="rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-0">
                            <span>مخفی‌سازی عنوان (Strip Title)</span>
                        </label>
                        <label class="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 cursor-pointer select-none">
                            <input type="checkbox" name="rs" value="1" class="rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-0">
                            <span>حذف اسکریپت‌ها (No Scripts)</span>
                        </label>
                        <label class="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 cursor-pointer select-none">
                            <input type="checkbox" name="ri" value="1" class="rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-0">
                            <span>عدم لود تصاویر (No Images)</span>
                        </label>
                        <label class="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 cursor-pointer select-none">
                            <input type="checkbox" name="temp" value="1" class="rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-0">
                            <span>کوکی‌های موقت (Temp Cookies)</span>
                        </label>
                    </div>
                </div>

                <!-- Quick Presets -->
                <div class="pt-4 border-t border-slate-800/80 flex flex-wrap items-center gap-2 text-xs">
                    <span class="text-slate-400">سایت‌های نمونه:</span>
                    <?php
                    $presets = [
                        'DuckDuckGo' => 'https://html.duckduckgo.com/html/',
                        'Wikipedia'  => 'https://en.m.wikipedia.org/',
                        'Hacker News'=> 'https://news.ycombinator.com/',
                        'Google'     => 'https://www.google.com/',
                    ];
                    foreach ($presets as $title => $url):
                        $encUrl = StealthCipher::encode($url);
                    ?>
                        <a 
                            href="browse.php?b=<?php echo urlencode($encUrl); ?>&enc=1&tb=1" 
                            class="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
                        >
                            <?php echo htmlspecialchars($title); ?>
                        </a>
                    <?php endforeach; ?>
                </div>
            </form>
        </div>

        <!-- Session Cookies Management Table -->
        <div class="mt-8 bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <div class="flex justify-between items-center mb-4">
                <div>
                    <h3 class="text-sm font-bold text-white">مدیریت نشست‌ها و کوکی‌ها (Session Store)</h3>
                    <p class="text-xs text-slate-400">کوکی‌های RFC 6265 ذخیره شده به صورت تفکیک شده بر پایه دامنه</p>
                </div>
                <?php if ($isLoggedIn): ?>
                <button onclick="cpClearSessions()" class="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold transition-colors cursor-pointer" onclick="return confirm('آیا از حذف تمام کوکی‌ها و سشن‌ها اطمینان دارید؟');">
                    پاکسازی تمام کوکی‌ها
                </button>
                <?php elseif (count($allCookies) > 0): ?>
                <a 
                    href="index.php?action=clear_cookies" 
                    class="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold transition-colors cursor-pointer"
                    onclick="return confirm('آیا از حذف تمام کوکی‌ها و سشن‌ها اطمینان دارید؟');"
                >
                    پاکسازی تمام کوکی‌ها
                </a>
                <?php endif; ?>
            </div>

            <?php if (!$isLoggedIn && count($allCookies) === 0): ?>
                <div class="p-6 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-2xl">
                    در حال حاضر هیچ کوکی در این سشن ذخیره نشده است. با مرور سایت‌ها کوکی‌ها در اینجا ذخیره می‌شوند.
                </div>
            <?php elseif ($isLoggedIn && $userSessionCount === 0): ?>
                <div class="p-6 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-2xl">
                    هنوز هیچ کوکی‌ای برای حساب شما ذخیره نشده است. از افزونه کروم خروجی بگیرید و آپلود کنید.
                </div>
            <?php else: ?>
                <div class="overflow-x-auto">
                    <table class="w-full text-right text-xs">
                        <thead>
                            <tr class="border-b border-slate-800 text-slate-400">
                                <th class="pb-2">دامنه</th>
                                <th class="pb-2">نام کلید</th>
                                <th class="pb-2">مسیر</th>
                                <th class="pb-2">انقضا</th>
                                <th class="pb-2">امنیت</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-800/60 font-mono text-slate-300">
                            <?php foreach ($allCookies as $c): ?>
                                <tr>
                                    <td class="py-2 text-blue-400"><?php echo htmlspecialchars($c['domain']); ?></td>
                                    <td class="py-2 text-white font-bold"><?php echo htmlspecialchars($c['key']); ?></td>
                                    <td class="py-2 text-slate-400"><?php echo htmlspecialchars($c['path']); ?></td>
                                    <td class="py-2 text-slate-400">
                                        <?php echo $c['expires'] ? date('Y-m-d H:i', $c['expires']) : 'سشن (Session)'; ?>
                                    </td>
                                    <td class="py-2">
                                        <?php if ($c['secure']): ?><span class="text-emerald-400">Secure</span><?php endif; ?>
                                        <?php if ($c['httpOnly']): ?><span class="text-indigo-400 mr-1">HttpOnly</span><?php endif; ?>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
            <?php endif; ?>
        </div>

        <!-- Login/Register Modal (for standalone) -->
        <?php if (!$isLoggedIn): ?>
        <div id="cpLoginModal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); z-index:999999; justify-content:center; align-items:center;">
            <div style="background:#1e293b; padding:24px; border-radius:16px; max-width:400px; width:90%; border:1px solid #334155; position:relative;">
                <button onclick="cpHideLoginModal()" style="position:absolute; top:10px; right:10px; background:none; border:none; color:#94a3b8; font-size:20px; cursor:pointer;">&times;</button>
                <h3 style="margin-top:0; color:#fff; font-size:16px; text-align:center;">ورود / ثبت‌نام</h3>
                
                <div id="cpLoginForm">
                    <input type="text" id="cpUsername" placeholder="نام کاربری" style="width:100%; padding:10px; margin:8px 0; background:#0f172a; border:1px solid #334155; border-radius:8px; color:#fff; box-sizing:border-box;">
                    <input type="password" id="cpPassword" placeholder="رمز عبور" style="width:100%; padding:10px; margin:8px 0; background:#0f172a; border:1px solid #334155; border-radius:8px; color:#fff; box-sizing:border-box;">
                    <button onclick="cpLogin()" style="width:100%; padding:10px; background:#2563eb; color:#fff; border:none; border-radius:8px; font-weight:bold; cursor:pointer; margin-top:8px;">ورود</button>
                    <button onclick="cpRegister()" style="width:100%; padding:10px; background:#10b981; color:#fff; border:none; border-radius:8px; font-weight:bold; cursor:pointer; margin-top:8px;">ثبت‌نام</button>
                    <p id="cpLoginMsg" style="margin-top:10px; font-size:12px; text-align:center;"></p>
                </div>
            </div>
        </div>
        
        <!-- Upload Session Section (for logged in users) -->
        <?php else: ?>
        <div class="mt-6 bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <div style="font-size:11px; font-weight:bold; color:#94a3b8; margin-bottom:8px;">📤 آپلود فایل سشن از افزونه کروم:</div>
            <p style="font-size:10px; color:#64748b; margin:0 0 8px 0;">فایل JSON خروجی گرفته شده از افزونه کروم را اینجا آپلود کنید تا سشن‌ها و کوکی‌های شما منتقل شوند.</p>
            <input type="file" id="cpSessionFile" accept=".json" style="font-size:11px; color:#cbd5e1; margin-bottom:8px;">
            <button onclick="cpUploadSession()" style="padding:8px 16px; background:#2563eb; color:#fff; border:none; border-radius:8px; font-size:11px; font-weight:bold; cursor:pointer;">آپلود سشن</button>
            <div id="cpUploadStatus" style="margin-top:8px; font-size:11px;"></div>
            
            <div style="margin-top:12px; text-align:left;">
                <button onclick="cpClearSessions()" style="padding:8px 16px; background:#ef4444; color:#fff; border:none; border-radius:8px; font-size:11px; font-weight:bold; cursor:pointer;">🗑️ حذف تمام سشن‌ها</button>
            </div>
        </div>
        <?php endif; ?>

    </main>

    <!-- Footer -->
    <footer class="border-t border-slate-800/80 bg-slate-950 py-4 text-center text-xs text-slate-500">
        سیستم پرتال ابری نوین با پنهان‌سازی کامل ردپا و شبیه‌سازی مرورگر استاندارد - نسخه ۲۲.۰.۰
    </footer>

    <script>
    function cpShowLoginModal() { document.getElementById('cpLoginModal').style.display = 'flex'; }
    function cpHideLoginModal() { document.getElementById('cpLoginModal').style.display = 'none'; }
    
    function cpLogin() {
        var username = document.getElementById('cpUsername').value.trim();
        var password = document.getElementById('cpPassword').value;
        var msgEl = document.getElementById('cpLoginMsg');
        
        if (!username || !password) { msgEl.textContent = 'لطفاً نام کاربری و رمز عبور را وارد کنید'; msgEl.style.color = '#f43f5e'; return; }
        
        var formData = new FormData();
        formData.append('action', 'login');
        formData.append('username', username);
        formData.append('password', password);
        
        fetch('index.php', { method: 'POST', body: formData })
        .then(r => r.json())
        .then(data => {
            if (data.success) { msgEl.textContent = data.message; msgEl.style.color = '#10b981'; setTimeout(() => { location.reload(); }, 1500); }
            else { msgEl.textContent = data.message; msgEl.style.color = '#f43f5e'; }
        })
        .catch(e => { msgEl.textContent = 'خطا در ارتباط با سرور'; msgEl.style.color = '#f43f5e'; });
    }
    
    function cpRegister() {
        var username = document.getElementById('cpUsername').value.trim();
        var password = document.getElementById('cpPassword').value;
        var msgEl = document.getElementById('cpLoginMsg');
        
        if (!username || !password) { msgEl.textContent = 'لطفاً نام کاربری و رمز عبور را وارد کنید'; msgEl.style.color = '#f43f5e'; return; }
        
        var formData = new FormData();
        formData.append('action', 'register');
        formData.append('username', username);
        formData.append('password', password);
        
        fetch('index.php', { method: 'POST', body: formData })
        .then(r => r.json())
        .then(data => {
            if (data.success) { msgEl.textContent = data.message; msgEl.style.color = '#10b981'; setTimeout(() => { location.reload(); }, 1500); }
            else { msgEl.textContent = data.message; msgEl.style.color = '#f43f5e'; }
        })
        .catch(e => { msgEl.textContent = 'خطا در ارتباط با سرور'; msgEl.style.color = '#f43f5e'; });
    }
    
    function cpLogout() {
        var formData = new FormData();
        formData.append('action', 'logout');
        fetch('index.php', { method: 'POST', body: formData })
        .then(r => r.json())
        .then(data => { if (data.success) location.reload(); });
    }
    
    function cpUploadSession() {
        var fileInput = document.getElementById('cpSessionFile');
        var statusEl = document.getElementById('cpUploadStatus');
        
        if (!fileInput.files.length) { statusEl.textContent = 'لطفاً یک فایل JSON انتخاب کنید'; statusEl.style.color = '#f43f5e'; return; }
        
        var reader = new FileReader();
        reader.onload = function(e) {
            try {
                var data = JSON.parse(e.target.result);
                if (!data.cookies || !Array.isArray(data.cookies)) throw new Error('فرمت فایل نامعتبر است. فایل باید شامل آرایه cookies باشد.');
                
                var formData = new FormData();
                formData.append('action', 'upload_session');
                formData.append('cookies', JSON.stringify(data.cookies));
                
                fetch('index.php', { method: 'POST', body: formData })
                .then(r => r.json())
                .then(res => {
                    if (res.success) { statusEl.textContent = res.message; statusEl.style.color = '#10b981'; }
                    else { statusEl.textContent = res.message || 'خطا در آپلود'; statusEl.style.color = '#f43f5e'; }
                })
                .catch(err => { statusEl.textContent = 'خطا در ارتباط با سرور'; statusEl.style.color = '#f43f5e'; });
            } catch(err) {
                statusEl.textContent = 'خطا: ' + err.message; statusEl.style.color = '#f43f5e';
            }
        };
        reader.readAsText(fileInput.files[0]);
    }
    
    function cpClearSessions() {
        if (!confirm('آیا از حذف تمام سشن‌ها و کوکی‌ها اطمینان دارید؟')) return;
        
        var formData = new FormData();
        formData.append('action', 'clear_sessions');
        
        fetch('index.php', { method: 'POST', body: formData })
        .then(r => r.json())
        .then(data => {
            if (data.success) { alert(data.message); location.reload(); }
            else { alert(data.message || 'خطا در حذف سشن‌ها'); }
        })
        .catch(e => { alert('خطا در ارتباط با سرور'); });
    }
    </script>

</body>
</html>
