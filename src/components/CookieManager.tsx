import React, { useState, useEffect } from 'react';
import { 
  Cookie, Trash2, Plus, RefreshCw, Search, ShieldCheck, 
  Lock, AlertTriangle, Check, ExternalLink, Download 
} from 'lucide-react';
import { DetailedCookie } from '../types';

export const CookieManager: React.FC = () => {
  const [cookies, setCookies] = useState<DetailedCookie[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // New cookie form state
  const [newCookieDomain, setNewCookieDomain] = useState('https://example.com');
  const [newCookieString, setNewCookieString] = useState('session_token=xyz123; Path=/; HttpOnly');
  const [addStatus, setAddStatus] = useState<string | null>(null);

  const fetchCookies = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/cookies');
      const data = await res.json();
      setCookies(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch cookies', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCookies();
  }, []);

  const handleClearCookies = async () => {
    if (!confirm('آیا از پاک کردن تمامی کوکی‌های جلسه اطمینان دارید؟')) return;
    try {
      await fetch('/api/cookies/clear', { method: 'POST' });
      await fetchCookies();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddCookie = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/cookies/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: newCookieDomain,
          cookieStr: newCookieString,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAddStatus('کوکی با موفقیت ثبت شد!');
        setTimeout(() => {
          setAddStatus(null);
          setShowAddModal(false);
        }, 1200);
        fetchCookies();
      } else {
        setAddStatus('خطا در افزودن کوکی');
      }
    } catch (err) {
      setAddStatus('خطا در برقراری ارتباط');
    }
  };

  const filteredCookies = cookies.filter(
    (c) =>
      c.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.value.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const exportCookiesJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(cookies, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `newglype-cookies-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl border border-amber-200">
              <Cookie className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              مدیریت هوشمند کوکی‌ها (RFC 6265 Cookie Jar)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            سیستم کوکی‌های نوین با ذخیره‌سازی دامنه، مسیر (Path)، پرچم‌های SameSite و HttpOnly و همگام‌سازی لحظه‌ای با کدهای جاوااسکریپت سایت مقصد.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" /> افزودن کوکی دستی
          </button>
          <button
            onClick={exportCookiesJson}
            disabled={cookies.length === 0}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" /> خروجی JSON
          </button>
          <button
            onClick={fetchCookies}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer"
            title="تازه سازی"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleClearCookies}
            disabled={cookies.length === 0}
            className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-rose-200 disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" /> پاک کردن همه
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="جستجوی دامنه یا نام کوکی (مثال: google.com یا session)..."
          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800"
        />
      </div>

      {/* Cookies Table */}
      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3">دامنه (Domain)</th>
                <th className="p-3">نام (Key)</th>
                <th className="p-3">مقدار (Value)</th>
                <th className="p-3">مسیر (Path)</th>
                <th className="p-3">امنیت / HttpOnly</th>
                <th className="p-3">انقضا (Expires)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filteredCookies.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 font-sans">
                    {searchQuery ? 'هیچ کوکی مطابق با جستجوی شما یافت نشد.' : 'کوکی فعالی در حافظه وجود ندارد. با گشت و گذار در وب، کوکی‌ها به صورت خودکار در این جدول ثبت می‌شوند.'}
                  </td>
                </tr>
              ) : (
                filteredCookies.map((cookie, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-semibold text-indigo-600 max-w-[150px] truncate" title={cookie.domain}>
                      {cookie.domain}
                    </td>
                    <td className="p-3 font-bold text-slate-800 max-w-[140px] truncate" title={cookie.key}>
                      {cookie.key}
                    </td>
                    <td className="p-3 text-slate-600 max-w-[200px] truncate" title={cookie.value}>
                      {cookie.value}
                    </td>
                    <td className="p-3 text-slate-500">{cookie.path}</td>
                    <td className="p-3 font-sans">
                      <div className="flex items-center gap-1">
                        {cookie.httpOnly && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 text-[10px]">
                            HttpOnly
                          </span>
                        )}
                        {cookie.secure && (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px]">
                            Secure
                          </span>
                        )}
                        {!cookie.httpOnly && !cookie.secure && (
                          <span className="text-slate-400 text-[11px]">استاندارد</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-slate-400 max-w-[130px] truncate" title={cookie.expires || 'Session'}>
                      {cookie.expires ? new Date(cookie.expires).toLocaleDateString() : 'جلسه (Session)'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Cookie Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-900 text-lg">افزودن کوکی دستی به CookieJar</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleAddCookie} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  آدرس وبسایت هدف (URL):
                </label>
                <input
                  type="text"
                  value={newCookieDomain}
                  onChange={(e) => setNewCookieDomain(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono"
                  placeholder="https://example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  رشته هدر کوکی (Set-Cookie format):
                </label>
                <input
                  type="text"
                  value={newCookieString}
                  onChange={(e) => setNewCookieString(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono"
                  placeholder="token=abc123; Path=/; Domain=.example.com; HttpOnly"
                  required
                />
              </div>

              {addStatus && (
                <p className="text-xs font-semibold text-emerald-600 bg-emerald-50 p-2 rounded-lg">
                  {addStatus}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold"
                >
                  ثبت در حافظه پروکسی
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
