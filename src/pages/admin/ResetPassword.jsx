// src/pages/admin/AdminResetPassword.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { getToken } from '../../lib/tokenManager.js';

export default function AdminResetPassword() {
  // List users
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(20);
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState('');
  const [loadingList, setLoadingList] = useState(false);
  const [listErr, setListErr] = useState(null);

  // Modal state
  const [selected, setSelected] = useState(null); // { user_id, username, ... }
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);

  const validPw = useMemo(() => {
    return (
      newPassword.length >= 8 &&
      /[A-Z]/.test(newPassword) &&
      /[a-z]/.test(newPassword) &&
      /\d/.test(newPassword) &&
      /[\W_]/.test(newPassword)
    );
  }, [newPassword]);

  async function loadUsers(opts = {}) {
    const token = getToken();
    if (!token) {
      setListErr('Missing admin token');
      return;
    }
    setLoadingList(true);
    setListErr(null);
    try {
      const q = new URLSearchParams({
        limit: String(opts.limit ?? limit),
        offset: String(opts.offset ?? offset),
        search: (opts.search ?? search).trim(),
      });
      const res = await fetch(`/api/admin/users?${q.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Load users failed');
      setItems(data.data.items || []);
      setTotal(data.data.total || 0);
      setLimit(data.data.limit || 20);
      setOffset(data.data.offset || 0);
    } catch (e) {
      setListErr(e.message || 'Load users failed');
    } finally {
      setLoadingList(false);
    }
  }

  useEffect(() => { loadUsers(); /* eslint-disable-next-line */ }, []);

  async function handleReset() {
    if (!selected) return;
    setErr(null); setMsg(null);

    if (!newPassword || !confirmPassword) {
      setErr('All fields required');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErr('Passwords do not match');
      return;
    }
    if (!validPw) {
      setErr('Password too weak (min 8, 1 upper, 1 lower, 1 digit, 1 special)');
      return;
    }

    setSaving(true);
    try {
      const token = getToken();
      if (!token) throw new Error('Missing admin token');
      const res = await fetch(`/api/admin/users/${selected.user_id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ newPassword, confirmPassword }),
      });
      const raw = await res.text();
      let data = null;
      try { data = raw ? JSON.parse(raw) : null; } catch {}
      if (!res.ok) throw new Error(data?.message || raw || `Request failed (${res.status})`);

      setMsg(data?.message || 'Password reset successfully');
      setTimeout(() => {
        setSelected(null);
        setNewPassword('');
        setConfirmPassword('');
      }, 600);
    } catch (e) {
      setErr(e.message || 'Request failed');
    } finally {
      setSaving(false);
    }
  }

  const canPrev = offset > 0;
  const canNext = offset + limit < total;

  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold mb-4">User Manage – Reset Password</h1>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <input
          className="border rounded px-3 py-2 w-64"
          placeholder="Search username or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && loadUsers({ search, offset: 0 })}
        />
        <button
          onClick={() => loadUsers({ search, offset: 0 })}
          className="px-3 py-2 border rounded hover:bg-gray-50"
        >
          Search
        </button>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-gray-500">
            {total ? `Showing ${offset + 1}–${Math.min(offset + limit, total)} of ${total}` : '—'}
          </span>
          <button
            disabled={!canPrev}
            onClick={() => {
              const next = Math.max(0, offset - limit);
              setOffset(next);
              loadUsers({ offset: next });
            }}
            className="px-3 py-2 border rounded disabled:opacity-50"
          >
            Prev
          </button>
          <button
            disabled={!canNext}
            onClick={() => {
              const next = offset + limit;
              setOffset(next);
              loadUsers({ offset: next });
            }}
            className="px-3 py-2 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      {/* List */}
      <div className="overflow-auto border rounded">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-3 py-2 border">ID</th>
              <th className="px-3 py-2 border">Username</th>
              <th className="px-3 py-2 border">Email</th>
              <th className="px-3 py-2 border">Role</th>
              <th className="px-3 py-2 border">Plan</th>
              <th className="px-3 py-2 border w-40">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loadingList ? (
              <tr>
                <td className="px-3 py-4 text-center" colSpan={6}>Loading…</td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td className="px-3 py-4 text-center" colSpan={6}>No users</td>
              </tr>
            ) : (
              items.map((u) => (
                <tr key={u.user_id}>
                  <td className="px-3 py-2 border">{u.user_id}</td>
                  <td className="px-3 py-2 border">{u.username}</td>
                  <td className="px-3 py-2 border">{u.email}</td>
                  <td className="px-3 py-2 border">{u.role}</td>
                  <td className="px-3 py-2 border">{u.plan}</td>
                  <td className="px-3 py-2 border">
                    <button
                      onClick={() => { setSelected(u); setMsg(null); setErr(null); }}
                      className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                    >
                      Reset password
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {listErr && <p className="mt-2 text-red-600">{listErr}</p>}

      {/* Modal Reset */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl">
            <h2 className="text-lg font-semibold mb-1">Reset password</h2>
            <p className="text-sm text-gray-600 mb-4">
              User: <b>{selected.username}</b> — {selected.email} (ID: {selected.user_id})
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                  placeholder="New password"
                  autoComplete="new-password"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Must include: uppercase, lowercase, number, special character.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Confirm password"
                  autoComplete="new-password"
                />
              </div>
            </div>

            {msg && <p className="mt-3 text-green-600">{msg}</p>}
            {err && <p className="mt-3 text-red-600">{err}</p>}

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => {
                  setSelected(null);
                  setNewPassword('');
                  setConfirmPassword('');
                  setMsg(null);
                  setErr(null);
                }}
                className="px-3 py-2 border rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                disabled={saving}
                className="px-3 py-2 bg-blue-600 text-white rounded disabled:opacity-60"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
