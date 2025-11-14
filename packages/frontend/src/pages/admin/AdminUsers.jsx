// src/pages/admin/AdminUsers.jsx (Unified)
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../context/auth.context.jsx";
import api, { getAdminUsers, getAdminUsersStats } from "../../lib/api.js";
import {
  Plus,
  Search,
  Filter,
  Download,
  Edit,
  Lock,
  Trash2,
  MoreVertical,
} from "lucide-react";

const AUTORELOAD_SEC = 30;

export default function AdminUsers() {
  const { user } = useAuth();

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(20);
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("ALL");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    role: { ADMIN: 0, TRAINER: 0, USER: 0 },
    plan: { FREE: 0, PREMIUM: 0 },
    status: { ACTIVE: 0, INACTIVE: 0 },
  });

  const load = async () => {
    setLoading(true);
    try {
      const res = await getAdminUsers({
        limit,
        offset,
        search: search.trim(),
        plan: planFilter !== "ALL" ? planFilter : undefined,
        role: roleFilter !== "ALL" ? roleFilter : undefined,
      });
      setItems(res?.data?.items || []);
      setTotal(res?.data?.total || 0);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const res = await getAdminUsersStats();
      const d = res?.data || {};
      setStats({
        total: d.total || 0,
        role: d.role || { ADMIN: 0, TRAINER: 0, USER: 0 },
        plan: d.plan || { FREE: 0, PREMIUM: 0 },
        status: d.status || { ACTIVE: 0, INACTIVE: 0 },
      });
    } catch {}
  };

  useEffect(() => {
    load();
  }, [limit, offset, planFilter, roleFilter]);
  useEffect(() => {
    loadStats();
  }, []);

  // Auto refresh
  const timerRef = useRef(null);
  useEffect(() => {
    timerRef.current = setInterval(() => {
      load();
      loadStats();
    }, AUTORELOAD_SEC * 1000);
    return () => clearInterval(timerRef.current);
  }, [limit, offset, planFilter, roleFilter, search]);

  const onSearch = async (e) => {
    e.preventDefault();
    setOffset(0);
    await load();
  };

  const filteredItems = useMemo(() => {
    if (statusFilter === "ALL") return items;
    return items.filter(
      (u) => String(u.status || "").toUpperCase() === statusFilter
    );
  }, [items, statusFilter]);

  const displayItems =
    filteredItems.length || statusFilter !== "ALL" ? filteredItems : items;
  const displayTotal = statusFilter === "ALL" ? total : filteredItems.length;
  const page = Math.floor(offset / limit) + 1;
  const pages = Math.max(1, Math.ceil(displayTotal / limit));

  const handleDeleteUser = async (userId, username) => {
    if (
      !window.confirm(
        `Bạn có chắc muốn xóa user "${username || userId}"? Hành động này không thể hoàn tác.`
      )
    ) {
      return;
    }

    try {
      setDeletingId(userId);
      const res = await api.delete(`/api/admin/users/${userId}`);
      const data = res?.data;
      if (!data?.success) {
        throw new Error(data?.message || "Delete user failed");
      }
      await load();
      await loadStats();
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Không thể xóa user";
      alert(msg);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="px-6 py-4 mx-auto max-w-7xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                User Management
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Logged in as:{" "}
                <span className="font-medium">{user?.username}</span> (
                {user?.role})
              </p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 text-white transition bg-blue-600 rounded-lg hover:bg-blue-700">
              <Plus size={20} />
              Add User
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 mx-auto max-w-7xl">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-4">
          {[
            { label: "Total Users", value: stats.total, color: "bg-blue-500" },
            {
              label: "Active",
              value: stats.status.ACTIVE,
              color: "bg-green-500",
            },
            {
              label: "Premium",
              value: stats.plan.PREMIUM,
              color: "bg-amber-500",
            },
            { label: "Admins", value: stats.role.ADMIN, color: "bg-red-500" },
          ].map((stat, index) => (
            <div
              key={index}
              className="p-5 bg-white border border-gray-100 rounded-lg shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="mb-1 text-sm text-gray-600">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                </div>
                <div
                  className={`w-12 h-12 ${stat.color} rounded-lg opacity-20`}
                ></div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters Section */}
        <div className="p-5 mb-6 bg-white border border-gray-200 rounded-lg shadow-sm">
          {/* Search Bar */}
          <form onSubmit={onSearch} className="mb-4">
            <div className="relative">
              <Search
                className="absolute text-gray-400 transform -translate-y-1/2 left-3 top-1/2"
                size={20}
              />
              <input
                type="text"
                placeholder="Search by username or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </form>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Filter size={16} />
              <span className="font-medium">Filters:</span>
            </div>

            {/* Role Filter */}
            <div className="relative">
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setOffset(0);
                }}
                className="px-4 py-2 pr-10 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg appearance-none cursor-pointer bg-gray-50 hover:bg-gray-100 focus:ring-2 focus:ring-blue-500"
              >
                {[
                  { value: "ALL", label: "All Roles", count: stats.total },
                  { value: "ADMIN", label: "Admin", count: stats.role.ADMIN },
                  {
                    value: "TRAINER",
                    label: "Trainer",
                    count: stats.role.TRAINER,
                  },
                  { value: "USER", label: "User", count: stats.role.USER },
                ].map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label} ({o.count})
                  </option>
                ))}
              </select>
            </div>

            {/* Plan Filter */}
            <div className="relative">
              <select
                value={planFilter}
                onChange={(e) => {
                  setPlanFilter(e.target.value);
                  setOffset(0);
                }}
                className="px-4 py-2 pr-10 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg appearance-none cursor-pointer bg-gray-50 hover:bg-gray-100 focus:ring-2 focus:ring-blue-500"
              >
                {[
                  { value: "ALL", label: "All Plans", count: stats.total },
                  { value: "FREE", label: "Free", count: stats.plan.FREE },
                  {
                    value: "PREMIUM",
                    label: "Premium",
                    count: stats.plan.PREMIUM,
                  },
                ].map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label} ({o.count})
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 pr-10 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg appearance-none cursor-pointer bg-gray-50 hover:bg-gray-100 focus:ring-2 focus:ring-blue-500"
              >
                {[
                  { value: "ALL", label: "All Status", count: stats.total },
                  {
                    value: "ACTIVE",
                    label: "Active",
                    count: stats.status.ACTIVE,
                  },
                  {
                    value: "INACTIVE",
                    label: "Inactive",
                    count: stats.status.INACTIVE,
                  },
                ].map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label} ({o.count})
                  </option>
                ))}
              </select>
            </div>

            {(roleFilter !== "ALL" ||
              planFilter !== "ALL" ||
              statusFilter !== "ALL" ||
              search) && (
              <button
                onClick={() => {
                  setRoleFilter("ALL");
                  setPlanFilter("ALL");
                  setStatusFilter("ALL");
                  setSearch("");
                  setOffset(0);
                  load();
                }}
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Clear all
              </button>
            )}

            {/* Export Button */}
            <button
              onClick={() => {
                const rows = displayItems.length ? displayItems : items;
                const header = [
                  "ID",
                  "Username",
                  "Email",
                  "Role",
                  "Plan",
                  "Status",
                  "Created",
                ];
                const csv = [header.join(",")]
                  .concat(
                    rows.map((u) =>
                      [
                        u.user_id,
                        u.username,
                        u.email,
                        u.role,
                        u.plan,
                        u.status,
                        u.created_at,
                      ]
                        .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
                        .join(",")
                    )
                  )
                  .join("\n");
                const blob = new Blob([csv], {
                  type: "text/csv;charset=utf-8;",
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "users.csv";
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="flex items-center gap-2 px-3 py-2 ml-auto text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Download size={16} />
              Export
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-xs font-semibold tracking-wider text-left text-gray-600 uppercase">
                    ID
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold tracking-wider text-left text-gray-600 uppercase">
                    Username
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold tracking-wider text-left text-gray-600 uppercase">
                    Email
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold tracking-wider text-left text-gray-600 uppercase">
                    Role
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold tracking-wider text-left text-gray-600 uppercase">
                    Plan
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold tracking-wider text-left text-gray-600 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold tracking-wider text-right text-gray-600 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-6 text-sm text-center text-gray-500"
                    >
                      Loading...
                    </td>
                  </tr>
                ) : displayItems.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-6 text-sm text-center text-gray-500"
                    >
                      No users found
                    </td>
                  </tr>
                ) : (
                  displayItems.map((u) => (
                    <tr key={u.user_id} className="transition hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {u.user_id}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {u.username}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {u.email}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            u.role === "ADMIN"
                              ? "bg-red-100 text-red-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {u.plan}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            String(u.status).toUpperCase() === "ACTIVE"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            className="p-1.5 hover:bg-gray-100 rounded transition"
                            title="Edit"
                          >
                            <Edit size={16} className="text-gray-600" />
                          </button>
                          <button
                            className="p-1.5 hover:bg-gray-100 rounded transition"
                            title="Lock/Unlock"
                          >
                            <Lock size={16} className="text-gray-600" />
                          </button>
                          <button
                            className="p-1.5 hover:bg-gray-100 rounded transition"
                            title="Delete"
                            disabled={deletingId === u.user_id}
                            onClick={() => handleDeleteUser(u.user_id, u.username)}
                          >
                            <Trash2
                              size={16}
                              className={`text-red-600 ${
                                deletingId === u.user_id ? "opacity-50" : ""
                              }`}
                            />
                          </button>
                          <button
                            className="p-1.5 hover:bg-gray-100 rounded transition"
                            title="More"
                          >
                            <MoreVertical size={16} className="text-gray-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Showing{" "}
              <span className="font-medium">
                {Math.min(displayTotal, offset + 1)}
              </span>
              -
              <span className="font-medium">
                {Math.min(displayTotal, offset + displayItems.length)}
              </span>{" "}
              of <span className="font-medium">{displayTotal}</span> users
            </div>
            <div className="flex items-center gap-2">
              <button
                className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                disabled={offset === 0}
                onClick={() => setOffset(Math.max(0, offset - limit))}
              >
                Previous
              </button>
              <span className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded">
                {page}
              </span>
              <button
                className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                disabled={offset + limit >= total}
                onClick={() => setOffset(offset + limit)}
              >
                Next
              </button>
              <select
                className="px-2 py-1 ml-2 text-sm border border-gray-300 rounded"
                value={limit}
                onChange={(e) => {
                  setLimit(parseInt(e.target.value, 10));
                  setOffset(0);
                }}
              >
                {[10, 20, 50, 100].map((n) => (
                  <option key={n} value={n}>
                    {n}/page
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
