<?php
/**
 * Stealth Web Portal Interface
 * Clean, modern, responsive UI without proxy footprints.
 * Compatible with all shared cPanel/Apache PHP 7.x - 8.x environments.
 */

require_once __DIR__ . '/includes/CookieJar.php';
require_once __DIR__ . '/includes/StealthCipher.php';

$jar = new StealthCookieJar();

if (isset($_GET['action']) && $_GET['action'] === 'clear_cookies') {
    $jar->clearAll();
    header('Location: index.php?cleared=1');
    exit;
}

$allCookies = $jar->getAllCookies();
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
                    سشن‌های فعال: <?php echo count($allCookies); ?>
                </span>
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
                <?php if (count($allCookies) > 0): ?>
                    <a 
                        href="index.php?action=clear_cookies" 
                        class="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold transition-colors cursor-pointer"
                        onclick="return confirm('آیا از حذف تمام کوکی‌ها و سشن‌ها اطمینان دارید؟');"
                    >
                        پاکسازی تمام کوکی‌ها
                    </a>
                <?php endif; ?>
            </div>

            <?php if (count($allCookies) === 0): ?>
                <div class="p-6 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-2xl">
                    در حال حاضر هیچ کوکی در این سشن ذخیره نشده است. با مرور سایت‌ها کوکی‌ها در اینجا ذخیره می‌شوند.
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

    </main>

    <!-- Footer -->
    <footer class="border-t border-slate-800/80 bg-slate-950 py-4 text-center text-xs text-slate-500">
        سیستم پرتال ابری نوین با پنهان‌سازی کامل ردپا و شبیه‌سازی مرورگر استاندارد
    </footer>

</body>
</html>
