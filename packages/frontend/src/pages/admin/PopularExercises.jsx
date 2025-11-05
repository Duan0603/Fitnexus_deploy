import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/auth.context.jsx';
import { getAdminPopularExercises } from '../../lib/api.js';

export default function AdminPopularExercises() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(20);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await getAdminPopularExercises({ limit, offset, search });
      setItems(res?.data?.items || []);
      setTotal(res?.data?.total || 0);
    } catch (e) {
      console.error('Load popular exercises error', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [limit, offset]);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Admin - Bài tập được yêu thích</h1>
      <div className="mb-4 text-sm text-gray-600">Logged in as: {user?.username} ({user?.role})</div>

      <form onSubmit={(e) => { e.preventDefault(); setOffset(0); load(); }} className="mb-4 flex gap-2">
        <input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Tìm bài tập" className="px-3 py-2 border rounded" />
        <button className="px-4 py-2 bg-blue-600 text-white rounded">Tìm</button>
      </form>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div>
          <div className="mb-2 text-sm text-gray-600">Tổng: {total} kết quả</div>
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left">#</th>
                <th className="px-4 py-2 text-left">Tên</th>
                <th className="px-4 py-2 text-left">Slug</th>
                <th className="px-4 py-2 text-left">Thumbnail</th>
                <th className="px-4 py-2 text-left">Yêu thích</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) => (
                <tr key={it.exercise_id} className="border-t">
                  <td className="px-4 py-2">{offset + idx + 1}</td>
                  <td className="px-4 py-2">{it.name}</td>
                  <td className="px-4 py-2">{it.slug}</td>
                  <td className="px-4 py-2">
                    {it.thumbnail_url ? <img src={it.thumbnail_url} alt={it.name} className="h-12" /> : '—'}
                  </td>
                  <td className="px-4 py-2">{it.favorite_count}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 flex items-center gap-2">
            <button disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - limit))} className="px-3 py-1 border rounded">Prev</button>
            <button disabled={offset + limit >= total} onClick={() => setOffset(offset + limit)} className="px-3 py-1 border rounded">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
