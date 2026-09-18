<?php
/**
 * NewGlype Modernized Web Interface for PHP Standalone Hosting
 * Compatible with all shared cPanel/Apache PHP 7.x - 8.x environments.
 */

require_once __DIR__ . '/includes/CookieJar.php';

$jar = new NewGlypeCookieJar();

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
    <title>NewGlype Web Proxy - هاست اختصاصی PHP</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Tahoma, sans-serif; }
    </style>
</head>
<body class="bg-slate-100 text-slate-800 min-h-screen flex flex-col justify-between">

    <!-- Header -->
    <header class="bg-slate-900 text-white shadow-md border-b border-slate-800">
        <div class="max-w-6xl mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center gap-3">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-lg text-white shadow-md">
                    🛡️
                </div>
                <div>
                    <h1 class="text-lg font-bold">NewGlype Web Proxy (نسخه PHP)</h1>
                    <p class="text-xs text-slate-400">موتور بهینه‌سازی شده برای هاست‌های اشتراکی رایگان با قلاب جاوااسکریپت و RFC 6265</p>
                </div>
            </div>
            <div class="flex items-center gap-2 text-xs">
                <span class="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    PHP: <?php echo PHP_VERSION; ?>
                </span>
                <span class="px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    کوکی‌های فعال: <?php echo count($allCookies); ?>
                </span>
            </div>
        </div>
    </header>

    <!-- Main Container -->
    <main class="max-w-4xl mx-auto w-full px-4 py-8 space-y-6">

        <?php if (isset($_GET['cleared'])): ?>
            <div class="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold">
                ✓ تمامی کوکی‌های جلسه با موفقیت پاکسازی شدند.
            </div>
        <?php endif; ?>

        <!-- Search / URL Card -->
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
            <div class="text-center space-y-1">
                <h2 class="text-xl font-bold text-slate-900">مرور وب با استانداردهای نوین</h2>
                <p class="text-xs text-slate-500">آدرس اینترنتی مورد نظر را وارد کرده و مستقیماً از طریق پروکسی به آن متصل شوید.</p>
            </div>

            <form action="proxy.php" method="GET" class="space-y-4">
                <div class="flex flex-col sm:flex-row gap-2">
                    <input 
                        type="text" 
                        name="url" 
                        placeholder="https://example.com" 
                        required 
                        class="flex-1 px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-900"
                    />
                    <button 
                        type="submit" 
                        class="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition-colors cursor-pointer shadow-md"
                    >
                        اتصال به سایت
                    </button>
                </div>

                <!-- Toggles -->
                <div class="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-2 border-t border-slate-100">
                    <label class="flex items-center gap-1.5 cursor-pointer">
                        <input type="checkbox" name="removeScripts" value="1" class="rounded text-indigo-600 focus:ring-indigo-500">
                        <span>حذف اسکریپت‌ها (حالت امن / سرعت بالا)</span>
                    </label>
                    <label class="flex items-center gap-1.5 cursor-pointer">
                        <input type="checkbox" name="removeImages" value="1" class="rounded text-indigo-600 focus:ring-indigo-500">
                        <span>حذف تصاویر (صرفه‌جویی در ترافیک)</span>
                    </label>
                </div>
            </form>

            <!-- Quick Sites -->
            <div class="pt-2 flex flex-wrap items-center gap-2 text-xs">
                <span class="text-slate-400 font-medium">سایت‌های پرکاربرد:</span>
                <a href="proxy.php?url=https%3A%2F%2Fhtml.duckduckgo.com%2Fhtml%2F" class="px-3 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 rounded-full font-medium transition-colors">DuckDuckGo</a>
                <a href="proxy.php?url=https%3A%2F%2Fen.m.wikipedia.org%2F" class="px-3 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 rounded-full font-medium transition-colors">Wikipedia</a>
                <a href="proxy.php?url=https%3A%2F%2Fnews.ycombinator.com%2F" class="px-3 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 rounded-full font-medium transition-colors">Hacker News</a>
                <a href="proxy.php?url=https%3A%2F%2Fwww.google.com%2F" class="px-3 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 rounded-full font-medium transition-colors">Google</a>
            </div>
        </div>

        <!-- Cookie Jar Table -->
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div class="flex justify-between items-center">
                <div>
                    <h3 class="font-bold text-slate-900 text-sm">کوکی‌های ذخیره شده در نشست جاری (Cookie Jar)</h3>
                    <p class="text-xs text-slate-500">این کوکی‌ها به طور خودکار به همراه درخواست‌ها به سرورهای مقصد ارسال می‌شوند.</p>
                </div>
                <?php if (!empty($allCookies)): ?>
                    <a href="index.php?action=clear_cookies" class="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold">
                        پاک کردن همه
                    </a>
                <?php endif; ?>
            </div>

            <div class="border border-slate-200 rounded-xl overflow-hidden">
                <table class="w-full text-left text-xs font-mono">
                    <thead class="bg-slate-50 text-slate-600 border-b border-slate-200">
                        <tr>
                            <th class="p-2.5">دامنه (Domain)</th>
                            <th class="p-2.5">کلید (Key)</th>
                            <th class="p-2.5">مسیر (Path)</th>
                            <th class="p-2.5">امنیت</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                        <?php if (empty($allCookies)): ?>
                            <tr>
                                <td colspan="4" class="p-4 text-center text-slate-400 font-sans">
                                    هنوز کوکی در این جلسه ثبت نشده است. با وب‌گردی، کوکی‌ها به صورت زنده ذخیره می‌شوند.
                                </td>
                            </tr>
                        <?php else: ?>
                            <?php foreach ($allCookies as $c): ?>
                                <tr class="hover:bg-slate-50">
                                    <td class="p-2.5 text-indigo-600 font-semibold"><?php echo htmlspecialchars($c['domain']); ?></td>
                                    <td class="p-2.5 text-slate-800"><?php echo htmlspecialchars($c['key']); ?></td>
                                    <td class="p-2.5 text-slate-500"><?php echo htmlspecialchars($c['path']); ?></td>
                                    <td class="p-2.5 text-slate-500">
                                        <?php if ($c['secure']): ?><span class="px-1 bg-emerald-50 text-emerald-700 rounded text-[10px]">Secure</span><?php endif; ?>
                                        <?php if ($c['httpOnly']): ?><span class="px-1 bg-amber-50 text-amber-700 rounded text-[10px]">HttpOnly</span><?php endif; ?>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        <?php endif; ?>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Features Infobox -->
        <div class="bg-slate-900 text-white rounded-2xl p-6 shadow-sm space-y-3">
            <h3 class="font-bold text-base flex items-center gap-2">
                <span>⚡</span> ویژگی‌های فنی نسخه نوین PHP:
            </h3>
            <ul class="text-xs text-slate-300 space-y-1.5 list-disc pr-4 leading-relaxed">
                <li><strong>قلاب جاوااسکریپت سراسری (Client Hook):</strong> تمام درخواست‌های <code class="text-indigo-300">fetch()</code> و <code class="text-indigo-300">XMLHttpRequest</code> درون صفحات بازنویسی و حل می‌شوند.</li>
                <li><strong>همگام‌سازی زنده کوکی‌ها (Cookie Beacon):</strong> کوکی‌های ایجاد شده با جاوااسکریپت کلاینت خودکار با سشن PHP همگام می‌شوند.</li>
                <li><strong>حذف هدرهای محدودکننده:</strong> حذف <code class="text-indigo-300">Content-Security-Policy</code> و <code class="text-indigo-300">X-Frame-Options</code> جهت نمایش بدون قطعی.</li>
                <li><strong>سازگاری ۱۰۰٪ با انواع هاستینگ:</strong> بدون نیاز به Composer یا Node.js، تنها با آپلود فایل در <code class="text-indigo-300">public_html</code>.</li>
            </ul>
        </div>

    </main>

    <!-- Footer -->
    <footer class="bg-white border-t border-slate-200 py-4 px-6 text-center text-xs text-slate-500">
        NewGlype Standalone PHP Edition • آماده استقرار روی انواع هاست اشتراکی رایگان و پولی
    </footer>

</body>
</html>
