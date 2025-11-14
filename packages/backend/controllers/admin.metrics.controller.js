import { Op } from "sequelize";
import { sequelize } from '../config/database.js';
import db from '../models/initModels.js';

const sDay = (d=new Date()) => { const x=new Date(d); x.setHours(0,0,0,0); return x; };
const sWeek = () => { const d=new Date(); const g=(d.getDay()+6)%7; d.setDate(d.getDate()-g); d.setHours(0,0,0,0); return d; };
const sMonth = (d=new Date()) => { const x=new Date(d); x.setDate(1); x.setHours(0,0,0,0); return x; };
const addM = (d,n)=>{ const x=new Date(d); x.setMonth(x.getMonth()+n); return x; };
const fmtD = (d)=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const fmtM = (d)=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;

export async function getOverviewMetrics(_req, res) {
  try {
    const dialect =
      typeof sequelize?.getDialect === "function"
        ? sequelize.getDialect()
        : "postgres";

    const ACTIVE_MS = Number(process.env.ACTIVE_WINDOW_MS || 5 * 60 * 1000);
    const activeSince = new Date(Date.now() - ACTIVE_MS);
    const today = sDay();
    const w0 = sWeek();
    const m0 = sMonth();

    const totalUsers = await db.User.count();
    const activeUsers = await db.User.count({
      where: { lastActiveAt: { [Op.gte]: activeSince } },
    });
    const sum = (where) => db.Transaction.sum("amount", { where });
    const [revToday, revWeek, revMonth] = await Promise.all([
      sum({ status: "completed", created_at: { [Op.gte]: today } }),
      sum({ status: "completed", created_at: { [Op.gte]: w0 } }),
      sum({ status: "completed", created_at: { [Op.gte]: m0 } }),
    ]);

    // Previous periods for comparisons
    const y0 = new Date(today);
    y0.setDate(y0.getDate() - 1);
    const wPrev0 = new Date(w0);
    wPrev0.setDate(wPrev0.getDate() - 7);
    const mPrev0 = new Date(m0);
    mPrev0.setMonth(mPrev0.getMonth() - 1);

    const [
      usersPrevWeekTotal,
      activeUsersPrevWindow,
      revYesterday,
      revPrevWeek,
      revPrevMonth,
    ] = await Promise.all([
      // total users at end of previous week (users created before current week start)
      db.User.count({ where: { created_at: { [Op.lt]: w0 } } }),
      // active users previous 5m window
      db.User.count({
        where: {
          lastActiveAt: {
            [Op.gte]: new Date(Date.now() - 10 * 60 * 1000),
            [Op.lt]: new Date(Date.now() - 5 * 60 * 1000),
          },
        },
      }),
      // revenues previous day/week/month
      sum({
        status: "completed",
        created_at: { [Op.gte]: y0, [Op.lt]: today },
      }),
      sum({
        status: "completed",
        created_at: { [Op.gte]: wPrev0, [Op.lt]: w0 },
      }),
      sum({
        status: "completed",
        created_at: { [Op.gte]: mPrev0, [Op.lt]: m0 },
      }),
    ]);

    const pct = (cur, prev) =>
      prev && prev !== 0
        ? Math.round(
            ((Number(cur || 0) - Number(prev || 0)) / Number(prev)) * 100
          )
        : null;

    // New users by day (last 14d)
    const days = 14;
    const from = new Date();
    from.setDate(from.getDate() - (days - 1));
    from.setHours(0, 0, 0, 0);
    let newRows = [];
    if (dialect === "postgres") {
      const [rows] = await sequelize.query(
        "SELECT to_char(date_trunc('day', created_at),'YYYY-MM-DD') AS day, COUNT(*)::int AS count FROM users WHERE created_at>=:from GROUP BY 1 ORDER BY 1 ASC",
        { replacements: { from } }
      );
      newRows = rows || [];
    } else {
      const [rows] = await sequelize.query(
        "SELECT strftime('%Y-%m-%d', created_at) AS day, COUNT(*) AS count FROM users WHERE created_at>=:from GROUP BY 1 ORDER BY 1 ASC",
        { replacements: { from: from.toISOString() } }
      );
      newRows = rows || [];
    }
    const mapN = new Map(
      newRows.map((r) => [String(r.day), Number(r.count) || 0])
    );
    const new_users_by_day = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(from);
      d.setDate(from.getDate() + i);
      const k = fmtD(d);
      new_users_by_day.push({ date: k, count: mapN.get(k) || 0 });
    }

    // Revenue by month (last 6m)
    const months = 6;
    const start6 = sMonth(addM(new Date(), -(months - 1)));
    let revRows = [];
    if (dialect === "postgres") {
      const [rows] = await sequelize.query(
        "SELECT to_char(date_trunc('month', created_at),'YYYY-MM') AS ym, SUM(amount)::bigint AS revenue FROM transactions WHERE status='completed' AND created_at>=:s GROUP BY 1 ORDER BY 1 ASC",
        { replacements: { s: start6 } }
      );
      revRows = rows || [];
    } else {
      const [rows] = await sequelize.query(
        "SELECT strftime('%Y-%m', created_at) AS ym, SUM(amount) AS revenue FROM transactions WHERE status='completed' AND created_at>=:s GROUP BY 1 ORDER BY 1 ASC",
        { replacements: { s: start6.toISOString() } }
      );
      revRows = rows || [];
    }
    const mapR = new Map(
      revRows.map((r) => [String(r.ym), Number(r.revenue) || 0])
    );
    const revenue_by_month = [];
    for (let i = 0; i < months; i++) {
      const d = sMonth(addM(start6, i));
      const k = fmtM(d);
      revenue_by_month.push({ month: k, revenue: mapR.get(k) || 0 });
    }

    // Simple 1-month cohort retention for last 4 cohorts
    const cohorts = 4;
    const first = sMonth(addM(new Date(), -cohorts));
    const retention = [];
    for (let i = 0; i < cohorts; i++) {
      const c0 = sMonth(addM(first, i));
      const c1 = sMonth(addM(c0, 1));
      const n1 = sMonth(addM(c1, 1));
      const newUsers = await db.User.count({
        where: { created_at: { [Op.gte]: c0, [Op.lt]: c1 } },
      });
      let retained = 0;
      if (newUsers > 0) {
        const ids = await db.User.findAll({
          where: { created_at: { [Op.gte]: c0, [Op.lt]: c1 } },
          attributes: ["user_id"],
          raw: true,
        });
        const arr = ids.map((u) => u.user_id);
        retained = arr.length
          ? await db.User.count({
              where: {
                user_id: { [Op.in]: arr },
                lastActiveAt: { [Op.gte]: c1, [Op.lt]: n1 },
              },
            })
          : 0;
      }
      retention.push({
        cohort: fmtM(c0),
        new_users: newUsers,
        retained_next_month: retained,
        retention_rate: newUsers ? Math.round((retained * 100) / newUsers) : 0,
      });
    }

    // Alerts
    const now = new Date();
    const pendingOld = new Date(now.getTime() - 86400000);
    const [pendingCount, lockedCount, upcomingExp] = await Promise.all([
      db.Transaction.count({ where: { status: "pending" } }),
      db.User.count({ where: { isLocked: true } }),
      db.User.count({
        where: {
          user_type: "premium",
          user_exp_date: {
            [Op.gte]: now,
            [Op.lte]: new Date(now.getTime() + 7 * 86400000),
          },
        },
      }),
    ]);
    const pendingTop = await db.Transaction.findAll({
      where: { status: "pending", created_at: { [Op.lte]: pendingOld } },
      attributes: ["transaction_id", "amount", "created_at"],
      include: [
        {
          model: db.User,
          as: "userTransaction",
          attributes: ["user_id", "email", "username"],
        },
      ],
      order: [["created_at", "ASC"]],
      limit: 3,
    });

    res.json({
      success: true,
      data: {
        cards: {
          users_total: totalUsers,
          users_total_prev_week: Number(usersPrevWeekTotal || 0),
          users_total_delta:
            Number(totalUsers) - Number(usersPrevWeekTotal || 0),
          users_total_pct: pct(totalUsers, usersPrevWeekTotal || 0),

          users_active_5m: activeUsers,
          users_active_5m_prev_window: Number(activeUsersPrevWindow || 0),
          users_active_5m_delta:
            Number(activeUsers || 0) - Number(activeUsersPrevWindow || 0),
          users_active_5m_pct: pct(activeUsers, activeUsersPrevWindow || 0),

          revenue_today: Number(revToday || 0),
          revenue_today_prev: Number(revYesterday || 0),
          revenue_today_delta:
            Number(revToday || 0) - Number(revYesterday || 0),
          revenue_today_pct: pct(revToday || 0, revYesterday || 0),

          revenue_week: Number(revWeek || 0),
          revenue_week_prev: Number(revPrevWeek || 0),
          revenue_week_delta: Number(revWeek || 0) - Number(revPrevWeek || 0),
          revenue_week_pct: pct(revWeek || 0, revPrevWeek || 0),

          revenue_month: Number(revMonth || 0),
          revenue_month_prev: Number(revPrevMonth || 0),
          revenue_month_delta:
            Number(revMonth || 0) - Number(revPrevMonth || 0),
          revenue_month_pct: pct(revMonth || 0, revPrevMonth || 0),
        },
        charts: {
          new_users_by_day,
          revenue_by_month,
          retention_cohort_1m: retention,
        },
        alerts: {
          pending_transactions: { count: pendingCount, top: pendingTop },
          locked_users: { count: lockedCount },
          upcoming_premium_expiry_7d: { count: upcomingExp },
        },
      },
    });
  } catch (err) {
    console.error("getOverviewMetrics error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}
export async function getContentOverviewMetrics(_req, res) {
  try {
    const dialect =
      typeof sequelize?.getDialect === "function"
        ? sequelize.getDialect()
        : "postgres";

    // Cards
    const [total, approved, hidden] = await Promise.all([
      db.Exercise.count(),
      db.Exercise.count({ where: { is_public: true } }),
      db.Exercise.count({ where: { is_public: false } }),
    ]);
    const pending = 0; // Placeholder until workflow/status field exists

    // Additions over time (last 12 months)
    const months = 12;
    const start12 = new Date();
    start12.setMonth(start12.getMonth() - (months - 1));
    start12.setDate(1);
    start12.setHours(0, 0, 0, 0);

    let addedRows = [];
    if (dialect === "postgres") {
      const [rows] = await sequelize.query(
        "SELECT to_char(date_trunc('month', created_at),'YYYY-MM') AS ym, COUNT(*)::int AS count FROM exercises WHERE created_at >= :s GROUP BY 1 ORDER BY 1 ASC",
        { replacements: { s: start12 } }
      );
      addedRows = rows || [];
    } else {
      const [rows] = await sequelize.query(
        "SELECT strftime('%Y-%m', created_at) AS ym, COUNT(*) AS count FROM exercises WHERE created_at >= :s GROUP BY 1 ORDER BY 1 ASC",
        { replacements: { s: start12.toISOString() } }
      );
      addedRows = rows || [];
    }

    // Normalize months
    const fmtM = (d) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const mapAdd = new Map(
      (addedRows || []).map((r) => [String(r.ym), Number(r.count) || 0])
    );
    const additions_by_month = [];
    for (let i = 0; i < months; i++) {
      const d = new Date(start12);
      d.setMonth(start12.getMonth() + i);
      const key = fmtM(d);
      additions_by_month.push({ month: key, count: mapAdd.get(key) || 0 });
    }

    // Top used exercises (by count in plans)
    const [topUsed] = await sequelize.query(
      "SELECT e.exercise_id, e.name, e.slug, e.thumbnail_url, COUNT(ped.plan_id) AS used_count FROM plan_exercise_details ped JOIN exercises e ON e.exercise_id = ped.exercise_id GROUP BY e.exercise_id, e.name, e.slug, e.thumbnail_url ORDER BY used_count DESC LIMIT 10"
    );

    // Top rated (proxy: popularity_score desc)
    const topRated = await db.Exercise.findAll({
      attributes: [
        "exercise_id",
        "name",
        "slug",
        "thumbnail_url",
        "popularity_score",
      ],
      order: [["popularity_score", "DESC"]],
      limit: 10,
    });

    // By muscle group (proxy: exercise_type)
    let byTypeRows = [];
    if (dialect === "postgres") {
      const [rows] = await sequelize.query(
        "SELECT COALESCE(NULLIF(TRIM(exercise_type), ''), 'Other') AS label, COUNT(*)::int AS count FROM exercises GROUP BY 1 ORDER BY count DESC, label ASC"
      );
      byTypeRows = rows || [];
    } else {
      const [rows] = await sequelize.query(
        "SELECT COALESCE(NULLIF(TRIM(exercise_type), ''), 'Other') AS label, COUNT(*) AS count FROM exercises GROUP BY 1 ORDER BY count DESC, label ASC"
      );
      byTypeRows = rows || [];
    }

    return res.json({
      success: true,
      data: {
        cards: {
          total,
          approved,
          pending,
          hidden,
        },
        charts: {
          additions_by_month,
          top_used: topUsed || [],
          top_rated: (topRated || []).map((x) => (x.toJSON ? x.toJSON() : x)),
          by_muscle_group: byTypeRows || [],
        },
        notes: {
          pending:
            "Pending = 0 (chưa có trạng thái duyệt trong schema, sẽ bổ sung sau)",
          by_muscle_group:
            "Tạm nhóm theo exercise_type do chưa có schema cơ bắp chi tiết",
        },
      },
    });
  } catch (err) {
    console.error("getContentOverviewMetrics error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}
