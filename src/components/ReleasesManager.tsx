import React, { useState, useEffect } from 'react';
import { Package, Download, History, CheckCircle, Clock, FileCode, Shield, RefreshCw } from 'lucide-react';

interface ReleaseFile {
  fileName: string;
  url: string;
  size: number;
  sha256: string;
}

interface Release {
  version: string;
  date: string;
  changelog: string[];
  files: {
    phpStandalone: ReleaseFile;
    wordPressPlugin: ReleaseFile;
  };
}

interface ReleasesManifest {
  latest: string;
  lastUpdated: string;
  releases: Release[];
}

export const ReleasesManager: React.FC = () => {
  const [manifest, setManifest] = useState<ReleasesManifest | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReleases = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/releases');
      if (!res.ok) throw new Error('خطا در دریافت لیست نسخه‌ها');
      const data: ReleasesManifest = await res.json();
      setManifest(data);
    } catch (e: any) {
      setError(e.message || 'خطا در ارتباط با سرور');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReleases();
  }, []);

  const formatSize = (bytes: number) => {
    if (!bytes) return '0 KB';
    return (bytes / 1024).toFixed(1) + ' KB';
  };

  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('fa-IR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 md:p-8 shadow-lg border border-indigo-500/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
            <CheckCircle className="w-3.5 h-3.5" /> نسخه‌بندی خودکار و آرشیو پکیج‌ها (Automated Versioning)
          </div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">
            مدیریت و آرشیو نسخه‌های ZIP پرتال ابری و افزونه وردپرس
          </h2>
          <p className="text-slate-300 text-xs leading-relaxed">
            پس از هر بار اعمال تغییرات و به‌روزرسانی کدها، فایل‌های پکیج به‌صورت خودکار برچسب‌گذاری و نسخه‌بندی می‌شوند (<code className="text-emerald-300 font-mono">v{manifest?.latest || '2.1.0'}</code>) و در پوشه اختصاصی <code className="text-blue-300 font-mono">/releases/</code> ذخیره می‌گردند تا تاریخچه و ترتیب تولید فایل‌ها به وضوح مشخص باشد.
          </p>
        </div>

        <button
          onClick={fetchReleases}
          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>بروزرسانی لیست نسخه‌ها</span>
        </button>
      </div>

      {/* Latest Release Highlight Card */}
      {manifest && manifest.releases && manifest.releases.length > 0 && (
        <div className="bg-white rounded-2xl border border-indigo-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-indigo-100 p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-mono font-bold shadow-md shadow-indigo-600/20">
                v{manifest.latest}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">آخرین نسخه پایدار (Latest Release)</h3>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full text-[10px] font-bold">
                    جدیدترین نسخه
                  </span>
                </div>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  تاریخ تولید: {formatDate(manifest.releases[0].date)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <a
                href={manifest.releases[0].files.phpStandalone.url}
                download={manifest.releases[0].files.phpStandalone.fileName}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                title={`دانلود نسخه مستقل PHP v${manifest.latest}`}
              >
                <Download className="w-4 h-4" />
                <span>دانلود PHP Standalone (v{manifest.latest})</span>
              </a>

              <a
                href={manifest.releases[0].files.wordPressPlugin.url}
                download={manifest.releases[0].files.wordPressPlugin.fileName}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                title={`دانلود افزونه وردپرس v${manifest.latest}`}
              >
                <Download className="w-4 h-4" />
                <span>دانلود افزونه وردپرس (v{manifest.latest})</span>
              </a>
            </div>
          </div>

          <div className="p-5 space-y-4">
            <div>
              <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                <FileCode className="w-4 h-4 text-indigo-600" /> تغییرات و بهبودهای این نسخه (Changelog):
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-600 mr-2">
                {manifest.releases[0].changelog.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              {/* Standalone File Details */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between gap-2">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">پکیج هاست سنتی / رایگان PHP</span>
                    <span className="text-[11px] font-mono text-indigo-600 break-all">
                      {manifest.releases[0].files.phpStandalone.fileName}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {formatSize(manifest.releases[0].files.phpStandalone.size)}
                  </span>
                </div>
                <div className="text-[10px] font-mono text-slate-400 truncate" title={`SHA256: ${manifest.releases[0].files.phpStandalone.sha256}`}>
                  SHA-256: {manifest.releases[0].files.phpStandalone.sha256}
                </div>
              </div>

              {/* WordPress Plugin File Details */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between gap-2">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">پکیج افزونه رسمی وردپرس</span>
                    <span className="text-[11px] font-mono text-blue-600 break-all">
                      {manifest.releases[0].files.wordPressPlugin.fileName}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {formatSize(manifest.releases[0].files.wordPressPlugin.size)}
                  </span>
                </div>
                <div className="text-[10px] font-mono text-slate-400 truncate" title={`SHA256: ${manifest.releases[0].files.wordPressPlugin.sha256}`}>
                  SHA-256: {manifest.releases[0].files.wordPressPlugin.sha256}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Release History & Version List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <History className="w-4 h-4 text-slate-600" />
          تاریخچه و تمامی نسخه‌های موجود در پوشه پروژه (/releases/)
        </h3>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">در حال بارگذاری لیست نسخه‌ها...</div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-rose-50 text-rose-700 text-xs border border-rose-200">{error}</div>
        ) : !manifest || manifest.releases.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">هیچ نسخه‌ای یافت نشد.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-500 border-y border-slate-200 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">نسخه</th>
                  <th className="py-2.5 px-3">تاریخ و زمان تولید</th>
                  <th className="py-2.5 px-3">فایل مستقل PHP (Standalone)</th>
                  <th className="py-2.5 px-3">فایل افزونه وردپرس (Plugin)</th>
                  <th className="py-2.5 px-3">توضیحات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {manifest.releases.map((rel, idx) => (
                  <tr key={rel.version} className={idx === 0 ? 'bg-indigo-50/30' : 'hover:bg-slate-50/50'}>
                    <td className="py-3 px-3 font-mono font-bold text-indigo-700 flex items-center gap-1.5">
                      <span>v{rel.version}</span>
                      {idx === 0 && (
                        <span className="px-1.5 py-0.2 bg-emerald-500 text-white rounded text-[9px]">جدید</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                      {formatDate(rel.date)}
                    </td>
                    <td className="py-3 px-3">
                      <a
                        href={rel.files.phpStandalone.url}
                        download={rel.files.phpStandalone.fileName}
                        className="inline-flex items-center gap-1.5 text-emerald-600 hover:text-emerald-700 font-mono font-bold text-[11px] bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 transition-all"
                      >
                        <Download className="w-3 h-3" />
                        <span>{rel.files.phpStandalone.fileName}</span>
                        <span className="text-[10px] text-slate-400">({formatSize(rel.files.phpStandalone.size)})</span>
                      </a>
                    </td>
                    <td className="py-3 px-3">
                      <a
                        href={rel.files.wordPressPlugin.url}
                        download={rel.files.wordPressPlugin.fileName}
                        className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-mono font-bold text-[11px] bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg border border-blue-200 transition-all"
                      >
                        <Download className="w-3 h-3" />
                        <span>{rel.files.wordPressPlugin.fileName}</span>
                        <span className="text-[10px] text-slate-400">({formatSize(rel.files.wordPressPlugin.size)})</span>
                      </a>
                    </td>
                    <td className="py-3 px-3 text-slate-500 text-[11px] max-w-xs truncate" title={rel.changelog.join(' | ')}>
                      {rel.changelog[0] || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Directory & Permalinks Guide */}
      <div className="p-4 rounded-2xl bg-slate-900 text-slate-200 text-xs border border-slate-800 space-y-2">
        <div className="flex items-center gap-2 font-bold text-white">
          <Package className="w-4 h-4 text-emerald-400" />
          راهنمای آدرس‌دهی فایل‌ها در پروژه:
        </div>
        <ul className="space-y-1 text-slate-400 mr-2 list-disc list-inside">
          <li>
            تمامی فایل‌های نسخه‌بندی شده در دایرکتوری فیزیکی <code className="text-emerald-400 font-mono">/releases/</code> و <code className="text-emerald-400 font-mono">/public/releases/</code> قرار دارند (به عنوان مثال <code className="text-emerald-300 font-mono">cloud-portal-php-v2.1.0.zip</code>).
          </li>
          <li>
            فایل‌های بدون شماره نسخه (مثل <code className="text-blue-300 font-mono">cloud-portal-php.zip</code> و <code className="text-blue-300 font-mono">cloud-portal-wp.zip</code>) همواره آخرین نسخه ساخته‌شده را به صورت پرمالینک در دسترس قرار می‌دهند تا اسکریپت‌ها یا لینک‌های دانلود قدیمی نیز کماکان به جدیدترین بیلد متصل باشند.
          </li>
          <li>
            فایل متادیتای <code className="text-amber-300 font-mono">/releases/manifest.json</code> شامل لیست تمام انتشارهای تاریخی، تاریخ، هش SHA-256 و لاگ تغییرات است.
          </li>
        </ul>
      </div>
    </div>
  );
};
