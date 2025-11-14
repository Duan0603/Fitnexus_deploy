import React, { useEffect, useRef, useState } from "react";
import { Bell, ChevronRight, Loader2, Mail, Flame, CheckCircle2 } from "lucide-react";
import { useNotificationsFeed } from "../../hooks/useNotificationsFeed.js";
import { useNavigate } from "react-router-dom";

const ICON_MAP = {
  support_report: Mail,
  support_reply: Mail,
  streak: Flame,
  general: CheckCircle2,
};

const typeColors = {
  support_report: "bg-indigo-100 text-indigo-800",
  support_reply: "bg-emerald-100 text-emerald-800",
  streak: "bg-amber-100 text-amber-800",
  general: "bg-slate-100 text-slate-700",
};

export default function NotificationsDropdown({ buttonClassName = "", popoverClassName = "", showText = false }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const { items, loading, error, unreadCount, fetchNotifications, markRead, markAll } =
    useNotificationsFeed({ limit: 10, autoLoad: false });
  const navigate = useNavigate();

  useEffect(() => {
    if (open) fetchNotifications();
  }, [open, fetchNotifications]);

  useEffect(() => {
    const handler = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const toggleOpen = () => setOpen((prev) => !prev);

  const handleItemClick = (notification) => {
    if (!notification?.read_at) {
      markRead(notification.notification_id);
    }
    const destination = notification?.metadata?.url;
    if (destination) {
      if (/^https?:/i.test(destination)) {
        window.location.assign(destination);
      } else {
        navigate(destination);
      }
    } else {
      navigate(`/settings/notifications?focus=${notification.notification_id}`);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={toggleOpen}
        className={`relative inline-flex items-center justify-center rounded-full border px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 ${buttonClassName}`}
        aria-label="Thông báo"
        aria-expanded={open}
      >
        <Bell className="w-4 h-4" />
        {showText && <span className="ml-2">Thông báo</span>}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className={`absolute right-0 mt-3 w-80 rounded-2xl border border-slate-200 bg-white shadow-xl z-50 ${popoverClassName}`}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <div>
              <p className="text-xs uppercase text-slate-400">Thông báo</p>
              <p className="text-sm font-semibold text-slate-800">{unreadCount} chưa đọc</p>
            </div>
            <button
              type="button"
              onClick={() => markAll()}
              className="text-xs font-medium text-blue-600 hover:underline disabled:opacity-50"
              disabled={!items.length}
            >
              Đánh dấu đã đọc
            </button>
          </div>
          <button
            type="button"
            onClick={() => navigate("/settings/notifications")}
            className="w-full border-b border-slate-100 px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-blue-600 hover:bg-slate-50"
          >
            Xem trang thông báo
          </button>
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
              </div>
            ) : error ? (
              <p className="px-4 py-6 text-sm text-rose-600">{error}</p>
            ) : items.length === 0 ? (
              <p className="px-4 py-6 text-sm text-slate-500">Chưa có thông báo nào.</p>
            ) : (
              items.map((item) => {
                const Icon = ICON_MAP[item.type] || ICON_MAP.general;
                const badgeClass = typeColors[item.type] || typeColors.general;
                return (
                  <button
                    key={item.notification_id}
                    onClick={() => handleItemClick(item)}
                    className={`flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-slate-50 ${
                      item.read_at ? "opacity-75" : ""
                    }`}
                  >
                    <span className={`mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-full ${badgeClass}`}>
                      <Icon className="w-4 h-4" />
                    </span>
                    <span className="flex-1">
                      <span className="block text-sm font-semibold text-slate-900 line-clamp-1">
                        {item.title}
                      </span>
                      {item.body && (
                        <span className="block text-xs text-slate-600 line-clamp-2">{item.body}</span>
                      )}
                      <span className="text-[11px] text-slate-400">
                        {new Date(item.created_at).toLocaleString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                          day: "2-digit",
                          month: "2-digit",
                        })}
                      </span>
                    </span>
                    {item.metadata?.url && <ChevronRight className="w-4 h-4 text-slate-400" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
