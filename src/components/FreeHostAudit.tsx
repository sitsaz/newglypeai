import React, { useState, useEffect } from 'react';
import { 
  Server, ShieldAlert, CheckCircle2, AlertTriangle, Cpu, 
  HardDrive, Clock, ExternalLink, RefreshCw, Zap, ShieldCheck,
  Download, Package, FileCode
} from 'lucide-react';

interface AuditData {
  status: string;
  runtime: {
    nodeVersion: string;
    platform: string;
    arch: string;
    uptimeSeconds: number;
  };
  memory: {
    heapUsedMb: string;
    heapTotalMb: string;
    rssMb: string;
    externalMb: string;
  };
  guards: {
    ssrfProtection: boolean;
    maxBufferLimitMb: number;
    requestTimeoutSeconds: number;
    cookieJarType: string;
  };
  freeHostingAdvice: {
    nodePlatforms: string[];
    cpanelWarning: string;
  };
}

export const FreeHostAudit: React.FC = () => {
  const [auditData, setAuditData] = useState<AuditData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAudit = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/host-audit');
      if (res.ok) {
        const data = await res.json();
        setAuditData(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAudit();
  }, []);

  return (
    <div className="space-y-6">
      {/* Direct Download ZIP Card for Traditional PHP Host */}
      <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-indigo-950 text-white rounded-2xl p-6 md:p-8 shadow-lg border border-emerald-500/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
            <Package className="w-3.5 h-3.5" /> پکیج آماده نصب و خودکفای PHP (Standalone Bundle)
          </div>
          <h3 className="text-xl md:text-2xl font-bold tracking-tight">
            دانلود فایل ZIP جهت انتقال مستقیم به هاست سنتی PHP
          </h3>
          <p className="text-slate-300 text-xs leading-relaxed">
            این فایل zip شامل تمام کدهای نوین بازنویسی‌شده برای PHP (شامل <code className="text-emerald-300 font-mono">index.php</code>، <code className="text-emerald-300 font-mono">proxy.php</code>، قلاب جاوااسکریپت <code className="text-emerald-300 font-mono">proxyHook.js</code>، سیستم کوکی RFC 6265 و <code className="text-emerald-300 font-mono">.htaccess</code>) است. بدون نیاز به Composer یا Node.js، تنها با آپلود و Extract در <code className="text-emerald-300 font-mono">public_html</code> هاست شما آماده کار است.
          </p>
        </div>

        <a
          href="/releases/cloud-portal-php-v2.1.0.zip"
          download="cloud-portal-php-v2.1.0.zip"
          className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/30 transition-all cursor-pointer shrink-0"
        >
          <Download className="w-5 h-5 text-slate-950" />
          <span>دانلود بسته مستقل PHP (v2.1.0)</span>
        </a>
      </div>

      {/* Overview Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-200">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                بررسی تخصصی و سلامت‌سنجی هاست رایگان (Free Hosting Audit)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              بررسی محدودیت‌های رم، پردازنده، خطر مسدودسازی اکانت (Suspension)، و سازگاری معماری جدید.
            </p>
          </div>

          <button
            onClick={fetchAudit}
            disabled={isLoading}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>سنجش زنده منابع (Live Audit)</span>
          </button>
        </div>

        {/* Live Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
            <span className="text-[11px] font-semibold text-slate-500 uppercase block">مصرف حافظه (RAM)</span>
            <span className="text-2xl font-bold font-mono text-slate-800 mt-1 block">
              {auditData ? `${auditData.memory.heapUsedMb} MB` : '...'}
            </span>
            <span className="text-[10px] text-emerald-600 font-medium">بسیار سبک (حد مجاز 512MB)</span>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
            <span className="text-[11px] font-semibold text-slate-500 uppercase block">حفاظت SSRF</span>
            <span className="text-2xl font-bold text-emerald-600 mt-1 block flex items-center gap-1">
              فعال <CheckCircle2 className="w-5 h-5" />
            </span>
            <span className="text-[10px] text-slate-500">جلوگیری از بلاک شدن IP هاست</span>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
            <span className="text-[11px] font-semibold text-slate-500 uppercase block">سقف بافر دانلود</span>
            <span className="text-2xl font-bold font-mono text-slate-800 mt-1 block">
              {auditData ? `${auditData.guards.maxBufferLimitMb} MB` : '15 MB'}
            </span>
            <span className="text-[10px] text-slate-500">جلوگیری از کرش حافظه (OOM)</span>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
            <span className="text-[11px] font-semibold text-slate-500 uppercase block">تایم‌اوت ایمن</span>
            <span className="text-2xl font-bold font-mono text-slate-800 mt-1 block">
              {auditData ? `${auditData.guards.requestTimeoutSeconds}s` : '12s'}
            </span>
            <span className="text-[10px] text-slate-500">آزادسازی خودکار Worker ها</span>
          </div>
        </div>
      </div>

      {/* Critical Free-Hosting Comparison Warning */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-amber-100 text-amber-800 rounded-xl shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-amber-900 text-base">
              نکته بسیار مهم درباره «هاست رایگان»: تفاوت هاست اشتراکی cPanel با هاست ابری Node.js
            </h3>
            <p className="text-xs text-amber-800 mt-1.5 leading-relaxed">
              اگر منظور شما از هاست رایگان، هاست‌های اشتراکی رایگان سنتی (نظیر <strong>InfinityFree، 000webhost، ProFreeHost، ByetHost</strong>) است، لطفاً به موارد زیر توجه فرمایید:
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-amber-900 pt-2">
          <div className="p-4 bg-white/70 rounded-xl border border-amber-200/70 space-y-2">
            <span className="font-bold flex items-center gap-1.5 text-rose-700">
              ⛔ خطرات هاست‌های رایگان اشتراکی PHP (مثل InfinityFree):
            </span>
            <ul className="list-disc pr-4 space-y-1 text-slate-700 leading-relaxed">
              <li><strong>ممنوعیت در قوانین (ToS):</strong> تقریباً تمام هاست‌های رایگان PHP در قوانین خود راه‌اندازی پروکسی (Proxy scripts) را صراحتاً ممنوع کرده‌اند و ربات‌های آنها به محض مشاهده ترافیک cURL حساب را <strong>Suspend (مسدود دائم)</strong> می‌کنند.</li>
              <li><strong>محدودیت توابع شبکه:</strong> هاست‌های رایگان معمولاً خروجی سوکت و پورت‌های cURL را می‌بندند.</li>
              <li><strong>عدم پشتیبانی از Node.js:</strong> هسته نوین این پروژه که مشکل وبسایت‌های مدرن و گوگل را حل می‌کند، بر پایه Node.js/TypeScript است و روی هاست‌های ساده PHP اجرا نمی‌شود.</li>
            </ul>
          </div>

          <div className="p-4 bg-white/70 rounded-xl border border-emerald-200/70 space-y-2">
            <span className="font-bold flex items-center gap-1.5 text-emerald-800">
              ✅ راهکار اصولی: استفاده از هاست‌های رایگان مدرن (Cloud/Node.js):
            </span>
            <p className="text-slate-700 leading-relaxed">
              برای میزبانی رایگان و دائمی این پروژه نوین، پلتفرم‌های ابری رایگان زیر را توصیه می‌کنیم که کاملاً سازگار با Node.js بوده و حساب شما را به خاطر وب پروکسی شخصی مسدود نمی‌کنند:
            </p>
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200">
                <span className="font-semibold">Render.com</span>
                <span className="text-[11px] text-emerald-700">سرویس رایگان وب با اتصال مستقیم به گیت‌هاب</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200">
                <span className="font-semibold">Koyeb.com</span>
                <span className="text-[11px] text-emerald-700">میکرو ماشین ابری رایگان (512MB RAM)</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200">
                <span className="font-semibold">Railway / Glitch / Fly.io</span>
                <span className="text-[11px] text-emerald-700">پلتفرم‌های هاستینگ کانتینری و Node</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Optimizations applied to protect Free Hosting */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
          <Zap className="w-4 h-4 text-indigo-600" />
          تدابیر امنیتی و بهینه‌سازی‌های انجام شده برای عملکرد پایدار روی هاست رایگان:
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5">
            <span className="font-bold text-slate-800 block">۱. سپر ضد SSRF و محافظت از IP:</span>
            <p className="text-slate-600 leading-relaxed">
              آدرس‌های محلی (`localhost`, `127.0.0.1`, `169.254.169.254`) فیلتر می‌شوند تا از اسکن پورت‌ها توسط کاربران مخرب و مسدود شدن IP سرور شما جلوگیری شود.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5">
            <span className="font-bold text-slate-800 block">۲. کنترل سقف مصرف رم (Heap Protection):</span>
            <p className="text-slate-600 leading-relaxed">
              حداکثر سقف مجاز دریافت بارهای سنگین به ۱۵ مگابایت محدود شده تا هیچ‌وقت خطای `JavaScript heap out of memory` در هاست‌های کم‌ظرفیت (مانند پلن‌های ۲۵۶ و ۵۱۲ مگابایت) رخ ندهد.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5">
            <span className="font-bold text-slate-800 block">۳. تایم‌اوت هوشمند ۱۲ ثانیه‌ای:</span>
            <p className="text-slate-600 leading-relaxed">
              اتصال‌های کند که ممکن است ترد‌های سرور را ساعت‌ها معطل کنند، پس از ۱۲ ثانیه خودکار قطع می‌شوند تا منابع پردازشی آزاد مانده و با خطای CPU Limit Exceeded روبرو نشوید.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
