import React from 'react';
import { 
  Download, Package, Globe, Sparkles, 
  Settings, Copy, Check, FileCode, ShieldCheck, 
  EyeOff, Lock, Layout, Zap, Layers
} from 'lucide-react';

export const WordPressPluginGuide: React.FC = () => {
  const [copied, setCopied] = React.useState(false);

  const copyShortcode = () => {
    navigator.clipboard.writeText('[cloud_portal]');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Hero Download Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white rounded-2xl p-6 md:p-8 shadow-xl border border-blue-500/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" /> حالت نامحسوس (Stealth Architecture) + امکانات اصیل Glype
          </div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">
            افزونه اختصاصی پرتال مرورگر و نمایشگر وب (Cloud Portal) برای وردپرس
          </h2>
          <p className="text-slate-300 text-xs leading-relaxed">
            این افزونه با معماری کاملاً <strong>نامحسوس (Stealth)</strong> توسعه یافته است؛ تمامی ردهای پروکسی، کلمات نشانه‌دار و هدرهای تابلو حذف شده و آدرس‌ها به صورت دوطرفه رمزنگاری می‌شوند. به محض فعال‌سازی، برگه اختصاصی با نشانی تمیز <code className="text-blue-300 font-mono">yoursite.com/portal/</code> ایجاد شده و شورت‌کد اختصاصی <code className="text-blue-300 font-mono">[cloud_portal]</code> برای استفاده در المنتور و گوتنبرگ فعال می‌گردد.
          </p>
        </div>

        <div className="flex flex-col gap-2 shrink-0 w-full sm:w-auto">
          <a
            href="/api/download-wp-plugin"
            download="cloud-portal-wp.zip"
            className="px-6 py-3.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 transition-all cursor-pointer border border-blue-300/30"
            title="دانلود نسخه استاندارد وردپرس"
          >
            <Download className="w-4 h-4 text-white" />
            <span>دانلود افزونه وردپرس (cloud-portal-wp.zip)</span>
          </a>
          <span className="text-[11px] text-slate-400 text-center">پکیج استاندارد آماده آپلود در پیشخوان</span>
        </div>
      </div>

      {/* Advanced Glype Feature Parity Badges */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white shadow-sm">
        <h3 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" />
          قابلیت‌های پیاده‌سازی شده در این نسخه (برابری کامل با نسخه اصلی Glype):
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
            <Lock className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-100 block">رمزگذاری دوطرفه آدرس (Encode URL)</span>
              <span className="text-slate-400 text-[11px]">آدرس‌های مقصد به شکل هش ایمن تغییر یافته و در هیستوری و لاگ سرور دیده نمی‌شوند.</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
            <Layout className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-100 block">نوار ابزار شناور بالا (Glype Toolbar)</span>
              <span className="text-slate-400 text-[11px]">امکان ورود مستقیم آدرس جدید، دکمه Home و کلید کوچک‌سازی نوار بدون بستن سایت.</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
            <EyeOff className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-100 block">مخفی‌سازی عنوان تب (Strip Title)</span>
              <span className="text-slate-400 text-[11px]">حذف یا جعل عنوان صفحات در تب مرورگر جهت جلوگیری از لو رفتن نام سایت مقصد.</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-100 block">خنثی‌سازی ضد فریم (Frame-Buster)</span>
              <span className="text-slate-400 text-[11px]">شکستن اسکریپت‌های خروج از فریم و پرش پنجره سایت‌های خارجی (مانند گوگل یا توییتر).</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
            <Layers className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-100 block">بازنویسی هوشمند تصاویر (srcset)</span>
              <span className="text-slate-400 text-[11px]">پشتیبانی کامل از تگ‌های رسانه‌ای واکنش‌گرا مدرن مانند srcset و picture و فونت‌های وب.</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
            <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-100 block">کوکی‌های موقت (Temp Cookies)</span>
              <span className="text-slate-400 text-[11px]">قابلیت حذف خودکار کوکی‌ها بلافاصله پس از بستن نشست مرورگر بدون باقی ماندن در دیسک.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Globe className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">پیوند یکتای تمیز و نامحسوس</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            برگه پرتال با آدرس کاملاً خنثی <code className="text-blue-600 font-mono">yoursite.com/portal/</code> منتشر می‌شود و در نشانی‌ها هیچ اثری از عبارت‌های مشخص‌کننده وجود ندارد.
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <FileCode className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">شورت‌کد سازگار با المنتور</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            می‌توانید با قرار دادن شورت‌کد <code className="text-indigo-600 font-mono">[cloud_portal]</code>، ویجت ورود به پرتال را در هر کجای قالب سایت به دلخواه قرار دهید.
          </p>
          <button 
            onClick={copyShortcode}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-mono font-medium transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'کپی شد!' : 'کپی شورت‌کد [cloud_portal]'}</span>
          </button>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">کوکی‌جار پیشرفته RFC 6265</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            کوکی‌های نشست کاربران در دیتابیس/سشن وردپرس نگهداری شده و قلاب جاوااسکریپت، ارتباط دکمه‌های پویا و لاگین‌ها را برقرار می‌سازد.
          </p>
        </div>
      </div>

      {/* Step by Step Install Guide */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            مراحل نصب و فعال‌سازی در ۳ گام ساده
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            بدون نیاز به ویرایش کدها یا افزونه جانبی، سیستم را در وردپرس مستقر نمایید:
          </p>
        </div>

        <div className="space-y-4 text-xs">
          <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold shrink-0 text-sm">
              ۱
            </div>
            <div className="space-y-1">
              <span className="font-bold text-slate-800 text-sm block">دانلود پکیج افزونه:</span>
              <p className="text-slate-600">
                روی دکمه آبی رنگ <strong>«دانلود افزونه وردپرس (cloud-portal-wp.zip)»</strong> در بالای صفحه کلیک کنید.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold shrink-0 text-sm">
              ۲
            </div>
            <div className="space-y-1">
              <span className="font-bold text-slate-800 text-sm block">بارگذاری در پیشخوان وردپرس:</span>
              <p className="text-slate-600 leading-relaxed">
                وارد مدیریت وردپرس سایت خود شوید. از منوی اصلی به مسیر <strong>افزونه‌ها &larr; افزودن افزونه</strong> رفته و در بالای صفحه دکمه <strong>«بارگذاری افزونه»</strong> را بزنید. فایل <code className="bg-slate-200 px-1.5 py-0.5 rounded font-mono text-slate-800">cloud-portal-wp.zip</code> را انتخاب کرده و دکمه <strong>«نصب»</strong> را بزنید.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold shrink-0 text-sm">
              ۳
            </div>
            <div className="space-y-1">
              <span className="font-bold text-slate-800 text-sm block">فعال‌سازی خودکار برگه:</span>
              <p className="text-slate-600 leading-relaxed">
                روی دکمه <strong>«فعال‌سازی افزونه»</strong> کلیک کنید. برگه اختصاصی پرتال به طور خودکار در نشانی <code className="bg-slate-200 px-1.5 py-0.5 rounded font-mono text-slate-800">yoursite.com/portal/</code> منتشر شده و آماده استفاده خواهد بود.
              </p>
            </div>
          </div>
        </div>

        {/* Admin Menu Notice */}
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs space-y-1">
          <span className="font-bold flex items-center gap-1.5 text-blue-800">
            <Settings className="w-4 h-4" /> تنظیمات در پیشخوان وردپرس:
          </span>
          <p className="leading-relaxed text-blue-800/90">
            یک گزینه با نام <strong>«پرتال مرورگر ابری»</strong> با آیکون ابر در منوی پیشخوان اضافه می‌شود که امکان تغییر گزینه‌های پیش‌فرض Glype (مانند فعال/غیرفعال‌سازی نوار ابزار بالا، کدگذاری آدرس‌ها و عدم لود تصاویر) را در اختیارتان می‌گذارد.
          </p>
        </div>
      </div>
    </div>
  );
};
