import React, { useState, useEffect, useRef } from 'react';
import { 
  Globe, ArrowLeft, ArrowRight, RotateCw, Shield, ExternalLink, 
  Monitor, Smartphone, Tablet, Laptop, Lock, AlertCircle, 
  Terminal, Sparkles, CheckCircle2 
} from 'lucide-react';
import { ProxyConfig } from '../types';

interface BrowserViewportProps {
  config: ProxyConfig;
  onNavigate?: (url: string) => void;
}

const PRESET_SITES = [
  { label: 'DuckDuckGo', url: 'https://html.duckduckgo.com/html/' },
  { label: 'Wikipedia', url: 'https://en.m.wikipedia.org/' },
  { label: 'Hacker News', url: 'https://news.ycombinator.com/' },
  { label: 'Google Search', url: 'https://www.google.com/' },
  { label: 'Example Domain', url: 'https://example.com' },
  { label: 'W3Schools', url: 'https://www.w3schools.com/' },
];

export const BrowserViewport: React.FC<BrowserViewportProps> = ({ config, onNavigate }) => {
  const [currentUrl, setCurrentUrl] = useState('https://news.ycombinator.com/');
  const [inputUrl, setInputUrl] = useState('https://news.ycombinator.com/');
  const [activeUrl, setActiveUrl] = useState('https://news.ycombinator.com/');
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState<string | null>(null);
  const [deviceMode, setDeviceMode] = useState<'full' | 'laptop' | 'tablet' | 'mobile'>('full');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Construct proxied gateway URL with all user settings
  const gatewayUrl = `/api/proxy/gateway?url=${encodeURIComponent(activeUrl)}&removeScripts=${config.removeScripts}&removeImages=${config.removeImages}&stripTitle=${config.stripTitle}&showToolbar=${config.showToolbar}&encodeURL=${config.encodeURL}&stripSecurityHeaders=${config.stripSecurityHeaders}&injectHook=${config.injectHook}&userAgent=${encodeURIComponent(config.userAgent)}`;

  const handleNavigate = (target: string) => {
    let finalUrl = target.trim();
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = 'https://' + finalUrl;
    }
    setHasError(null);
    setInputUrl(finalUrl);
    setCurrentUrl(finalUrl);
    setActiveUrl(finalUrl);
    setIsLoading(true);
    if (onNavigate) onNavigate(finalUrl);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleNavigate(inputUrl);
  };

  const handleReload = () => {
    setHasError(null);
    setIsLoading(true);
    if (iframeRef.current) {
      iframeRef.current.src = gatewayUrl;
    }
  };

  // Safety timer to clear loading overlay if frame doesn't fire load within 12 seconds
  useEffect(() => {
    if (!isLoading) return;
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 12000);
    return () => clearTimeout(timer);
  }, [isLoading]);

  // Listen for navigation messages from the injected proxy hook
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'NEWGLYPE_NAVIGATED' && event.data.url) {
        setCurrentUrl(event.data.url);
        setInputUrl(event.data.url);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const getContainerWidth = () => {
    switch (deviceMode) {
      case 'laptop': return 'max-w-5xl';
      case 'tablet': return 'max-w-3xl';
      case 'mobile': return 'max-w-sm';
      default: return 'w-full';
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Quick Launch Presets */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-400 font-medium shrink-0 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> تست سریع:
        </span>
        {PRESET_SITES.map((site) => (
          <button
            key={site.url}
            onClick={() => handleNavigate(site.url)}
            className="px-3 py-1 bg-white hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 rounded-full transition-all text-slate-600 shrink-0 font-medium cursor-pointer shadow-xs"
          >
            {site.label}
          </button>
        ))}
      </div>

      {/* Main Browser Window Card */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col flex-1">
        {/* Browser Chrome Header (Omnibar) */}
        <div className="bg-slate-900 text-white p-3 border-b border-slate-800 flex flex-col sm:flex-row items-center gap-3">
          {/* Navigation Controls */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => window.history.back()}
              title="Back"
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => window.history.forward()}
              title="Forward"
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleReload}
              title="Reload"
              className={`p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors ${isLoading ? 'animate-spin text-indigo-400' : ''}`}
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>

          {/* Omnibar Input Form */}
          <form onSubmit={handleFormSubmit} className="flex-1 w-full flex items-center">
            <div className="relative w-full flex items-center">
              <div className="absolute left-3 flex items-center gap-1.5 text-emerald-400 text-xs font-mono font-medium pointer-events-none">
                <Lock className="w-3.5 h-3.5" />
                <span className="hidden md:inline">PROXY</span>
              </div>
              <input
                type="text"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full pl-22 pr-24 py-2 bg-slate-800/90 border border-slate-700/80 rounded-xl text-sm text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-slate-800 transition-all placeholder:text-slate-500"
              />
              <div className="absolute right-1.5 flex items-center gap-1">
                <button
                  type="submit"
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer shadow-xs"
                >
                  برو / Go
                </button>
              </div>
            </div>
          </form>

          {/* Device & Standalone Controls */}
          <div className="flex items-center gap-1 shrink-0">
            <div className="hidden lg:flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700">
              <button
                onClick={() => setDeviceMode('full')}
                title="Full Width"
                className={`p-1.5 rounded-md transition-colors ${deviceMode === 'full' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                <Monitor className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setDeviceMode('laptop')}
                title="Laptop (1024px)"
                className={`p-1.5 rounded-md transition-colors ${deviceMode === 'laptop' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                <Laptop className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setDeviceMode('tablet')}
                title="Tablet (768px)"
                className={`p-1.5 rounded-md transition-colors ${deviceMode === 'tablet' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                <Tablet className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setDeviceMode('mobile')}
                title="Mobile (375px)"
                className={`p-1.5 rounded-md transition-colors ${deviceMode === 'mobile' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                <Smartphone className="w-3.5 h-3.5" />
              </button>
            </div>

            <a
              href={gatewayUrl}
              target="_blank"
              rel="noreferrer"
              title="Open Standalone Window"
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors border border-slate-700"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Status Bar */}
        <div className="bg-slate-100 px-4 py-1.5 border-b border-slate-200 flex justify-between items-center text-xs text-slate-500 font-mono">
          <div className="flex items-center gap-2 truncate">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
            <span className="truncate">URL فعلی: {currentUrl}</span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {config.injectHook && (
              <span className="text-indigo-600 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> قلاب مدرن فعال (Fetch/XHR Hook)
              </span>
            )}
            <span className="text-slate-400 hidden sm:inline">RFC 6265 Jar</span>
          </div>
        </div>

        {/* Viewport Display Area */}
        <div className="flex-1 bg-slate-200/60 p-2 md:p-4 flex justify-center items-stretch min-h-[620px] overflow-hidden">
          <div className={`w-full ${getContainerWidth()} bg-white rounded-xl shadow-md border border-slate-300 overflow-hidden flex flex-col transition-all duration-300 relative`}>
            <iframe
              ref={iframeRef}
              src={gatewayUrl}
              onLoad={() => setIsLoading(false)}
              onError={() => {
                setIsLoading(false);
                setHasError('عدم امکان بارگذاری فریم در مرورگر');
              }}
              className="w-full h-full flex-1 border-0 bg-white"
              title="NewGlype Proxy Sandboxed Frame"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
            />

            {isLoading && (
              <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex flex-col items-center justify-center gap-3">
                <RotateCw className="w-8 h-8 text-indigo-600 animate-spin" />
                <p className="text-sm font-medium text-slate-700">در حال دریافت و بازنویسی استاندارد صفحه...</p>
                <span className="text-xs text-slate-400">اعمال هوشمند قلاب جاوااسکریپت و کوکی‌ها</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
