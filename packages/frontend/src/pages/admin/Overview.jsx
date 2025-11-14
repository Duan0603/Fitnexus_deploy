import React, { useEffect, useMemo, useState } from 'react';
import { getAdminOverviewMetrics } from '../../lib/api.js';
import { Users, Activity, DollarSign, AlertTriangle } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

function Card({ title, value, icon: Icon, accent = 'bg-blue-500', deltaAbs = null, deltaPct = null, compareLabel = '' }) {
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
      {deltaAbs !== null && (
        <div className="mt-2 text-xs">
          {(() => {
            const up = Number(deltaAbs) > 0;
            const down = Number(deltaAbs) < 0;
            const arrow = up ? '↑' : down ? '↓' : '→';
            const color = up ? 'text-emerald-600' : down ? 'text-rose-600' : 'text-gray-500';
            const pctStr = deltaPct === null || Number.isNaN(deltaPct) ? '' : ` (${Number(deltaPct).toFixed(0)}%)`;
            const absStr = (Number(deltaAbs) > 0 ? '+' : '') + Number(deltaAbs).toLocaleString('vi-VN');
            return (
              <span className={`inline-flex items-center gap-1 ${color}`}>
                <span>{arrow}</span>
                <span className="font-medium">{absStr}{pctStr}</span>
                {compareLabel ? <span className="text-gray-500"> {compareLabel}</span> : null}
              </span>
            );
          })()}
        </div>
      )}
    </div>
  );
}

export default function AdminOverview() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await getAdminOverviewMetrics();
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

  const toVnd = (v) => `${Number(v||0).toLocaleString('vi-VN')} ₫`;
  const cards = useMemo(() => {
    const c = data?.cards || {};
    return [
      {
        title: 'Tổng người dùng',
        value: c.users_total ?? '-',
        deltaAbs: c.users_total_delta ?? null,
        deltaPct: c.users_total_pct ?? null,
        compareLabel: 'so với tuần trước',
        icon: Users,
        accent: 'bg-indigo-600',
      },
      {
        title: 'Đang hoạt động (5 phút)',
        value: c.users_active_5m ?? '-',
        deltaAbs: c.users_active_5m_delta ?? null,
        deltaPct: c.users_active_5m_pct ?? null,
        compareLabel: 'so với 5 phút trước',
        icon: Activity,
        accent: 'bg-emerald-600',
      },
      {
        title: 'Doanh thu hôm nay',
        value: toVnd(c.revenue_today ?? 0),
        deltaAbs: c.revenue_today_delta ?? null,
        deltaPct: c.revenue_today_pct ?? null,
        compareLabel: 'so với hôm qua',
        icon: DollarSign,
        accent: 'bg-amber-600',
      },
      {
        title: 'Doanh thu tuần',
        value: toVnd(c.revenue_week ?? 0),
        deltaAbs: c.revenue_week_delta ?? null,
        deltaPct: c.revenue_week_pct ?? null,
        compareLabel: 'so với tuần trước',
        icon: DollarSign,
        accent: 'bg-sky-600',
      },
      {
        title: 'Doanh thu tháng',
        value: toVnd(c.revenue_month ?? 0),
        deltaAbs: c.revenue_month_delta ?? null,
        deltaPct: c.revenue_month_pct ?? null,
        compareLabel: 'so với tháng trước',
        icon: DollarSign,
        accent: 'bg-rose-600',
      },
    ];
  }, [data]);

  const newUsersData = data?.charts?.new_users_by_day || [];
  const revenueByMonth = data?.charts?.revenue_by_month || [];
  const retention = data?.charts?.retention_cohort_1m || [];

  const alerts = data?.alerts || {};
  const pendingTop = alerts?.pending_transactions?.top || [];

  return (
    <div className="p-2 sm:p-4">
      <h1 className="text-xl font-semibold mb-1">Admin Dashboard</h1>
      <p className="text-gray-600 mb-4">Tổng quan hệ thống và cảnh báo quan trọng.</p>

      {loading && (
        <div className="rounded-md border bg-white p-6 text-center">Đang tải dữ liệu...</div>
      )}
      {error && !loading && (
        <div className="rounded-md border border-rose-200 bg-rose-50 text-rose-700 p-4">{error}</div>
      )}

      {!loading && !error && (
        <>
          {/* Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            {cards.map((c) => (
              <Card key={c.title} title={c.title} value={c.value} icon={c.icon} accent={c.accent} />
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            {/* New users over time */}
            <div className="rounded-lg border bg-white p-4 shadow-sm xl:col-span-1">
              <div className="mb-2 font-medium">Người dùng mới (14 ngày)</div>
              <div style={{ width: '100%', height: 240 }}>
                <ResponsiveContainer>
                  <LineChart data={newUsersData} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} tickMargin={6} />
                    <YAxis allowDecimals={false} width={36} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Revenue by month */}
            <div className="rounded-lg border bg-white p-4 shadow-sm xl:col-span-1">
              <div className="mb-2 font-medium">Doanh thu theo tháng</div>
              <div style={{ width: '100%', height: 240 }}>
                <ResponsiveContainer>
                  <BarChart data={revenueByMonth} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} tickMargin={6} />
                    <YAxis allowDecimals={false} width={48} tickFormatter={(v)=>v.toLocaleString('vi-VN')} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(v)=>Number(v).toLocaleString('vi-VN')} />
                    <Bar dataKey="revenue" fill="#10b981" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Retention */}
            <div className="rounded-lg border bg-white p-4 shadow-sm xl:col-span-1">
              <div className="mb-2 font-medium">Retention 1 tháng theo cohort</div>
              <div style={{ width: '100%', height: 240 }}>
                <ResponsiveContainer>
                  <LineChart data={retention} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="cohort" tick={{ fontSize: 12 }} tickMargin={6} />
                    <YAxis allowDecimals={false} domain={[0, 100]} width={36} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(v)=>`${v}%`} />
                    <Line type="monotone" dataKey="retention_rate" stroke="#f59e0b" strokeWidth={2} dot={{ r: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Alerts */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mt-6">
            <div className="rounded-lg border bg-white p-4 shadow-sm xl:col-span-2">
              <div className="mb-3 flex items-center gap-2 font-medium">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                Thông báo quan trọng
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                <div className="rounded-md border p-3">
                  <div className="text-sm text-gray-500">Giao dịch pending</div>
                  <div className="text-lg font-semibold">{alerts?.pending_transactions?.count ?? 0}</div>
                </div>
                <div className="rounded-md border p-3">
                  <div className="text-sm text-gray-500">Tài khoản bị khóa</div>
                  <div className="text-lg font-semibold">{alerts?.locked_users?.count ?? 0}</div>
                </div>
                <div className="rounded-md border p-3">
                  <div className="text-sm text-gray-500">Premium sắp hết hạn (7 ngày)</div>
                  <div className="text-lg font-semibold">{alerts?.upcoming_premium_expiry_7d?.count ?? 0}</div>
                </div>
              </div>

              {pendingTop?.length > 0 && (
                <div>
                  <div className="text-sm text-gray-500 mb-2">Giao dịch pending quá 24h gần đây</div>
                  <div className="divide-y">
                    {pendingTop.map((tx) => (
                      <div key={tx.transaction_id} className="py-2 flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-amber-500 rounded-full" />
                          <div>
                            <div className="font-medium">{tx.userTransaction?.username || tx.userTransaction?.email || 'user'}</div>
                            <div className="text-gray-500">#{tx.transaction_id} • {new Date(tx.created_at).toLocaleString('vi-VN')}</div>
                          </div>
                        </div>
                        <div className="font-semibold">{Number(tx.amount || 0).toLocaleString('vi-VN')} đ</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Legend/help */}
            <div className="rounded-lg border bg-white p-4 shadow-sm">
              <div className="mb-2 font-medium">Gợi ý thao tác nhanh</div>
              <ul className="text-sm text-gray-600 list-disc pl-5 space-y-1">
                <li>Kiểm tra trang Doanh thu để xem chi tiết giao dịch.</li>
                <li>Vào Users để xử lý khóa/mở khóa tài khoản.</li>
                <li>Liên hệ người dùng pending quá 24h để hỗ trợ thanh toán.</li>
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

