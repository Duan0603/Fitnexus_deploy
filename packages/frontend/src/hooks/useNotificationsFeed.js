import { useCallback, useEffect, useMemo, useState } from "react";
import {
  listNotificationsApi,
  markNotificationReadApi,
  markAllNotificationsReadApi,
} from "../lib/api.js";

export function useNotificationsFeed({ limit = 10, autoLoad = false } = {}) {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ total: 0, unread: 0, limit, offset: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listNotificationsApi({ limit });
      const data = res?.data || {};
      setItems(Array.isArray(data.items) ? data.items : []);
      setMeta({
        total: Number.isFinite(data.total) ? data.total : 0,
        unread: Number.isFinite(data.unread) ? data.unread : 0,
        limit: data.limit || limit,
        offset: data.offset || 0,
      });
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Không thể tải thông báo");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    if (autoLoad) fetchNotifications();
  }, [autoLoad, fetchNotifications]);

  const markRead = useCallback(
    async (notificationId) => {
      if (!notificationId) return;
      try {
        await markNotificationReadApi(notificationId);
        await fetchNotifications();
      } catch (err) {
        setError(err?.response?.data?.message || err?.message || "Không thể cập nhật thông báo");
      }
    },
    [fetchNotifications]
  );

  const markAll = useCallback(async () => {
    try {
      await markAllNotificationsReadApi();
      await fetchNotifications();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Không thể cập nhật thông báo");
    }
  }, [fetchNotifications]);

  const unreadCount = useMemo(() => meta.unread || items.filter((n) => !n.read_at).length, [items, meta.unread]);

  return {
    items,
    loading,
    error,
    meta,
    unreadCount,
    fetchNotifications,
    markRead,
    markAll,
  };
}
