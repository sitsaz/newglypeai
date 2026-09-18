import React from 'react';
import { 
  Download, Package, CheckCircle2, Globe, Sparkles, 
  Settings, Copy, Check, FileCode, Layers, ShieldCheck, 
  ExternalLink 
} from 'lucide-react';

export const WordPressPluginGuide: React.FC = () => {
  const [copied, setCopied] = React.useState(false);

  const copyShortcode = () => {
    navigator.clipboard.writeText('[newglype_proxy]');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Hero Download Card */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 md:p-8 shadow-xl border border-blue-500/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-semibold">
            <Package className="w-3.5 h-3.5" /> افزونه آماده نصب وردپرس (WordPress Plugin 1.0.0)
          </div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">
            افزونه اختصاصی وب پروکسی NewGlype برای وردپرس
          </h2>
          <p className="text-slate-300 text-xs leading-relaxed">
            پروژه شما به صورت یک افزونه استاندارد و کامل وردپرس با ساختار رسمی پکیج‌بندی شد. این افزونه به محض فعال‌سازی، به صورت خودکار یک <strong>برگه اختصاصی (Dedicated Page)</strong> در آدرس <code className="text-blue-300 font-mono">/web-proxy/</code> ایجاد می‌کند و دارای شورت‌کد اختصاصی <code className="text-blue-300 font-mono">[newglype_proxy]</code> برای استفاده در المنتور، گوتنبرگ و سایر قالب‌هاست.
          </p>
        </div>

        <a
          href="/api/download-wp-plugin"
          download="newglype-proxy.zip"
          className="px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white font-bold rounded-xl text-sm flex items-center gap-2.5 shadow-lg shadow-blue-500/30 transition-all cursor-pointer shrink-0 border border-blue-300/30"
        >
          <Download className="w-5 h-5 text-white" />
          <span>دانلود افزونه وردپرس (newglype-proxy.zip)</span>
        </a>
      </div>

      {/* Feature Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Globe className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">ایجاد خودکار برگه در سایت</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            با فعال‌سازی افزونه در وردپرس، برگه اختصاصی با پیوند یکتای <code className="text-indigo-600 font-mono">yoursite.com/web-proxy/</code> خودکار منتشر شده و در منوی سایت قابل دسترس است.
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <FileCode className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">شورت‌کد سازگار با المنتور</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            می‌توانید با استفاده از شورت‌کد <code className="text-indigo-600 font-mono">[newglype_proxy]</code>، فرم پروکسی را درون هر برگه، نوشته یا سایدبار دلخواه قرار دهید.
          </p>
          <button 
            onClick={copyShortcode}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-mono font-medium transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'کپی شد!' : 'کپی شورت‌کد [newglype_proxy]'}</span>
          </button>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">موتور نوین با قلاب کلاینت</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            درخواست‌های سایت مقصد درون هوک‌های وردپرس رندر شده و کدهای جاوااسکریپت، کوکی‌های نشست و هدرهای امنیتی به صورت خودکار بازنویسی می‌شوند.
          </p>
        </div>
      </div>

      {/* Step by Step Install Guide */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            راهنمای گام‌به‌گام نصب افزونه در پیشخوان وردپرس
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            تنها در چند کلیک می‌توانید افزونه را در وردپرس نصب کرده و صفحه پروکسی را به سایت خود اضافه کنید:
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
                روی دکمه آبی رنگ <strong>«دانلود افزونه وردپرس (newglype-proxy.zip)»</strong> در بالای همین بخش کلیک کنید تا فایل فشرده دانلود شود.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold shrink-0 text-sm">
              ۲
            </div>
            <div className="space-y-1">
              <span className="font-bold text-slate-800 text-sm block">آپلود در پیشخوان وردپرس:</span>
              <p className="text-slate-600 leading-relaxed">
                وارد پیشخوان مدیریت وردپرس سایت خود شوید. از منوی سمت راست به مسیر <strong>افزونه‌ها &larr; افزودن افزونه</strong> رفته و در بالای صفحه روی دکمه <strong>«بارگذاری افزونه»</strong> کلیک کنید. سپس فایل <code className="bg-slate-200 px-1.5 py-0.5 rounded font-mono text-slate-800">newglype-proxy.zip</code> را انتخاب کرده و دکمه <strong>«نصب»</strong> را بزنید.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold shrink-0 text-sm">
              ۳
            </div>
            <div className="space-y-1">
              <span className="font-bold text-slate-800 text-sm block">فعال‌سازی و مشاهده صفحه پروکسی:</span>
              <p className="text-slate-600 leading-relaxed">
                روی دکمه <strong>«فعال‌سازی افزونه»</strong> کلیک کنید. یک برگه جدید با نام <strong>«وب پروکسی NewGlype»</strong> در سایت شما ایجاد می‌شود که می‌توانید آدرس آن را (مثلاً <code className="bg-slate-200 px-1.5 py-0.5 rounded font-mono text-slate-800">yoursite.com/web-proxy/</code>) باز کنید یا به منوی سایت خود اضافه فرمایید.
              </p>
            </div>
          </div>
        </div>

        {/* Admin Menu Notice */}
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs space-y-1">
          <span className="font-bold flex items-center gap-1.5 text-blue-800">
            <Settings className="w-4 h-4" /> منوی اختصاصی در پیشخوان وردپرس:
          </span>
          <p className="leading-relaxed text-blue-800/90">
            پس از فعال‌سازی، یک گزینه جدید به نام <strong>«پروکسی NewGlype»</strong> با آیکون سپر در منوی اصلی پیشخوان وردپرس اضافه می‌شود که امکان تغییر تنظیمات پیش‌فرض، حذف اسکریپت‌ها یا تصاویر و مشاهده لینک مستقیم صفحه پروکسی را به شما می‌دهد.
          </p>
        </div>
      </div>
    </div>
  );
};
