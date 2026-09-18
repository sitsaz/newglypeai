import React from 'react';
import { Settings, Shield, Cpu, Smartphone, Monitor, CheckCircle2, Sliders, ToggleLeft } from 'lucide-react';
import { ProxyConfig } from '../types';

interface SettingsPanelProps {
  config: ProxyConfig;
  onChange: (newConfig: ProxyConfig) => void;
}

const UA_PRESETS = [
  {
    name: 'Google Chrome 130 (Windows 11)',
    value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  },
  {
    name: 'Apple Safari 18 (macOS Sequoia)',
    value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15',
  },
  {
    name: 'Mozilla Firefox 132 (Linux Ubuntu)',
    value: 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:132.0) Gecko/20100101 Firefox/132.0',
  },
  {
    name: 'Mobile Safari (iPhone iOS 18)',
    value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
  },
  {
    name: 'Google Chrome Mobile (Android 15)',
    value: 'Mozilla/5.0 (Linux; Android 15; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.6723.102 Mobile Safari/537.36',
  },
];

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ config, onChange }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-8 max-w-4xl">
      <div>
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-200">
            <Sliders className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            تنظیمات موتور پروکسی و شبیه‌سازی مرورگر
          </h2>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          پیکربندی رفتار پردازشگر کلاینت و سرور، جعل هویت مرورگر و دور زدن محدودیت‌های امنیتی وب مدرن.
        </p>
      </div>

      {/* Modern Engine Features */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
          <Cpu className="w-4 h-4 text-indigo-600" /> ویژگی‌های هسته مدرن (Modern Core Capabilities)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={config.injectHook}
              onChange={(e) => onChange({ ...config, injectHook: e.target.checked })}
              className="mt-1 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
            />
            <div>
              <span className="font-semibold text-slate-800 text-sm block">
                قلاب هوشمند کلاینت (Universal Fetch/XHR Interceptor)
              </span>
              <p className="text-xs text-slate-500 mt-0.5">
                تمام درخواست‌های <code className="text-indigo-600">window.fetch</code> و <code className="text-indigo-600">XMLHttpRequest</code> صفحه هدف را شناسایی کرده و خودکار از درگاه پروکسی عبور می‌دهد (حل مشکل از کار افتادن دکمه‌های سایت‌ها).
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={config.stripSecurityHeaders}
              onChange={(e) => onChange({ ...config, stripSecurityHeaders: e.target.checked })}
              className="mt-1 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
            />
            <div>
              <span className="font-semibold text-slate-800 text-sm block">
                حذف هدرهای محدودکننده فریم (CSP & X-Frame-Options)
              </span>
              <p className="text-xs text-slate-500 mt-0.5">
                هدرهای امنیتی که مانع لود شدن سایت در فریم می‌شوند را پاکسازی کرده و دسترسی Cross-Origin را مجاز می‌کند.
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={config.encodeURL}
              onChange={(e) => onChange({ ...config, encodeURL: e.target.checked })}
              className="mt-1 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
            />
            <div>
              <span className="font-semibold text-slate-800 text-sm block">
                کدگذاری دوطرفه آدرس (Encode URL)
              </span>
              <p className="text-xs text-slate-500 mt-0.5">
                آدرس سایت مقصد با الگوریتم برگشت‌پذیر مبهم‌سازی شده و از ثبت در تاریخچه مرورگر، کش یا لاگ‌های سرور جلوگیری می‌شود.
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={config.stripTitle}
              onChange={(e) => onChange({ ...config, stripTitle: e.target.checked })}
              className="mt-1 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
            />
            <div>
              <span className="font-semibold text-slate-800 text-sm block">
                پنهان‌سازی عنوان تب (Strip Page Title)
              </span>
              <p className="text-xs text-slate-500 mt-0.5">
                عنوان اصلی سایت را با عبارت عمومی جایگزین می‌کند تا نام سایت مشاهده‌شده در نوار مرورگر و سیستم‌عامل افشا نشود.
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={config.showToolbar}
              onChange={(e) => onChange({ ...config, showToolbar: e.target.checked })}
              className="mt-1 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
            />
            <div>
              <span className="font-semibold text-slate-800 text-sm block">
                نوار ابزار بالای صفحه (Glype Mini Toolbar)
              </span>
              <p className="text-xs text-slate-500 mt-0.5">
                نمایش نوار ابزار شناور در بالای صفحات وب جهت بازگشت سریع به خانه، جستجوی جدید و بستن/کوچک‌سازی منو.
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={config.tempCookies}
              onChange={(e) => onChange({ ...config, tempCookies: e.target.checked })}
              className="mt-1 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
            />
            <div>
              <span className="font-semibold text-slate-800 text-sm block">
                کوکی‌های موقت سشن (Temp Cookies)
              </span>
              <p className="text-xs text-slate-500 mt-0.5">
                کوکی‌ها پس از پایان نشست به طور خودکار پاک می‌شوند و هیچ اطلاعاتی روی دیسک هاست باقی نمی‌ماند.
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={config.removeScripts}
              onChange={(e) => onChange({ ...config, removeScripts: e.target.checked })}
              className="mt-1 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
            />
            <div>
              <span className="font-semibold text-slate-800 text-sm block">
                حالت امن بدون اسکریپت (Remove JavaScript)
              </span>
              <p className="text-xs text-slate-500 mt-0.5">
                تگ‌های <code className="text-slate-600">&lt;script&gt;</code> را حذف می‌کند. مناسب برای مطالعه متون، جلوگیری از تبلیغات مخرب و حداکثر سرعت.
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={config.removeImages}
              onChange={(e) => onChange({ ...config, removeImages: e.target.checked })}
              className="mt-1 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
            />
            <div>
              <span className="font-semibold text-slate-800 text-sm block">
                صرفه‌جویی در پهنای باند (Remove Images)
              </span>
              <p className="text-xs text-slate-500 mt-0.5">
                تصاویر را با متن جایگزین می‌کند تا در شبکه‌های کم‌سرعت با بیشترین شتاب صفحات لود شوند.
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* User-Agent Configuration */}
      <div className="space-y-4 pt-4 border-t border-slate-200">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
          <Monitor className="w-4 h-4 text-indigo-600" /> شناسه مرورگر (User-Agent Spoofing)
        </h3>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              انتخاب الگوی آماده مرورگر:
            </label>
            <select
              value={config.userAgent}
              onChange={(e) => onChange({ ...config, userAgent: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
            >
              {UA_PRESETS.map((p) => (
                <option key={p.name} value={p.value}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              رشته کامل User-Agent ارسالی به وبسایت مقصد:
            </label>
            <input
              type="text"
              value={config.userAgent}
              onChange={(e) => onChange({ ...config, userAgent: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-700 focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
