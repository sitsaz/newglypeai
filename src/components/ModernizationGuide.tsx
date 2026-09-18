import React from 'react';
import { 
  AlertTriangle, CheckCircle2, Shield, Code, Cpu, Lock, 
  Layers, ArrowRight, Zap, RefreshCw, Terminal 
} from 'lucide-react';

export const ModernizationGuide: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Hero Explainer Box */}
      <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 text-white rounded-2xl p-6 md:p-8 shadow-lg border border-indigo-950/50">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold mb-3">
            <Cpu className="w-3.5 h-3.5" /> مقایسه معماری و تحلیل ریشه‌ای (Architectural Deep-Dive)
          </div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
            چرا کدهای PHP هفت سال پیش (Glype) دیگر روی وب مدرن کار نمی‌کنند؟
          </h2>
          <p className="text-slate-300 text-sm mt-3 leading-relaxed">
            در سال‌های ۲۰۱۶ تا ۲۰۱۸، اکثر وبسایت‌ها با رویکرد سنتی HTML چند صفحه‌ای (Multi-Page Apps) و ارسال فرم‌های کلاسیک (<code className="text-indigo-300">&lt;form action&gt;</code>) کار می‌کردند. امروزه وبسایت‌های مدرن (نظیر Google, YouTube, Twitter/X, Next.js, React) به کلی متحول شده‌اند.
          </p>
        </div>
      </div>

      {/* Grid of the 4 Major Breakages and How NewGlype Solved Them */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Google Login & Button Inoperability */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-200">
                <AlertTriangle className="w-5 h-5" />
              </span>
              <span className="text-xs font-mono text-rose-600 font-semibold bg-rose-50 px-2.5 py-0.5 rounded-full">
                مشکل دکمه‌های لاگین گوگل
              </span>
            </div>
            <h3 className="font-bold text-slate-900 text-base">
              ۱. چرا دکمه‌های گوگل و فرم‌های مدرن کار نمی‌کنند؟
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              در اسکریپت قدیمی Glype، فقط تگ‌های <code className="bg-slate-100 px-1 py-0.5 rounded">&lt;a href&gt;</code> و <code className="bg-slate-100 px-1 py-0.5 rounded">&lt;form action&gt;</code> در سرور بازنویسی می‌شدند. 
              اما در صفحه لاگین گوگل، دکمه «Next» یا «Sign in» یک فرم ساده نیست؛ بلکه با کلیک دکمه، کدهای جاوااسکریپت دستور <code className="bg-indigo-50 text-indigo-700 px-1 rounded font-mono">window.fetch('/_/signin/...')</code> یا <code className="bg-indigo-50 text-indigo-700 px-1 rounded font-mono">new XMLHttpRequest()</code> را به صورت پویا اجرا می‌کنند.
            </p>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 space-y-1">
              <span className="font-semibold text-rose-600 block">در گذشته:</span>
              مرورگر درخواست را به آدرس سرور پروکسی شما می‌فرستاد (مثلاً <code className="text-slate-500">localhost:3000/_/signin</code>) که با خطای 404 مواجه شده و دکمه هیچ عکس‌العملی نشان نمی‌داد!
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 bg-emerald-50/50 -mx-6 -mb-6 p-4 rounded-b-2xl border-t-emerald-100">
            <span className="font-semibold text-emerald-800 text-xs flex items-center gap-1.5 mb-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> راهکار مدرن NewGlype:
            </span>
            <p className="text-xs text-emerald-700 leading-relaxed">
              تزریق خودکار اسکریپت رهگیر سراسری (<code className="font-mono">proxyHook.ts</code>) که توابع <code className="font-mono">window.fetch</code> و <code className="font-mono">XMLHttpRequest.prototype.open</code> را شنود کرده و تمام درخواست‌های کلاینت را در لحظه به سمت درگاه پروکسی هدایت می‌کند.
            </p>
          </div>
        </div>

        {/* Card 2: Cookie Jar & SameSite/HttpOnly */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
                <Lock className="w-5 h-5" />
              </span>
              <span className="text-xs font-mono text-amber-600 font-semibold bg-amber-50 px-2.5 py-0.5 rounded-full">
                مشکل کوکی‌ها و نشست‌ها
              </span>
            </div>
            <h3 className="font-bold text-slate-900 text-base">
              ۲. چرا نشست‌ها و کوکی‌ها منقضی یا گم می‌شدند؟
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              اسکریپت Glype کوکی‌ها را در آرایه ساده PHP ذخیره می‌کرد و ویژگی‌های دامنه‌های فرعی (Subdomains)، مسیر (Path)، و استانداردهای جدید مانند <code className="bg-slate-100 px-1 py-0.5 rounded">SameSite=None/Lax</code> و <code className="bg-slate-100 px-1 py-0.5 rounded">Partitioned Cookies</code> را پشتیبانی نمی‌کرد. علاوه بر این، کوکی‌هایی که با دستور جاوااسکریپت <code className="bg-slate-100 px-1 py-0.5 rounded">document.cookie = "..."</code> ایجاد می‌شدند به سرور پروکسی نمی‌رسیدند.
            </p>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 space-y-1">
              <span className="font-semibold text-amber-600 block">در گذشته:</span>
              سایت‌هایی نظیر گوگل که از چندین زیردامنه (accounts.google.com, myaccount.google.com, mail.google.com) استفاده می‌کنند، کوکی یکدیگر را دریافت نمی‌کردند و کاربر بلافاصله Logout می‌شد.
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 bg-emerald-50/50 -mx-6 -mb-6 p-4 rounded-b-2xl border-t-emerald-100">
            <span className="font-semibold text-emerald-800 text-xs flex items-center gap-1.5 mb-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> راهکار مدرن NewGlype:
            </span>
            <p className="text-xs text-emerald-700 leading-relaxed">
              پیاده‌سازی کامل استاندارد RFC 6265 با موتور CookieJar سرور و پل زنده مجازی با <code className="font-mono">navigator.sendBeacon</code> جهت همگام‌سازی بلافاصله تغییرات <code className="font-mono">document.cookie</code> کلاینت با سرور.
            </p>
          </div>
        </div>

        {/* Card 3: CSP & X-Frame-Options */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
                <Shield className="w-5 h-5" />
              </span>
              <span className="text-xs font-mono text-blue-600 font-semibold bg-blue-50 px-2.5 py-0.5 rounded-full">
                امنیت مرورگر (CSP & Framing)
              </span>
            </div>
            <h3 className="font-bold text-slate-900 text-base">
              ۳. مسدودسازی فریم و اسکریپت توسط مرورگرهای مدرن
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              امروزه وبسایت‌ها از هدرهای سخت‌گیرانه‌ای مانند <code className="bg-slate-100 px-1 py-0.5 rounded">Content-Security-Policy</code>، <code className="bg-slate-100 px-1 py-0.5 rounded">X-Frame-Options: DENY</code> و <code className="bg-slate-100 px-1 py-0.5 rounded">Cross-Origin-Opener-Policy</code> استفاده می‌کنند تا از لود شدن درون پروکسی یا فریم جلوگیری کنند.
            </p>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 space-y-1">
              <span className="font-semibold text-blue-600 block">در گذشته:</span>
              مرورگر صفحه را سفید نمایش داده و در کنسول خطای "Refused to display in a frame because it set X-Frame-Options" درج می‌کرد.
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 bg-emerald-50/50 -mx-6 -mb-6 p-4 rounded-b-2xl border-t-emerald-100">
            <span className="font-semibold text-emerald-800 text-xs flex items-center gap-1.5 mb-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> راهکار مدرن NewGlype:
            </span>
            <p className="text-xs text-emerald-700 leading-relaxed">
              فیلترسازی و حذف پویای هدرهای بازدارنده فریم و جایگزینی با هدرهای <code className="font-mono">Access-Control-Allow-Origin: *</code> به همراه پاکسازی تگ‌های متا در سند HTML.
            </p>
          </div>
        </div>

        {/* Card 4: Modern Anti-Bot & Fingerprinting */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-xl bg-purple-50 text-purple-600 border border-purple-200">
                <Terminal className="w-5 h-5" />
              </span>
              <span className="text-xs font-mono text-purple-600 font-semibold bg-purple-50 px-2.5 py-0.5 rounded-full">
                سیستم‌های ضد ربات و Cloudflare
              </span>
            </div>
            <h3 className="font-bold text-slate-900 text-base">
              ۴. حفاظت‌های اختصاصی گوگل و Cloudflare
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              گوگل برای لاگین یک گارد اختصاصی به نام "This browser or app may not be secure" دارد که امضای TLS و User-Agent را می‌سنجد. همچنین وبسایت‌های مدرن از Client Hints مانند <code className="bg-slate-100 px-1 py-0.5 rounded">Sec-Ch-Ua</code> و آزمون‌های WebAuthn / Passkey استفاده می‌کنند.
            </p>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 space-y-1">
              <span className="font-semibold text-purple-600 block">نکته مهم امنیتی:</span>
              سیستم‌های احراز هویت دوعاملی سخت‌افزاری (Passkeys/FIDO2) به دلایل امنیتی در تمام پروکسی‌های وب با محدودیت مواجهند؛ اما برای وب‌گردی و رندر کامل محتوا، هدرهای استاندارد Chrome 130 و Windows 11 شبیه‌سازی شده است.
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 bg-emerald-50/50 -mx-6 -mb-6 p-4 rounded-b-2xl border-t-emerald-100">
            <span className="font-semibold text-emerald-800 text-xs flex items-center gap-1.5 mb-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> راهکار مدرن NewGlype:
            </span>
            <p className="text-xs text-emerald-700 leading-relaxed">
              ارسال هدرهای کامل Client Hints و ساختار باینری معتبر به همراه User-Agent به‌روز و بازنویسی مسیرهای SPA با History API.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
