import React, { useMemo } from "react";
import HeaderLogin from "../../components/header/HeaderLogin.jsx";
import { useNotificationsFeed } from "../../hooks/useNotificationsFeed.js";
import { useSearchParams } from "react-router-dom";
import { Loader2, RefreshCw, CheckCircle2 } from "lucide-react";

export default function NotificationsCenter() {
  const { items, loading, error, markRead, markAll, fetchNotifications } = useNotificationsFeed({ limit: 50, autoLoad: true });
  const [searchParams] = useSearchParams();
  const focusId = Number(searchParams.get("focus"));

  const grouped = useMemo(() => {
    const map = new Map();
    items.forEach((item) => {
      const day = new Date(item.created_at).toLocaleDateString("vi-VN");
      if (!map.has(day)) map.set(day, []);
      map.get(day).push(item);
    });
    return Array.from(map.entries());
  }, [items]);

  return (
    <div className="min-h-screen bg-slate-50">
      <HeaderLogin />
      <main className="max-w-4xl px-4 py-8 mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <p className="text-sm font-medium text-slate-500 uppercase">Trung tâm thông báo</p>
            <h1 className="text-3xl font-bold text-slate-900">Thông báo của bạn</h1>
            <p className="text-sm text-slate-500">Xem toàn bộ thông báo quan trọng và đánh dấu đã đọc.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchNotifications}
              className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm text-slate-700 hover:bg-white"
            >
              <RefreshCw className="w-4 h-4" /> Làm mới
            </button>
            <button
              type="button"
              onClick={markAll}
              className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <CheckCircle2 className="w-4 h-4" /> Đánh dấu đọc hết
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-600">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : grouped.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-16 text-center text-slate-500">
            Bạn chưa có thông báo nào.
          </div>
        ) : (
          <div className="space-y-6">
            {grouped.map(([day, list]) => (
              <section key={day}>
                <p className="mb-3 text-xs font-semibold uppercase text-slate-400">{day}</p>
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  {list.map((item, idx) => {
                    const highlight = item.notification_id === focusId;
                    return (
                      <div
                        key={item.notification_id}
                        className={`flex flex-col gap-1 border-b border-slate-100 px-5 py-4 last:border-none ${
                          highlight ? "bg-indigo-50" : item.read_at ? "bg-white" : "bg-amber-50"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                          <div className="text-xs text-slate-400">
                            {new Date(item.created_at).toLocaleTimeString("vi-VN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>
                        {item.body && (
                          <p className="text-sm text-slate-600 whitespace-pre-line">{item.body}</p>
                        )}
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span>{item.type.replace(/_/g, " ")}</span>
                          {!item.read_at && (
                            <button
                              type="button"
                              onClick={() => markRead(item.notification_id)}
                              className="font-medium text-blue-600 hover:underline"
                            >
                              Đánh dấu đã đọc
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
