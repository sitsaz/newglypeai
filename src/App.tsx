import React, { useState, useEffect } from 'react';
import { 
  Globe, Shield, Cookie, Activity, Settings, Cpu, BookOpen, 
  ExternalLink, CheckCircle2, RotateCw, Sparkles, Layers, 
  HelpCircle, Server, Download, Package
} from 'lucide-react';
import { Stats, PluginItem, ProxyConfig } from './types';
import { BrowserViewport } from './components/BrowserViewport';
import { CookieManager } from './components/CookieManager';
import { NetworkInspector } from './components/NetworkInspector';
import { ModernizationGuide } from './components/ModernizationGuide';
import { SettingsPanel } from './components/SettingsPanel';
import { FreeHostAudit } from './components/FreeHostAudit';
import { WordPressPluginGuide } from './components/WordPressPluginGuide';
import { ReleasesManager } from './components/ReleasesManager';

export default function App() {
  const [activeTab, setActiveTab] = useState<'browser' | 'cookies' | 'network' | 'guide' | 'settings' | 'plugins' | 'host-audit' | 'wordpress' | 'releases'>('browser');
  const [stats, setStats] = useState<Stats>({
    totalRequests: 0,
    rewrittenLinks: 0,
    blockedSecurityHeaders: 0,
    activeCookies: 0,
  });
  const [plugins, setPlugins] = useState<PluginItem[]>([]);

  const [config, setConfig] = useState<ProxyConfig>({
    removeScripts: false,
    removeImages: false,
    stripTitle: false,
    showToolbar: true,
    encodeURL: true,
    tempCookies: false,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
    stripSecurityHeaders: true,
    injectHook: true,
  });

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchPlugins = async () => {
    try {
      const res = await fetch('/api/plugins');
      if (res.ok) {
        const data = await res.json();
        setPlugins(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchPlugins();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-800 font-sans" dir="rtl">
      {/* Top Navbar */}
      <header className="bg-slate-900 text-white shadow-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-3.5 flex flex-col md:flex-row justify-between items-center gap-4">
          {/* Logo & Brand Info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-600/30 text-white">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-bold tracking-tight text-white">
                  Cloud Portal (مدرن‌سازی کامل Glype)
                </h1>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  معماری نامحسوس (Stealth)
                </span>
                <button
                  onClick={() => setActiveTab('releases')}
                  className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition-all flex items-center gap-1 cursor-pointer"
                  title="مشاهده تاریخچه نسخه‌ها و آرشیو فایل‌های ZIP"
                >
                  <Package className="w-3 h-3" />
                  <span>نسخه v2.1.0</span>
                </button>
                <a
                  href="/releases/cloud-portal-php-v2.1.0.zip"
                  download="cloud-portal-php-v2.1.0.zip"
                  className="px-3 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer border border-emerald-400/30"
                  title="دانلود فایل zip آماده آپلود روی هاست اشتراکی رایگان PHP (v2.1.0)"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>دانلود PHP v2.1.0 (ZIP)</span>
                </a>
                <a
                  href="/releases/cloud-portal-wp-v2.1.0.zip"
                  download="cloud-portal-wp-v2.1.0.zip"
                  className="px-3 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer border border-blue-400/30"
                  title="دانلود افزونه اختصاصی وردپرس (v2.1.0)"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>دانلود افزونه وردپرس v2.1.0</span>
                </a>
              </div>
              <p className="text-xs text-slate-400">
                پرتال نمایشگر صفحات وب با استتار کامل، کدگذاری آدرس‌ها، نوار ابزار Glype و کوکی‌جار RFC 6265
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('browser')}
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'browser'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Globe className="w-3.5 h-3.5" /> مرورگر زنده (Browser)
            </button>

            <button
              onClick={() => setActiveTab('cookies')}
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'cookies'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Cookie className="w-3.5 h-3.5" /> کوکی‌ها ({stats.activeCookies})
            </button>

            <button
              onClick={() => setActiveTab('network')}
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'network'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Activity className="w-3.5 h-3.5" /> لاگ شبکه (Network)
            </button>

            <button
              onClick={() => setActiveTab('guide')}
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'guide'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" /> مقایسه با PHP قدیمی
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Settings className="w-3.5 h-3.5" /> تنظیمات موتور
            </button>

            <button
              onClick={() => setActiveTab('plugins')}
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'plugins'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" /> پلاگین‌ها ({plugins.length})
            </button>

            <button
              onClick={() => setActiveTab('host-audit')}
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'host-audit'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-emerald-400 hover:bg-slate-800 border border-emerald-500/30'
              }`}
            >
              <Server className="w-3.5 h-3.5" /> بررسی هاست رایگان (Host Audit)
            </button>

            <button
              onClick={() => setActiveTab('wordpress')}
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'wordpress'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-blue-400 hover:bg-slate-800 border border-blue-500/30'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" /> افزونه وردپرس (WordPress Plugin)
            </button>

            <button
              onClick={() => setActiveTab('releases')}
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'releases'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-amber-400 hover:bg-slate-800 border border-amber-500/30'
              }`}
            >
              <Package className="w-3.5 h-3.5" /> نسخه‌ها و فایل‌های ZIP (Releases)
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content View */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 flex flex-col">
        {activeTab === 'browser' && (
          <BrowserViewport
            config={config}
            onNavigate={() => fetchStats()}
          />
        )}

        {activeTab === 'cookies' && <CookieManager />}

        {activeTab === 'network' && <NetworkInspector />}

        {activeTab === 'guide' && <ModernizationGuide />}

        {activeTab === 'settings' && (
          <SettingsPanel config={config} onChange={setConfig} />
        )}

        {activeTab === 'host-audit' && <FreeHostAudit />}

        {activeTab === 'wordpress' && <WordPressPluginGuide />}

        {activeTab === 'releases' && <ReleasesManager />}

        {activeTab === 'plugins' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-200">
                  <Layers className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  پلاگین‌ها و قواعد بهینه‌سازی وبسایت‌ها (Plugins)
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                جایگزین مدرن برای فایل‌های PHP قدیمی که در دایرکتوری plugins قرار داشتند. این پلاگین‌ها هدرها، کوکی‌ها و توابع خاص هر سرویس را بهینه‌سازی می‌کنند.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {plugins.map((p, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-indigo-200 transition-all space-y-3"
                >
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-slate-900 text-base">{p.name}</h3>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 flex items-center gap-1 font-mono">
                      <CheckCircle2 className="w-3 h-3" /> {p.status}
                    </span>
                  </div>
                  <p className="text-xs font-mono text-indigo-600">دامنه هدف: {p.domain}</p>
                  <p className="text-xs text-slate-600 leading-relaxed">{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>
            NewGlype Web Proxy Engine • بازطراحی کامل با معماری Node.js, TypeScript و React
          </span>
          <span className="font-mono text-slate-400">
            سازگار با استانداردهای وب ۲۰۲۴-۲۰۲۶ (CSP, CORS, Fetch Interception, RFC 6265)
          </span>
        </div>
      </footer>
    </div>
  );
}
