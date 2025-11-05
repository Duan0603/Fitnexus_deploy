import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/auth.context.jsx";
import { getAdminUsers, patchUserPlan } from "../../lib/api.js";
import { Pencil } from "lucide-react";

const PLANS = ["FREE", "PREMIUM"];
const ACTIVE_WINDOW_MIN = 5;

export default function Plan() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const currentPlan = (searchParams.get("plan") || "ALL").toUpperCase();

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(20);
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [savingId, setSavingId] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminUsers({
        limit,
        offset,
        search,
        plan: currentPlan !== "ALL" ? currentPlan : undefined,
      });
      setItems(res?.data?.items || []);
      setTotal(res?.data?.total || 0);
    } catch (e) {
      setError(e?.response?.data || { message: e.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit, offset, currentPlan]);

  const onSearch = (e) => {
    e.preventDefault();
    setOffset(0);
    load();
  };

  const handleUpdatePlan = async (id, newPlan) => {
    try {
      setSavingId(id);
      await patchUserPlan(id, newPlan);
      setEditingId(null);
      await load();
    } catch (e) {
      alert(e?.response?.data?.message || "Update plan failed");
    } finally {
      setSavingId(null);
    }
  };

  const getActivityStatus = (u) => {
    if (String(u.status || "").toUpperCase() === "BANNED") return "BANNED";
    if (!u.lastActiveAt) return "INACTIVE";
    const last = new Date(u.lastActiveAt);
    const diffMin = (Date.now() - last.getTime()) / (1000 * 60);
    return diffMin <= ACTIVE_WINDOW_MIN ? "ACTIVE" : "INACTIVE";
  };

  const StatusBadge = ({ user }) => {
    const s = getActivityStatus(user);
    const cls =
      s === "ACTIVE"
        ? "bg-green-100 text-green-800"
        : s === "BANNED"
        ? "bg-red-100 text-red-800"
        : "bg-yellow-100 text-yellow-800";
    const lastSeen = user.lastActiveAt
      ? new Date(user.lastActiveAt).toLocaleString()
      : "N/A";
    return (
      <span
        title={`Last active: ${lastSeen}`}
        className={`px-2 py-1 rounded-full text-xs font-medium ${cls}`}
      >
        {s}
      </span>
    );
  };

  const page = Math.floor(offset / limit) + 1;
  const pages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Plan</h1>
      <div className="text-sm text-gray-600 mb-4">
        Logged in as: {user?.username} ({user?.role})
      </div>

      <form className="flex gap-2 mb-4" onSubmit={onSearch}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search username or email"
          className="border rounded px-3 py-2 w-80"
        />
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
          Search
        </button>
      </form>

      {error && <div className="mb-3 text-red-600 text-sm">{error.message}</div>}
      <div className="mb-3 text-sm text-gray-600">Total: {total}</div>

      <div className="overflow-x-auto border rounded">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-2">ID</th>
              <th className="text-left p-2">Username</th>
              <th className="text-left p-2">Email</th>
              <th className="text-left p-2">Plan</th>
              <th className="text-left p-2">Status</th>
              <th className="text-left p-2">Last Active</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="p-3" colSpan={6}>Loading...</td></tr>
            ) : items.length === 0 ? (
              <tr><td className="p-3" colSpan={6}>No users</td></tr>
            ) : (
              items.map((u) => (
                <tr key={u.user_id} className="border-t">
                  <td className="p-2">{u.user_id}</td>
                  <td className="p-2">{u.username}</td>
                  <td className="p-2">{u.email}</td>
                  <td className="p-2">
                    {editingId === u.user_id ? (
                      <div className="flex gap-2">
                        {PLANS.map((p) => (
                          <button
                            key={p}
                            disabled={savingId === u.user_id}
                            onClick={() => handleUpdatePlan(u.user_id, p)}
                            className={`px-2 py-1 rounded border ${
                              u.plan === p
                                ? "bg-blue-600 text-white"
                                : "bg-gray-100 hover:bg-gray-200"
                            }`}
                          >
                            {p}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="text-gray-400 hover:text-red-600"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span>{u.plan}</span>
                        <button
                          onClick={() => setEditingId(u.user_id)}
                          className="text-gray-500 hover:text-blue-600"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="p-2"><StatusBadge user={u} /></td>
                  <td className="p-2">
                    {u.lastActiveAt ? new Date(u.lastActiveAt).toLocaleString() : "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
