// packages/backend/controllers/admin.controller.js
import { Op, fn, col, literal } from "sequelize";
import { sequelize } from "../config/database.js";
import User from "../models/user.model.js";
import PasswordReset from "../models/passwordReset.model.js";
import Exercise from "../models/exercise.model.js";
import ExerciseFavorite from "../models/exercise.favorite.model.js";
import {
  sendMail,
  lockEmailTemplate,
  unlockEmailTemplate,
} from "../utils/mailer.js";

/**
 * POST /api/admin/users/:id/lock
 * Body: { reason }
 */
export async function lockUser(req, res) {
  try {
    const userId = req.params.id;
    const { reason } = req.body || {};

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.isLocked) {
      return res.json({
        success: true,
        message: "User already locked",
        data: { user: safeUser(user) },
      });
    }

    await user.update({
      isLocked: true,
      lockedAt: new Date(),
      lockReason: reason || null,
    });

    // gửi email khi bị khóa (không chặn response nếu lỗi)
    if (user.email) {
      const tpl = lockEmailTemplate({
        fullName: user.fullName,
        reason: reason,
      });
      sendMail({ to: user.email, ...tpl }).catch((e) =>
        console.warn("lock mail error:", e?.message)
      );
    }

    return res.json({
      success: true,
      message: "User locked successfully",
      data: { user: safeUser(user) },
    });
  } catch (err) {
    console.error("Admin lockUser error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

/**
 * PATCH /api/admin/users/:id/unlock
 */
export async function unlockUser(req, res) {
  try {
    const userId = req.params.id;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (!user.isLocked) {
      return res.json({
        success: true,
        message: "User already unlocked",
        data: { user: safeUser(user) },
      });
    }

    await user.update({ isLocked: false, lockedAt: null, lockReason: null });

    // gửi email khi mở khóa (không chặn response nếu lỗi)
    if (user.email) {
      const tpl = unlockEmailTemplate({ fullName: user.fullName });
      sendMail({ to: user.email, ...tpl }).catch((e) =>
        console.warn("unlock mail error:", e?.message)
      );
    }

    return res.json({
      success: true,
      message: "User unlocked successfully",
      data: { user: safeUser(user) },
    });
  } catch (err) {
    console.error("Admin unlockUser error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

/**
 * GET /api/admin/users
 * Query: limit, offset, search, plan(FREE|PREMIUM), role(USER|TRAINER|ADMIN)
 * Trả về trạng thái hiển thị theo hoạt động gần nhất:
 * - ACTIVE: lastActiveAt trong cửa sổ ACTIVE_WINDOW_MS (mặc định 5 phút)
 * - INACTIVE: ngược lại

 */
export async function listUsers(req, res) {
  try {
    const limitRaw = parseInt(req.query.limit ?? "50", 10);
    const offsetRaw = parseInt(req.query.offset ?? "0", 10);
    const limit = Math.min(Math.max(1, isNaN(limitRaw) ? 50 : limitRaw), 200);
    const offset = Math.max(0, isNaN(offsetRaw) ? 0 : offsetRaw);

    const search = String(req.query.search ?? "").trim();
    const planRaw = String(req.query.plan ?? "").trim().toUpperCase();
    const roleRaw = String(req.query.role ?? "").trim().toUpperCase();
    const where = {};
    const iLikeOp =
      typeof sequelize?.getDialect === "function" &&
      sequelize.getDialect() === "postgres"
        ? Op.iLike
        : Op.like;

    if (search) {
      where[Op.or] = [
        { username: { [iLikeOp]: `%${search}%` } },
        { email: { [iLikeOp]: `%${search}%` } },
      ];
    }
    if (["FREE", "PREMIUM"].includes(planRaw)) where.plan = planRaw;
    if (["USER", "TRAINER", "ADMIN"].includes(roleRaw)) where.role = roleRaw;

    const { rows, count } = await User.findAndCountAll({
      where,
      limit,
      offset,
      order: [["created_at", "DESC"]],
      attributes: [
        "user_id",
        "username",
        "email",
        "role",
        "plan",
        "user_type",
        "user_exp_date",
        "status",        // trạng thái DB (không dùng để hiển thị)
        "lastLoginAt",
        "lastActiveAt",  // dùng tính trạng thái hiển thị
        "isLocked",
        "lockReason",
        "lockedAt",
        "created_at",
        "updated_at",
        [
          sequelize.literal(`(
            SELECT COUNT(*) 
            FROM workout_plans 
            WHERE workout_plans.creator_id = "User".user_id
          )`),
          'total_plans'
        ],
        [
          sequelize.literal(`(
            SELECT COUNT(*) 
            FROM workout_plans 
            WHERE workout_plans.creator_id = "User".user_id
              AND workout_plans.is_public = true
          )`),
          'has_public_plans'
        ],
      ],
    });

    const ACTIVE_WINDOW_MS = Number(process.env.ACTIVE_WINDOW_MS || 5 * 60 * 1000);
    const now = Date.now();

    const items = rows.map((u) => {
      const json = u.toJSON();
      const lastActiveTs = json.lastActiveAt ? new Date(json.lastActiveAt).getTime() : 0;
      const activityStatus =
        lastActiveTs && (now - lastActiveTs) < ACTIVE_WINDOW_MS ? "ACTIVE" : "INACTIVE";

      return {
        user_id: json.user_id,
        username: json.username,
        email: json.email,
        role: json.role,
        plan: json.plan,
        user_type: json.user_type,
        user_exp_date: json.user_exp_date,
        total_plans: Number(json.total_plans) || 0,
        has_public_plans: Boolean(Number(json.has_public_plans)),
        status: activityStatus,      // dùng cho cột STATUS bên FE
        lastLoginAt: json.lastLoginAt,
        lastActiveAt: json.lastActiveAt,
        isLocked: json.isLocked,
        lockReason: json.lockReason,
        lockedAt: json.lockedAt,
        created_at: json.created_at,
        updated_at: json.updated_at,
      };
    });

    return res.json({
      success: true,
      data: { items, total: count, limit, offset },
    });
  } catch (err) {
    console.error("Admin listUsers error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

/**
 * GET /api/admin/users/stats
 * Returns totals for filters: role, plan, status (ACTIVE within ACTIVE_WINDOW_MS)
 */
export async function getUsersStats(req, res) {
  try {
    const ACTIVE_WINDOW_MS = Number(process.env.ACTIVE_WINDOW_MS || 5 * 60 * 1000);
    const dialect = typeof sequelize?.getDialect === 'function' ? sequelize.getDialect() : 'postgres';

    if (dialect === 'postgres') {
      const activeMinutes = Math.max(1, Math.floor(ACTIVE_WINDOW_MS / (60 * 1000)));
      const [rows] = await sequelize.query(
        `SELECT
            COUNT(*) AS total,
            COUNT(*) FILTER (WHERE role = 'ADMIN')   AS admin_count,
            COUNT(*) FILTER (WHERE role = 'TRAINER') AS trainer_count,
            COUNT(*) FILTER (WHERE role = 'USER')    AS user_count,
            COUNT(*) FILTER (WHERE plan = 'PREMIUM') AS premium_count,
            COUNT(*) FILTER (WHERE plan = 'FREE')    AS free_count,
            COUNT(*) FILTER (
              WHERE last_active_at IS NOT NULL AND last_active_at >= NOW() - INTERVAL '${activeMinutes} minutes'
            ) AS active_count
         FROM users`
      );
      const r = rows?.[0] || {};
      const total = Number(r.total || 0);
      const active = Number(r.active_count || 0);
      return res.json({
        success: true,
        data: {
          total,
          role: {
            ADMIN: Number(r.admin_count || 0),
            TRAINER: Number(r.trainer_count || 0),
            USER: Number(r.user_count || 0),
          },
          plan: {
            PREMIUM: Number(r.premium_count || 0),
            FREE: Number(r.free_count || 0),
          },
          status: {
            ACTIVE: active,
            INACTIVE: Math.max(0, total - active),
          },
        },
      });
    }

    // Fallback: generic SQL without FILTER (may be less efficient)
    const [[{ total }]] = await sequelize.query(`SELECT COUNT(*)::int AS total FROM users`);
    const [[{ admin }]] = await sequelize.query(`SELECT COUNT(*)::int AS admin FROM users WHERE role = 'ADMIN'`);
    const [[{ trainer }]] = await sequelize.query(`SELECT COUNT(*)::int AS trainer FROM users WHERE role = 'TRAINER'`);
    const [[{ simple_user }]] = await sequelize.query(`SELECT COUNT(*)::int AS simple_user FROM users WHERE role = 'USER'`);
    const [[{ premium }]] = await sequelize.query(`SELECT COUNT(*)::int AS premium FROM users WHERE plan = 'PREMIUM'`);
    const [[{ free }]] = await sequelize.query(`SELECT COUNT(*)::int AS free FROM users WHERE plan = 'FREE'`);
    const minutes = Math.max(1, Math.floor(ACTIVE_WINDOW_MS / (60 * 1000)));
    const [[{ active }]] = await sequelize.query(`SELECT COUNT(*)::int AS active FROM users WHERE last_active_at IS NOT NULL AND last_active_at >= datetime('now', '-${minutes} minutes')`);
    return res.json({
      success: true,
      data: {
        total: Number(total || 0),
        role: { ADMIN: Number(admin||0), TRAINER: Number(trainer||0), USER: Number(simple_user||0) },
        plan: { PREMIUM: Number(premium||0), FREE: Number(free||0) },
        status: { ACTIVE: Number(active||0), INACTIVE: Math.max(0, Number(total||0) - Number(active||0)) },
      },
    });
  } catch (err) {
    console.error('Admin getUsersStats error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}


/**
 * GET /api/admin/popular-exercises
 * Query: limit, offset, search
 * Trả về danh sách các bài tập có lượt yêu thích (favorite_count) giảm dần
 */
export async function getPopularExercises(req, res) {
  try {
    const limitRaw = parseInt(req.query.limit ?? "50", 10);
    const offsetRaw = parseInt(req.query.offset ?? "0", 10);
    const limit = Math.min(Math.max(1, isNaN(limitRaw) ? 50 : limitRaw), 200);
    const offset = Math.max(0, isNaN(offsetRaw) ? 0 : offsetRaw);

    const search = String(req.query.search ?? "").trim();

    const iLikeOp =
      typeof sequelize?.getDialect === "function" && sequelize.getDialect() === "postgres"
        ? Op.iLike
        : Op.like;

    const exerciseWhere = {};
    if (search) {
      exerciseWhere[Op.or] = [
        { name: { [iLikeOp]: `%${search}%` } },
        { name_en: { [iLikeOp]: `%${search}%` } },
        { slug: { [iLikeOp]: `%${search}%` } },
      ];
    }

    // Query exercises joined with favorites and count favorites
    const items = await Exercise.findAll({
      where: exerciseWhere,
      include: [
        {
          model: ExerciseFavorite,
          as: 'favorites',
          attributes: [],
          required: false,
        },
      ],
      attributes: [
        'exercise_id',
        'name',
        'name_en',
        'slug',
        'thumbnail_url',
        [fn('COUNT', col('favorites.favorite_id')), 'favorite_count'],
      ],
      group: ['Exercise.exercise_id', 'Exercise.name', 'Exercise.name_en', 'Exercise.slug', 'Exercise.thumbnail_url'],
      having: literal('COUNT(favorites.favorite_id) > 0'),
      order: [[literal('favorite_count'), 'DESC']],
      limit,
      offset,
      subQuery: false,
    });

    // Total count (distinct exercises with favorites and matching search)
    const totalRows = await Exercise.count({
      where: exerciseWhere,
      include: [
        {
          model: ExerciseFavorite,
          as: 'favorites',
          attributes: [],
          required: true, // Chỉ đếm bài tập có yêu thích
        },
      ],
      distinct: true,
      col: 'exercise_id'
    });

    const resultItems = items.map((e) => {
      const json = e.toJSON();
      return {
        exercise_id: json.exercise_id,
        name: json.name,
        name_en: json.name_en,
        slug: json.slug,
        thumbnail_url: json.thumbnail_url,
        favorite_count: Number(json.favorite_count || 0),
      };
    });

    return res.json({ success: true, data: { items: resultItems, total: totalRows, limit, offset } });
  } catch (err) {
    console.error('Admin getPopularExercises error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}


export async function updateUserRole(req, res) {
  try {
    const userId = req.params.id;
    const nextRole = String(req.body.role ?? "").trim().toUpperCase();

    if (!["USER", "TRAINER", "ADMIN"].includes(nextRole)) {
      return res.status(422).json({ success: false, message: "Invalid role" });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.role = nextRole;
    await user.save({ fields: ["role"] });

    return res.json({
      success: true,
      message: "Role updated",
      data: { user: safeUser(user) },
    });
  } catch (err) {
    console.error("Admin updateUserRole error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}


export async function updateUserPlan(req, res) {
  try {
    const userId = req.params.id;
    const nextPlan = String(req.body.plan ?? "").trim().toUpperCase();
    const durationDays = req.body.duration_days ? parseInt(req.body.duration_days, 10) : null;

    if (!["FREE", "PREMIUM"].includes(nextPlan)) {
      return res.status(422).json({ success: false, message: "Invalid plan" });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const fieldsToUpdate = ["plan", "user_type", "user_exp_date"];
    user.plan = nextPlan;

    if (nextPlan === "PREMIUM") {
      user.user_type = 'premium';
      const days = durationDays !== null && durationDays > 0 ? durationDays : 30; // Default 30 days
      const newExpDate = new Date();
      newExpDate.setDate(newExpDate.getDate() + days);
      user.user_exp_date = newExpDate;
    } else { // FREE
      user.user_type = 'free';
      user.user_exp_date = null;
    }

    await user.save({ fields: fieldsToUpdate });

    // Send email when upgraded to PREMIUM
    if (user.plan === 'PREMIUM' && user.email) {
      try {
        const expStr = user.user_exp_date ? new Date(user.user_exp_date).toLocaleDateString() : '';
        await sendMail({
          to: user.email,
          subject: 'Tài khoản đã được nâng cấp Premium',
          html: `<p>Xin chào ${user.fullName || user.username || 'bạn'},</p>
                 <p>Tài khoản của bạn đã được nâng cấp lên <b>Premium</b>${expStr ? ` tới ngày <b>${expStr}</b>` : ''}.</p>
                 <p>Cảm ơn bạn đã ủng hộ FitNexus!</p>`,
          text: `Tai khoan cua ban da duoc nang cap Premium${expStr ? ` toi ngay ${expStr}` : ''}. Cam on ban da ung ho FitNexus!`,
        });
      } catch (e) {
        console.warn('send premium mail (admin.updateUserPlan) error:', e?.message);
      }
    }

    return res.json({
      success: true,
      message: "Plan updated successfully",
      data: { user: safeUser(user) },
    });
  } catch (err) {
    console.error("Admin updateUserPlan error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}


export async function resetPassword(req, res) {
  try {
    const { userId } = req.params;
    const { newPassword, confirmPassword } = req.body;

    if (!newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "newPassword & confirmPassword are required",
      });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: "Passwords do not match" });
    }

    const strong =
      newPassword.length >= 8 &&
      /[A-Z]/.test(newPassword) &&
      /[a-z]/.test(newPassword) &&
      /\d/.test(newPassword) &&
      /[\W_]/.test(newPassword);

    if (!strong) {
      return res.status(400).json({
        success: false,
        message:
          "Password too weak (min 8, cần chữ hoa, chữ thường, số, ký tự đặc biệt)",

      });
    }

    const result = await sequelize.transaction(async (t) => {
      const user = await User.findOne({
        where: { user_id: Number(userId) },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (!user) return { ok: false, message: "User not found" };

      user.set("passwordHash", newPassword);
      user.changed("passwordHash", true);
      await user.save({ transaction: t });

      await PasswordReset.create(
        {
          user_id: Number(userId),
          token_hash: "ADMIN_RESET",
          expires_at: sequelize.fn("NOW"),
          used_at: sequelize.fn("NOW"),
          created_at: sequelize.fn("NOW"),

        },
        { transaction: t }
      );

      return { ok: true };
    });

    if (!result.ok) {
      return res.status(400).json({ success: false, message: result.message });
    }

    return res.json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (err) {
    console.error("Admin resetPassword error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

/**
 * Helper: chỉ lấy field an toàn để trả về
 */
function safeUser(user) {
  return {
    user_id: user.user_id,
    username: user.username,
    email: user.email,
    role: user.role,
    plan: user.plan,
    status: user.status,           // status ở DB (không dùng để hiển thị ACTIVE/INACTIVE)
    lastLoginAt: user.lastLoginAt,
    lastActiveAt: user.lastActiveAt,
    isLocked: user.isLocked,
    lockReason: user.lockReason,
    lockedAt: user.lockedAt,
    created_at: user.created_at,
    updated_at: user.updated_at,
  };
}
