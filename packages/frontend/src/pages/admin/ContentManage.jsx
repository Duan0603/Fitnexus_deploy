import React, { useEffect, useMemo, useState } from 'react';
import { getContentOverviewMetrics } from '../../lib/api.js';
import { Dumbbell, Eye, EyeOff, Clock } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';

function Card({ title, value, icon: Icon, accent = 'bg-slate-700' }) {
  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`h-10 w-10 ${accent} text-white rounded-md flex items-center justify-center`}>
          {Icon ? <Icon className="h-5 w-5" /> : null}
        </div>
        <div>
          <div className="text-sm text-gray-500">{title}</div>
          <div className="text-xl font-semibold">{value}</div>
        </div>
      </div>
    </div>
  );
}

const COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444', '#06b6d4', '#a855f7', '#84cc16', '#eab308', '#f97316', '#22c55e'];

export default function AdminContentManage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await getContentOverviewMetrics();
        if (!mounted) return;
        if (res?.success) setData(res.data);
        else setError(res?.message || 'Không lấy được dữ liệu');
      } catch (e) {
        if (!mounted) return;
        setError(e?.message || 'Lỗi tải dữ liệu');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const cards = useMemo(() => {
    const c = data?.cards || {};
    return [
      { title: 'Tổng số bài tập', value: c.total ?? '-', icon: Dumbbell, accent: 'bg-indigo-600' },
      { title: 'Đã được duyệt', value: c.approved ?? '-', icon: Eye, accent: 'bg-emerald-600' },
      { title: 'Đang chờ duyệt', value: c.pending ?? 0, icon: Clock, accent: 'bg-amber-600' },
      { title: 'Bị ẩn', value: c.hidden ?? 0, icon: EyeOff, accent: 'bg-rose-600' },
    ];
  }, [data]);

  const additions = data?.charts?.additions_by_month || [];
  const topUsed = data?.charts?.top_used || [];
  const topRated = data?.charts?.top_rated || [];
  const byGroup = data?.charts?.by_muscle_group || [];

  return (
    <div className="p-2 sm:p-4">
      <h1 className="text-xl font-semibold mb-1">Content Overview</h1>
      <p className="text-gray-600 mb-4">Thống kê tổng quan về bài tập.</p>

      {loading && (
        <div className="rounded-md border bg-white p-6 text-center">Đang tải dữ liệu...</div>
      )}
      {error && !loading && (
        <div className="rounded-md border border-rose-200 bg-rose-50 text-rose-700 p-4">{error}</div>
      )}

      {!loading && !error && (
        <>
          {/* Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {cards.map((c) => (
              <Card key={c.title} title={c.title} value={c.value} icon={c.icon} accent={c.accent} />
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {/* Additions by month */}
            <div className="rounded-lg border bg-white p-4 shadow-sm">
              <div className="mb-2 font-medium">Bài tập được thêm theo tháng</div>
              <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer>
                  <LineChart data={additions} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} tickMargin={6} />
                    <YAxis allowDecimals={false} width={36} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top used */}
            <div className="rounded-lg border bg-white p-4 shadow-sm">
              <div className="mb-2 font-medium">Top 10 bài tập được dùng nhiều</div>
              <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer>
                  <BarChart data={topUsed} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="name" hide tick={{ fontSize: 12 }} tickMargin={6} />
                    <YAxis allowDecimals={false} width={36} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="used_count" fill="#10b981" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <ul className="mt-2 list-decimal list-inside text-sm text-gray-700 space-y-1">
                {topUsed.map((x, idx) => (
                  <li key={x.exercise_id || idx}>{x.name} <span className="text-gray-500">({x.used_count})</span></li>
                ))}
              </ul>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-4">
            {/* Top rated (popularity_score) */}
            <div className="rounded-lg border bg-white p-4 shadow-sm">
              <div className="mb-2 font-medium">Bài tập có “rating” cao (popularity_score)</div>
              <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer>
                  <BarChart data={topRated} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="name" hide />
                    <YAxis allowDecimals={false} width={36} />
                    <Tooltip />
                    <Bar dataKey="popularity_score" fill="#f59e0b" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <ul className="mt-2 list-decimal list-inside text-sm text-gray-700 space-y-1">
                {topRated.map((x, idx) => (
                  <li key={x.exercise_id || idx}>{x.name} <span className="text-gray-500">({x.popularity_score})</span></li>
                ))}
              </ul>
            </div>

            {/* By muscle group (proxy: exercise_type) */}
            <div className="rounded-lg border bg-white p-4 shadow-sm">
              <div className="mb-2 font-medium">Bài tập theo nhóm (exercise_type)</div>
              <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={byGroup} dataKey="count" nameKey="label" outerRadius={100} label>
                      {byGroup.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {data?.notes?.pending && (
            <div className="mt-4 text-xs text-gray-500">Ghi chú: {data.notes.pending}</div>
          )}
          {data?.notes?.by_muscle_group && (
            <div className="text-xs text-gray-500">{data.notes.by_muscle_group}</div>
          )}
        </>
      )}
    </div>
  );
}

