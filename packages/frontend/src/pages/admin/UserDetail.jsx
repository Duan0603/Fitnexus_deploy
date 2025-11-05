// packages/frontend/src/pages/admin/AdminUserDetail.jsx
import React, { useEffect, useMemo, useState } from "react";
import { FiUserPlus, FiRefreshCw } from "react-icons/fi";
import { useAuth } from "../../context/auth.context.jsx";
import api, { endpoints } from "../../lib/api.js";

/* ---------- Modal tạo admin phụ ---------- */
function CreateSubAdminModal({ open, onClose, onCreated, disabled }) {
  const [form, setForm] = useState({ email: "", username: "", password: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) setForm({ email: "", username: "", password: "" });
  }, [open]);

  if (!open) return null;

  const canSubmit =
    !disabled &&
    !!form.email &&
    !!form.username &&
    !!form.password &&
    !loading;

  const submit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    try {
      await api.post(endpoints.admin.createSubAdmin, form);
      onCreated?.();
      onClose();
    } catch (e) {
      alert(e?.response?.data?.message || "Tạo admin phụ thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-[480px] rounded-xl bg-white p-5 shadow-xl">
        <h3 className="mb-3 text-lg font-semibold">Tạo admin phụ</h3>

        {disabled && (
          <div className="mb-4 rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
            Bạn không có quyền tạo admin phụ (chỉ admin chính).
          </div>
        )}

        <div className="space-y-3">
          <input
            className="w-full rounded-lg border px-3 py-2 text-sm"
            placeholder="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            disabled={disabled}
          />
          <input
            className="w-full rounded-lg border px-3 py-2 text-sm"
            placeholder="Username"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            disabled={disabled}
          />
          <input
            className="w-full rounded-lg border px-3 py-2 text-sm"
            placeholder="Password"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            disabled={disabled}
          />
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border px-4 py-2 hover:bg-gray-50">
            Hủy
          </button>
          <button
            onClick={submit}
            disabled={!canSubmit}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? "Đang tạo…" : "Tạo"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Trang User Detail (danh sách admin phụ) ---------- */
export default function AdminUserDetail() {
  const { user } = useAuth();

  const [items, setItems] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [openCreate, setOpenCreate] = useState(false);
  const [page, setPage] = useState(0);
  const limit = 20;

  // Phòng thủ nếu user chưa có hoặc thiếu field
  const isSuperAdmin = (user?.role === "ADMIN") && (user?.isSuperAdmin === true);

  const query = useMemo(() => ({ limit, offset: page * limit }), [page]);

  async function fetchSubAdmins() {
    setLoading(true);
    try {
      const res = await api.get(endpoints.admin.listSubAdmins, { params: query });
      const data = res?.data?.data || {};
      const rows = Array.isArray(data.rows) ? data.rows.filter(Boolean) : [];
      setItems(rows);
      setCount(Number(data.count ?? rows.length ?? 0));
    } catch (e) {
      setItems([]);
      setCount(0);
      alert(e?.response?.data?.message || "Không tải được danh sách admin phụ");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSubAdmins();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const totalPages = Math.max(1, Math.ceil(count / limit));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">User Detail</h1>
        <div className="flex gap-2">
          <button
            onClick={fetchSubAdmins}
            className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
            title="Làm mới"
            disabled={loading}
          >
            <FiRefreshCw /> Refresh
          </button>

          <button
            onClick={() => setOpenCreate(true)}
            disabled={!isSuperAdmin}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-white disabled:opacity-60 disabled:cursor-not-allowed bg-blue-600 hover:bg-blue-700"
            title={isSuperAdmin ? "Tạo admin phụ" : "Bạn không có quyền tạo admin phụ"}
          >
            <FiUserPlus /> Tạo admin phụ
          </button>
        </div>
      </div>

      <div className="rounded-lg border bg-white p-3 shadow-sm">
        <div className="mb-3 text-sm text-gray-600">
          Đang đăng nhập: <b>{user?.email ?? "-"}</b> — Role: <b>{user?.role ?? "-"}</b>
          {user?.role === "ADMIN" ? (user?.isSuperAdmin ? " (ADMIN CHÍNH)" : " (ADMIN PHỤ)") : ""}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                <th className="px-4 py-3">Username</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Parent Admin ID</th>
                <th className="px-4 py-3">Created at</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                    Đang tải…
                  </td>
                </tr>
              )}

              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                    Chưa có admin phụ
                  </td>
                </tr>
              )}

              {!loading &&
                items.filter(Boolean).map((u) => (
                  <tr key={u?.user_id ?? Math.random()} className="border-t">
                    <td className="px-4 py-3 font-medium">{u?.username ?? "-"}</td>
                    <td className="px-4 py-3">{u?.email ?? "-"}</td>
                    <td className="px-4 py-3">{u?.isSuperAdmin ? "SUPER_ADMIN" : (u?.role ?? "-")}</td>
                    <td className="px-4 py-3">{u?.parentAdminId ?? "-"}</td>
                    <td className="px-4 py-3">
                      {u?.created_at ? new Date(u.created_at).toLocaleString() : "-"}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
          <span>Tổng cộng: {count}</span>
          <div className="flex items-center gap-2">
            <button
              className="rounded border px-2 py-1 disabled:opacity-50"
              disabled={page <= 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              ← Prev
            </button>
            <span>
              Trang {page + 1}/{totalPages}
            </span>
            <button
              className="rounded border px-2 py-1 disabled:opacity-50"
              disabled={page + 1 >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            >
              Next →
            </button>
          </div>
        </div>
      </div>

      <CreateSubAdminModal
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        onCreated={fetchSubAdmins}
        disabled={!isSuperAdmin}
      />
    </div>
  );
}
