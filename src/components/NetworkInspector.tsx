import React, { useState, useEffect } from 'react';
import { Activity, RefreshCw, CheckCircle2, AlertOctagon, ArrowUpRight, Clock, Database } from 'lucide-react';
import { NetworkLogItem } from '../types';

export const NetworkInspector: React.FC = () => {
  const [logs, setLogs] = useState<NetworkLogItem[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/network-logs');
      const data = await res.json();
      setLogs(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchLogs();
    if (!autoRefresh) return;
    const interval = setInterval(fetchLogs, 3000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const getStatusBadge = (status: number) => {
    if (status >= 200 && status < 300) {
      return <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">{status}</span>;
    }
    if (status >= 300 && status < 400) {
      return <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold">{status}</span>;
    }
    return <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-semibold">{status}</span>;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-200">
              <Activity className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              مانیتور تله‌متری شبکه و درخواست‌های پروکسی
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            مشاهده زنده تمامی درخواست‌های بازنویسی شده (HTML, CSS, JS, AJAX, Fetch) و زمان پاسخ‌دهی.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500"
            />
            <span>به‌روزرسانی خودکار (۳ ثانیه)</span>
          </label>
          <button
            onClick={() => {
              setIsRefreshing(true);
              fetchLogs().then(() => setIsRefreshing(false));
            }}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer"
            title="تازه سازی دستی"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3">زمان</th>
                <th className="p-3">متد</th>
                <th className="p-3">وضعیت (Status)</th>
                <th className="p-3">نوع داده (Type)</th>
                <th className="p-3">زمان تاخیر</th>
                <th className="p-3">حجم</th>
                <th className="p-3">آدرس درخواستی</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 font-sans">
                    درخواستی ثبت نشده است. با جستجو در مرورگر، درخواست‌ها در اینجا نمایش داده خواهند شد.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 text-slate-500">{log.timestamp}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        log.method === 'GET' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'
                      }`}>
                        {log.method}
                      </span>
                    </td>
                    <td className="p-3">{getStatusBadge(log.status)}</td>
                    <td className="p-3 text-slate-600">{log.contentType}</td>
                    <td className="p-3 text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {log.durationMs}ms
                    </td>
                    <td className="p-3 text-slate-500">
                      {log.sizeBytes > 1024 ? `${(log.sizeBytes / 1024).toFixed(1)} KB` : `${log.sizeBytes} B`}
                    </td>
                    <td className="p-3 text-slate-700 max-w-sm truncate" title={log.url}>
                      {log.url}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
