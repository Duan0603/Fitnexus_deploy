import React, { useEffect, useMemo, useState } from "react";
import api from "../../lib/api";
import {
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ComposedChart,
  Bar,
  Line,
  LabelList,
} from "recharts";

/* ===== helpers (ngoài component OK) ===== */
const rankMeta = (rank) => {
  switch (rank) {
    case 1:
      return { medal: "🥇", row: "bg-amber-50", text: "text-amber-700" };
    case 2:
      return { medal: "🥈", row: "bg-slate-50", text: "text-slate-700" };
    case 3:
      return { medal: "🥉", row: "bg-orange-50", text: "text-orange-700" };
    default:
      return { medal: "", row: "", text: "" };
  }
};

const nf = new Intl.NumberFormat("vi-VN");
const moneyShort = (v) => {
  const n = Number(v || 0);
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return nf.format(n);
};
const monthLabel = (i) => `Tháng ${i + 1}`;
const df = (d) => new Date(d).toLocaleDateString("vi-VN");

const usernameOf = (o) => o?.user_username ?? o?.username ?? o?.userTransaction?.username ?? "—";
const fullnameOf = (o) => o?.user_full_name ?? o?.full_name ?? o?.userTransaction?.full_name ?? "—";
const emailOf = (o) => o?.user_email ?? o?.email ?? o?.userTransaction?.email ?? "—";

/* ===== Page ===== */
export default function AdminRevenue() {
  const [transactions, setTransactions] = useState([]);
  const [topUsers, setTopUsers] = useState([]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [includePending, setIncludePending] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [tx, top] = await Promise.all([
          api.get("/api/admin/revenue/transactions"),
          api.get("/api/admin/revenue/top-users"),
        ]);
        setTransactions(Array.isArray(tx.data) ? tx.data : []);
        setTopUsers(Array.isArray(top.data) ? top.data : []);
      } catch (err) {
        console.error("Finance fetch error:", err);
      }
    })();
  }, []);

  /* ===== Build monthly series ===== */
  const monthly = useMemo(() => {
    const arr = Array.from({ length: 12 }, (_, i) => ({
      monthIdx: i,
      month: monthLabel(i),
      total: 0,
      count: 0,
    }));

    for (const t of transactions) {
      if (!t?.created_at) continue;
      const d = new Date(t.created_at);
      if (d.getFullYear() !== Number(year)) continue;

      const m = d.getMonth();
      const isCompleted = t.status === "completed";
      const isPending = t.status === "pending";

      if (isCompleted || (includePending && isPending)) {
        arr[m].total += Number(t.amount || 0);
        arr[m].count += 1;
      }
    }
    return arr;
  }, [transactions, year, includePending]);

  const totalYearRevenue = useMemo(
    () => monthly.reduce((s, x) => s + x.total, 0),
    [monthly]
  );

  const moneyMax = Math.max(...monthly.map((m) => m.total), 0);
  const moneyDomain = [0, moneyMax > 0 ? Math.ceil(moneyMax * 1.15) : 4];

  const years = useMemo(() => {
    const a = [];
    for (let y = 2017; y <= 2028; y++) a.push(y);
    return a;
  }, []);

  /* ===== Top ranked (PHẢI ở trong component) ===== */
  const topRanked = useMemo(() => {
    const arr = (Array.isArray(topUsers) ? topUsers : [])
      .slice()
      .sort((a, b) => Number(b.total_spent || 0) - Number(a.total_spent || 0));
    return arr.map((u, i) => ({ ...u, __rank: i + 1 }));
  }, [topUsers]);

  return (
    <div className="space-y-8">
      {/* Header + controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Doanh thu và số lượng đơn hàng từng tháng</h2>
        <div className="flex items-center gap-4">
          <label className="text-sm flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includePending}
              onChange={(e) => setIncludePending(e.target.checked)}
            />
            <span>Bao gồm pending</span>
          </label>
          <span className="text-sm text-gray-600">
            Tổng doanh thu: <b>{nf.format(totalYearRevenue)} ₫</b>
          </span>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="border rounded-md px-2 py-1 text-sm"
            aria-label="Chọn năm"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Chart */}
      <div className="h-72 bg-white shadow rounded-xl p-4">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={monthly}
            barCategoryGap={18}
            maxBarSize={36}
            margin={{ top: 8, right: 32, bottom: 8, left: 64 }} // đẩy plot sang phải
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />

            {/* Trục trái: VND (label ở ngoài, không đè tick) */}
            <YAxis
              yAxisId="money"
              domain={moneyDomain}
              tickFormatter={moneyShort}
              tickMargin={8}
              label={{ value: "VND", angle: -90, position: "left", offset: 24 }}
            />

            {/* Trục phải: Số đơn (outside) */}
            <YAxis
              yAxisId="count"
              orientation="right"
              allowDecimals={false}
              tickMargin={8}
              label={{ value: "Số đơn", angle: -90, position: "right", offset: 24 }}
            />

            <Tooltip
              formatter={(value, name) =>
                name === "Tổng doanh thu" ? nf.format(value) + " ₫" : value
              }
            />
            <Legend />

            {/* Bar: revenue */}
            <Bar
              yAxisId="money"
              dataKey="total"
              name="Tổng doanh thu"
              fill="#f97316"
              stroke="#f97316"
              minPointSize={2}
            >
              <LabelList
                dataKey="total"
                position="top"
                content={({ x, y, value }) =>
                  x == null || y == null ? null : (
                    <text x={x} y={y - 6} textAnchor="middle" fontSize={12} fill="#f97316">
                      {moneyShort(value)}
                    </text>
                  )
                }
              />
            </Bar>

            {/* Line: order count */}
            <Line
              yAxisId="count"
              type="monotone"
              dataKey="count"
              name="Tổng số đơn"
              stroke="#334155"
              strokeWidth={3}
              dot={{ r: 4, fill: "#334155" }}
              activeDot={{ r: 6 }}
            />
            <LabelList
              dataKey="count"
              content={({ x, y, value }) =>
                x == null || y == null ? null : (
                  <text x={x} y={y - 10} textAnchor="middle" fontSize={12} fill="#334155">
                    {value}
                  </text>
                )
              }
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* ===== Top người nạp tiền ===== */}
      <div className="bg-white shadow rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">🏆 Top người nạp tiền</h3>
          {topRanked.length > 0 && (
            <span className="text-sm text-gray-500">Tổng {topRanked.length} người</span>
          )}
        </div>

        <table className="w-full text-sm">
          <thead className="border-b font-semibold">
            <tr>
              <th className="text-left w-20">Hạng</th>
              <th className="text-left">Username</th>
              <th className="text-left">Tên người dùng</th>
              <th className="text-left">Email</th>
              <th className="text-right">Tổng tiền (VNĐ)</th>
            </tr>
          </thead>
          <tbody>
            {topRanked.length ? (
              topRanked.map((u) => {
                const username = usernameOf(u);
                const fullname = fullnameOf(u);
                const email = emailOf(u);
                const total = Number(u.total_spent || 0);
                const { medal, row, text } = rankMeta(u.__rank);

                return (
                  <tr key={u.user_id ?? `${email}-${total}`} className={`border-b ${row}`}>
                    <td className={`py-2 font-bold ${text}`}>
                      <div className="inline-flex items-center gap-2">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white shadow">
                          {u.__rank}
                        </span>
                        <span className="text-base">{medal}</span>
                      </div>
                    </td>
                    <td className="py-2">{username}</td>
                    <td className="py-2">{fullname}</td>
                    <td className="py-2">{email}</td>
                    <td className={`py-2 text-right font-semibold ${text}`}>{nf.format(total)}</td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="5" className="text-center py-4 text-gray-400">
                  Chưa có giao dịch hoàn tất
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Danh sách giao dịch */}
      <div className="bg-white shadow rounded-xl p-4">
        <h3 className="font-semibold mb-2">💰 Danh sách giao dịch</h3>
        <table className="w-full text-sm table-fixed">
          <colgroup>
            <col className="w-1/5" />
            <col className="w-1/5" />
            <col className="w-1/5" />
            <col className="w-1/6" />
            <col className="w-1/6" />
            <col className="w-1/6" />
          </colgroup>
          <thead className="border-b font-semibold">
            <tr>
              <th className="text-left px-4 py-2">Username</th>
              <th className="text-left px-4 py-2">Tên người dùng</th>
              <th className="text-left px-4 py-2">Gói</th>
              <th className="text-right px-4 py-2">Số tiền</th>
              <th className="text-center px-4 py-2">Trạng thái</th>
              <th className="text-left px-4 py-2">Ngày tạo</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length ? (
              transactions.map((t) => {
                const username = usernameOf(t);
                const fullname = fullnameOf(t);
                const plan = t.plan_name ?? t.planTransaction?.name ?? "—";
                const amount = Number(t.amount || 0);
                const statusClass =
                  t.status === "completed"
                    ? "bg-green-100 text-green-700"
                    : "bg-yellow-100 text-yellow-700";
                return (
                  <tr key={t.transaction_id ?? `${username}-${plan}-${t.created_at}`} className="border-b">
                    <td className="px-4 py-2">{username}</td>
                    <td className="px-4 py-2">{fullname}</td>
                    <td className="px-4 py-2">{plan}</td>
                    <td className="px-4 py-2 text-right">{nf.format(amount)}</td>
                    <td className="px-4 py-2 text-center">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusClass}`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-4 py-2">{t.created_at ? df(t.created_at) : "—"}</td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="6" className="text-center py-4 text-gray-400">Chưa có giao dịch</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
