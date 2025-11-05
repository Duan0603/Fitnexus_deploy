import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { endpoints } from "../../lib/api";
import { FiLock, FiUnlock, FiSearch, FiRefreshCw } from "react-icons/fi";

function ConfirmModal({ open, title, children, onCancel, onConfirm, confirmText = "Confirm", loading }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-[520px] rounded-xl bg-white p-5 shadow-xl">
        <h3 className="mb-3 text-lg font-semibold">{title}</h3>
        <div className="space-y-3 text-sm">{children}</div>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onCancel} className="rounded-lg border px-4 py-2 hover:bg-gray-50" disabled={loading}>
            Hủy
          </button>
          <button
            onClick={onConfirm}
            className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "Đang xử lý…" : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LockUnlock() {
  const [users, setUsers] = useState([]);
  const [role, setRole] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [limit] = useState(20);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [lockTarget, setLockTarget] = useState(null);
  const [lockReason, setLockReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const navigate = useNavigate();
  const ACTIVE_WINDOW_MIN = 5;
  const AUTORELOAD_SEC = 30;

  // === Query builder ===
  const queryString = useMemo(() => {
    const p = new URLSearchParams();
    p.set("limit", String(limit));
    p.set("offset", String(page * limit));
    if (role !== "ALL" && role !== "ADMIN") p.set("role", role);
    if (search.trim()) p.set("search", search.trim());
    return p.toString();
  }, [role, search, page, limit]);

  // === Fetch Users ===
  async function fetchUsers() {
    setLoading(true);
    setErr("");
    try {
      const res = await api.get(`${endpoints.admin.users}?${queryString}`);
      const payload = res?.data?.data ?? res?.data;
      const list =
        Array.isArray(payload?.items)
          ? payload.items
          : Array.isArray(payload?.rows)
          ? payload.rows
          : Array.isArray(payload)
          ? payload
          : [];

      let filtered = list.filter((u) => u?.role !== "ADMIN");

      // Lọc client-side theo status
      if (status === "ACTIVE" || status === "INACTIVE" || status === "BANNED") {
        filtered = filtered.filter((u) => getActivityStatus(u) === status);
      }

      setUsers(filtered);
    } catch (e) {
      const code = e?.response?.status;
      if (code === 401) return navigate("/login", { replace: true });
      if (code === 403) setErr("Bạn không có quyền truy cập (ADMIN only).");
      else setErr(e?.response?.data?.message || "Không tải được danh sách người dùng");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryString, status]);

  // === Auto reload mỗi 30s ===
  useEffect(() => {
    const timer = setInterval(() => fetchUsers(), AUTORELOAD_SEC * 1000);
    return () => clearInterval(timer);
  }, [queryString, status]);

  // === Lock / Unlock logic ===
  const openLock = (u) => {
    setLockTarget(u);
    setLockReason("");
  };
  const closeLock = () => {
    setLockTarget(null);
    setLockReason("");
    setActionLoading(false);
  };

  async function doLock() {
    if (!lockTarget) return;
    if (!lockReason.trim()) return alert("Vui lòng nhập lý do khóa tài khoản.");
    setActionLoading(true);

    const now = new Date().toISOString();
    setUsers((prev) =>
      prev.map((x) =>
        x.user_id === lockTarget.user_id
          ? { ...x, isLocked: true, lockReason: lockReason.trim(), lockedAt: now }
          : x
      )
    );

    try {
      await api.patch(endpoints.admin.userLock(lockTarget.user_id), { reason: lockReason.trim() });
      closeLock();
    } catch (e) {
      // rollback nếu lỗi
      setUsers((prev) =>
        prev.map((x) =>
          x.user_id === lockTarget.user_id ? { ...x, isLocked: false, lockReason: null, lockedAt: null } : x
        )
      );
      alert(e?.response?.data?.message || "Khóa tài khoản thất bại");
      setActionLoading(false);
    }
  }

  async function doUnlock(u) {
    if (actionLoading) return;
    if (!confirm(`Mở khóa tài khoản cho "${u.username}" ?`)) return;
    setActionLoading(true);

    setUsers((prev) =>
      prev.map((x) => (x.user_id === u.user_id ? { ...x, isLocked: false, lockReason: null, lockedAt: null } : x))
    );

    try {
      await api.patch(endpoints.admin.userUnlock(u.user_id));
      setActionLoading(false);
    } catch (e) {
      setUsers((prev) => prev.map((x) => (x.user_id === u.user_id ? { ...x, isLocked: true } : x)));
      alert(e?.response?.data?.message || "Mở khóa thất bại");
      setActionLoading(false);
    }
  }

  // === Helpers ===
  function getActivityStatus(u) {
    if (String(u.status || "").toUpperCase() === "BANNED") return "BANNED";
    if (!u.lastActiveAt) return "INACTIVE";
    const last = new Date(u.lastActiveAt);
    if (isNaN(+last)) return "INACTIVE";
    const diffMin = (Date.now() - last.getTime()) / (1000 * 60);
    return diffMin <= ACTIVE_WINDOW_MIN ? "ACTIVE" : "INACTIVE";
  }

  function renderActivityBadge(u) {
    const s = getActivityStatus(u);
    const base = "rounded-full px-2 py-1 text-xs font-semibold";
    if (s === "ACTIVE") return <span className={`${base} bg-green-50 text-green-700`}>ACTIVE</span>;
    if (s === "BANNED") return <span className={`${base} bg-red-50 text-red-700`}>BANNED</span>;
    return <span className={`${base} bg-yellow-50 text-yellow-700`}>INACTIVE</span>;
  }

  const formatDateTime = (iso) => {
    try {
      if (!iso) return "";
      const d = new Date(iso);
      return d.toLocaleString();
    } catch {
      return iso ?? "";
    }
  };

  // === UI ===
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Lock & Unlock</h1>
        <button
          onClick={fetchUsers}
          className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
          title="Làm mới"
          disabled={loading}
        >
          <FiRefreshCw /> Refresh
        </button>
      </div>

      <p className="text-sm text-gray-500">
        Khóa/Mở khóa tài khoản người dùng. Trang này <b>không</b> hiển thị tài khoản ADMIN.
      </p>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl bg-white p-3 shadow-sm">
        <div className="relative">
          <FiSearch className="pointer-events-none absolute left-3 top-2.5 text-gray-400" />
          <input
            placeholder="Tìm theo username/email"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            className="w-64 rounded-lg border pl-9 pr-3 py-2 text-sm"
          />
        </div>

        <select
          value={role}
          onChange={(e) => {
            setRole(e.target.value);
            setPage(0);
          }}
          className="rounded-lg border px-3 py-2 text-sm"
        >
          <option value="ALL">Tất cả vai trò (trừ ADMIN)</option>
          <option value="USER">USER</option>
          <option value="TRAINER">TRAINER</option>
        </select>

        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(0);
          }}
          className="rounded-lg border px-3 py-2 text-sm"
        >
          <option value="ALL">Mọi trạng thái</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="INACTIVE">INACTIVE</option>
          <option value="BANNED">BANNED</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <table className="min-w-full border-separate border-spacing-0 text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Locked</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                  Đang tải…
                </td>
              </tr>
            )}

            {!loading && users.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                  Không có dữ liệu
                </td>
              </tr>
            )}

            {!loading &&
              users.map((u) => (
                <tr key={u.user_id} className="border-t">
                  <td className="px-4 py-3 font-medium">{u.username}</td>
                  <td className="px-4 py-3">{u.email}</td>
                  <td className="px-4 py-3">{u.role}</td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      {renderActivityBadge(u)}
                      <span className="mt-1 text-xs text-gray-400">
                        Last active: {u.lastActiveAt ? formatDateTime(u.lastActiveAt) : "N/A"}
                      </span>
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    {u.isLocked ? (
                      <div className="text-xs">
                        <span className="rounded-full bg-red-50 px-2 py-1 text-red-700">LOCKED</span>
                        {u.lockReason ? <div className="mt-1 text-gray-500 italic">Lý do: {u.lockReason}</div> : null}
                        {u.lockedAt ? <div className="mt-1 text-gray-400">Từ: {formatDateTime(u.lockedAt)}</div> : null}
                      </div>
                    ) : (
                      <span className="rounded-full bg-green-50 px-2 py-1 text-green-700 text-xs">OPEN</span>
                    )}
                  </td>

                  <td className="px-4 py-3">{u.plan}</td>

                  <td className="px-4 py-3 text-right">
                    {u.isLocked ? (
                      <button
                        onClick={() => doUnlock(u)}
                        className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 hover:bg-gray-50 disabled:opacity-60"
                        disabled={actionLoading}
                        title="Mở khóa tài khoản"
                      >
                        <FiUnlock /> Unlock
                      </button>
                    ) : (
                      <button
                        onClick={() => openLock(u)}
                        className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-1.5 text-white hover:bg-red-700 disabled:opacity-60"
                        disabled={actionLoading}
                        title="Khóa tài khoản"
                      >
                        <FiLock /> Lock
                      </button>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {err && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>
      )}

      {/* Modal */}
      <ConfirmModal
        open={!!lockTarget}
        title={`Khóa tài khoản: ${lockTarget?.username}`}
        onCancel={closeLock}
        onConfirm={doLock}
        confirmText="Khóa tài khoản"
        loading={actionLoading}
      >
        <p>Người dùng sẽ không thể đăng nhập cho đến khi bạn mở khóa. Một email thông báo sẽ được gửi cho họ.</p>
        <label className="block text-sm font-medium">Lý do khóa (hiển thị trong email):</label>
        <textarea
          className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
          rows={4}
          placeholder="Ví dụ: Vi phạm chính sách, nghi ngờ hoạt động bất thường…"
          value={lockReason}
          onChange={(e) => setLockReason(e.target.value)}
        />
      </ConfirmModal>
    </div>
  );
}
