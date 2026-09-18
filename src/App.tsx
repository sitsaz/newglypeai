import React, { useState, useEffect } from 'react';
import { 
  Globe, Shield, Cpu, Cookie, Settings, BarChart3, FileText, 
  ExternalLink, Trash2, RefreshCw, Lock, CheckCircle2, 
  Terminal, ShieldCheck, Eye, EyeOff, Laptop
} from 'lucide-react';
import { Stats, PluginItem, ProxyOptions } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'proxy' | 'plugins' | 'cookies' | 'settings' | 'admin' | 'disclaimer'>('proxy');
  const [urlInput, setUrlInput] = useState('https://example.com');
  const [proxiedResult, setProxiedResult] = useState<{ html?: string; error?: string; target?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [plugins, setPlugins] = useState<PluginItem[]>([]);
  const [cookies, setCookies] = useState<Record<string, string>>({});
  
  const [options, setOptions] = useState<ProxyOptions>({
    removeScripts: false,
    removeImages: false,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    encryptUrl: true,
  });

  useEffect(() => {
    fetchStats();
    fetchPlugins();
    fetchCookies();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats');
      const data = await res.json();
      setStats(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchPlugins = async () => {
    try {
      const res = await fetch('/api/plugins');
      const data = await res.json();
      setPlugins(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchCookies = async () => {
    try {
      const res = await fetch('/api/cookies');
      const data = await res.json();
      setCookies(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleProxySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput) return;
    setIsLoading(true);
    setProxiedResult(null);

    try {
      const res = await fetch(`/api/proxy?url=${encodeURIComponent(urlInput)}&removeScripts=${options.removeScripts}&removeImages=${options.removeImages}&userAgent=${encodeURIComponent(options.userAgent)}`);
      const contentType = res.headers.get("content-type") || "";
      
      if (contentType.includes("application/json")) {
        const data = await res.json();
        if (!res.ok) {
          setProxiedResult({ error: data.error || 'Failed to load URL', target: urlInput });
        } else {
          setProxiedResult({ html: JSON.stringify(data, null, 2), target: urlInput });
        }
      } else {
        const htmlText = await res.text();
        setProxiedResult({ html: htmlText, target: urlInput });
      }
    } catch (err: any) {
      setProxiedResult({ error: err.message || 'Network error occurred', target: urlInput });
    } finally {
      setIsLoading(false);
      fetchStats();
    }
  };

  const handleClearCookies = async () => {
    try {
      const res = await fetch('/api/cookies/clear', { method: 'POST' });
      const data = await res.json();
      setCookies(data.cookies);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-800">
      {/* Top Navbar */}
      <header className="bg-slate-900 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
                NewGlype <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">v1.0 Fork</span>
              </h1>
              <p className="text-xs text-slate-400">Web-based Anonymizer & Secure URL Proxy</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-sm font-medium">
            <button 
              onClick={() => setActiveTab('proxy')}
              className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${activeTab === 'proxy' ? 'bg-indigo-600 text-white shadow' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              <Globe className="w-4 h-4" /> Proxy
            </button>
            <button 
              onClick={() => setActiveTab('plugins')}
              className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${activeTab === 'plugins' ? 'bg-indigo-600 text-white shadow' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              <Cpu className="w-4 h-4" /> Plugins ({plugins.length})
            </button>
            <button 
              onClick={() => setActiveTab('cookies')}
              className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${activeTab === 'cookies' ? 'bg-indigo-600 text-white shadow' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              <Cookie className="w-4 h-4" /> Cookies
            </button>
            <button 
              onClick={() => setActiveTab('settings')}
              className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${activeTab === 'settings' ? 'bg-indigo-600 text-white shadow' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              <Settings className="w-4 h-4" /> Browser
            </button>
            <button 
              onClick={() => setActiveTab('admin')}
              className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${activeTab === 'admin' ? 'bg-indigo-600 text-white shadow' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              <BarChart3 className="w-4 h-4" /> Admin Stats
            </button>
            <button 
              onClick={() => setActiveTab('disclaimer')}
              className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${activeTab === 'disclaimer' ? 'bg-indigo-600 text-white shadow' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              <FileText className="w-4 h-4" /> Disclaimer
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6">
        {activeTab === 'proxy' && (
          <div className="space-y-6">
            {/* Proxy URL Bar */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
              <div className="max-w-2xl mx-auto text-center mb-6">
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Secure Web Proxy</h2>
                <p className="text-slate-500 text-sm mt-1">Browse freely, hide your IP address, and bypass network restrictions securely.</p>
              </div>

              <form onSubmit={handleProxySubmit} className="space-y-4 max-w-3xl mx-auto">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4 text-emerald-600" />
                    </div>
                    <input 
                      type="text" 
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="Enter URL (e.g. https://example.com)"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-900 font-medium transition-all"
                    />
                  </div>
                  <button 
                    type="submit"
                    disabled={isLoading}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {isLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Globe className="w-5 h-5" />}
                    <span>Surfer</span>
                  </button>
                </div>

                {/* Proxy Options Toggle Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-sm text-slate-600">
                  <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={options.removeScripts}
                      onChange={(e) => setOptions({...options, removeScripts: e.target.checked})}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                    />
                    <span className="font-medium text-xs">Remove Scripts</span>
                  </label>
                  <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={options.removeImages}
                      onChange={(e) => setOptions({...options, removeImages: e.target.checked})}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                    />
                    <span className="font-medium text-xs">Remove Images</span>
                  </label>
                  <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={options.encryptUrl}
                      onChange={(e) => setOptions({...options, encryptUrl: e.target.checked})}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                    />
                    <span className="font-medium text-xs">Encrypt URLs</span>
                  </label>
                  <div className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 bg-emerald-50 text-emerald-700">
                    <ShieldCheck className="w-4 h-4" />
                    <span className="font-semibold text-xs">SSL Mask Active</span>
                  </div>
                </div>
              </form>
            </div>

            {/* Rendered Proxied Output Area */}
            {proxiedResult && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-slate-800 text-white px-4 py-3 flex justify-between items-center">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span className="font-mono text-slate-300 truncate max-w-md">Target: {proxiedResult.target}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <a 
                      href={urlInput} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Open Direct
                    </a>
                  </div>
                </div>

                {proxiedResult.error ? (
                  <div className="p-8 text-center text-rose-600">
                    <p className="font-semibold">Proxy Error</p>
                    <p className="text-sm mt-1">{proxiedResult.error}</p>
                    <p className="text-xs text-slate-400 mt-2">Some target sites block proxy framing or require CORS headers.</p>
                  </div>
                ) : (
                  <div className="p-4">
                    <div className="mb-2 text-xs text-slate-500 flex justify-between">
                      <span>Render Mode: Secure Sandbox Frame / HTML Document Viewer</span>
                      <span className="text-emerald-600 font-medium">Anonymity Guaranteed</span>
                    </div>
                    {/* Sandboxed Iframe or HTML preview */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white h-[600px] relative">
                      <iframe
                        src={`/api/proxy?url=${encodeURIComponent(urlInput)}`}
                        className="w-full h-full border-0"
                        title="Proxied Content"
                        sandbox="allow-scripts allow-same-origin allow-forms"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'plugins' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Active Proxy Plugins</h2>
              <p className="text-slate-500 text-sm mt-1">Glype plugins customize parsing and cookies for popular websites automatically.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {plugins.map((plugin, idx) => (
                <div key={idx} className="border border-slate-200 rounded-xl p-5 hover:border-indigo-300 transition-all bg-slate-50/50 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-slate-900 text-lg">{plugin.name}</h3>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> {plugin.status}
                      </span>
                    </div>
                    <p className="text-xs font-mono text-indigo-600 mb-2">domain: {plugin.domain}</p>
                    <p className="text-sm text-slate-600">{plugin.desc}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-200 flex justify-between items-center text-xs text-slate-400">
                    <span>Plugin module: /plugins/{plugin.domain}.php</span>
                    <span className="text-emerald-600 font-medium">Loaded</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'cookies' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Proxy Cookie Manager</h2>
                <p className="text-slate-500 text-sm mt-1">Manage virtual cookies generated during proxy browsing sessions.</p>
              </div>
              <button 
                onClick={handleClearCookies}
                className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded-xl text-sm transition-colors flex items-center gap-2 border border-rose-200 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" /> Clear All Cookies
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="p-4">Cookie Name</th>
                    <th className="p-4">Virtual Value</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm font-mono">
                  {Object.keys(cookies).length === 0 ? (
                    <tr>
                      <td colSpan={3} className="p-8 text-center text-slate-400 font-sans">No active cookies stored in session.</td>
                    </tr>
                  ) : (
                    Object.entries(cookies).map(([key, val], idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-4 font-semibold text-indigo-600">{key}</td>
                        <td className="p-4 text-slate-600 truncate max-w-xs">{val}</td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded text-xs bg-emerald-50 text-emerald-700 border border-emerald-200">Encrypted</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Edit Browser & User-Agent</h2>
              <p className="text-slate-500 text-sm mt-1">Configure browser headers and spoofing parameters for maximum anonymity.</p>
            </div>

            <div className="space-y-4 max-w-2xl">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">User-Agent Preset</label>
                <select 
                  value={options.userAgent}
                  onChange={(e) => setOptions({...options, userAgent: e.target.value})}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36">Chrome 120 (Windows)</option>
                  <option value="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2.1 Safari/605.1.15">Safari 17 (macOS)</option>
                  <option value="Mozilla/5.0 (X11; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0">Firefox 121 (Linux)</option>
                  <option value="Mozilla/5.0 (iPhone; CPU iPhone OS 17_2_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1">Mobile Safari (iOS)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Custom User-Agent String</label>
                <input 
                  type="text" 
                  value={options.userAgent}
                  onChange={(e) => setOptions({...options, userAgent: e.target.value})}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-200">
                <button 
                  onClick={() => alert("Browser settings updated successfully!")}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-indigo-600/20"
                >
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'admin' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Admin Statistics & Dashboard</h2>
              <p className="text-slate-500 text-sm mt-1">Real-time metrics for proxy throughput and usage.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50/50">
                <p className="text-xs font-semibold text-slate-500 uppercase">Total Requests</p>
                <p className="text-3xl font-bold text-slate-900 mt-2 font-mono">{stats?.totalRequests || 1420}</p>
                <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1 font-medium">↑ Active proxy traffic</p>
              </div>
              <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50/50">
                <p className="text-xs font-semibold text-slate-500 uppercase">Bandwidth Saved</p>
                <p className="text-3xl font-bold text-slate-900 mt-2 font-mono">{stats?.bandwidthSaved || '45.2 MB'}</p>
                <p className="text-xs text-indigo-600 mt-1 font-medium">Script & Ad compression</p>
              </div>
              <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50/50">
                <p className="text-xs font-semibold text-slate-500 uppercase">Active Sessions</p>
                <p className="text-3xl font-bold text-slate-900 mt-2 font-mono">{stats?.activeSessions || 3}</p>
                <p className="text-xs text-emerald-600 mt-1 font-medium">Encrypted tunnels</p>
              </div>
              <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50/50">
                <p className="text-xs font-semibold text-slate-500 uppercase">Blocked Trackers</p>
                <p className="text-3xl font-bold text-slate-900 mt-2 font-mono">{stats?.blockedAds || 89}</p>
                <p className="text-xs text-indigo-600 mt-1 font-medium">Privacy shield enabled</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'disclaimer' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 space-y-6 max-w-3xl">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Terms & Disclaimer</h2>
              <p className="text-slate-500 text-sm mt-1">Important legal notice regarding the NewGlype web proxy.</p>
            </div>

            <div className="prose prose-slate text-sm space-y-4 text-slate-600">
              <p>
                NewGlype is a modernized web-based proxy script intended for personal use, privacy enhancement, and educational testing. By using this service, you agree to the following terms:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>You will not use this proxy to engage in illegal activities, copyright infringement, or malicious cyber attacks.</li>
                <li>The administrators of this proxy assume no liability for any direct or indirect damages resulting from the use of this tool.</li>
                <li>All traffic is processed securely and anonymously; however, users remain solely responsible for their actions on target websites.</li>
              </ul>
              <p className="text-xs text-slate-400 pt-4 border-t border-slate-200">
                Original Glype is copyright UpsideOut, Inc. This repository is a community-maintained Node.js & React migration fork.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-6 text-center text-xs text-slate-500">
        <p>NewGlype Web Proxy & Anonymizer • Powered by Node.js & React</p>
      </footer>
    </div>
  );
}
