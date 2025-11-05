import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { sequelize } from '../config/database.js';
import AIUsage from '../models/ai.usage.model.js';
import User from '../models/user.model.js';
import { can } from '../config/rbac.policy.js';

// === START: Quota Configuration ===
const QUOTA_CONFIG = {
  trainer_image_analyze: {
    user: { limit: 3, period: 'day' },
    // premium_user, trainer, admin, etc. are unlimited via RBAC
  },
  default: {
    guest: { limit: 5, period: 'day' },
    user: { limit: 10, period: 'day' },
  }
};
// === END: Quota Configuration ===


function getIsoDateKey(date = new Date()) {
  // Daily period key, e.g., 2025-11-05
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getIsoWeekKey(date = new Date()) {
  // ISO week number, e.g., 2025-W44
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

function getPeriodKey(period, date = new Date()) {
  if (period === 'week') {
    return getIsoWeekKey(date);
  }
  // Default to daily
  return getIsoDateKey(date);
}

function canonicalFeatureKey(raw) {
  return String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 64);
}

function anonKeyFromReq(req) {
  const salt = process.env.AI_QUOTA_SALT || 'dev_salt';
  const ip = req.ip || req.connection?.remoteAddress || '';
  const ua = req.get('user-agent') || '';
  const raw = `${ip}|${ua}|${salt}`;
  return crypto.createHash('sha256').update(raw).digest('hex');
}

async function resolveCaller(req) {
  // Prefer user set by previous auth middleware
  let userId = req.userId || null;
  let role = req.userRole || null;
  let plan = null;
  let user_type = null;
  let isSuperAdmin = false;

  // Try parse JWT if not already available
  if (!userId) {
    try {
      const header = req.get('authorization') || req.get('Authorization') || '';
      const [scheme, token] = header.split(' ');
      if (scheme === 'Bearer' && token) {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        userId = payload?.sub || payload?.userId || payload?.id || null;
        role = payload?.role || role;
      }
    } catch (_) {}
  }

  if (userId && (role == null || plan == null)) {
    try {
      const user = await User.findByPk(userId);
      if (user) {
        role = user.role;
        plan = user.plan;
        user_type = user.user_type;
        isSuperAdmin = !!user.isSuperAdmin;
      }
    } catch (_) {}
  }

  return { userId, role, plan, user_type, isSuperAdmin };
}

function normalizeRole(role, isSuperAdmin = false) {
  if (!role) return 'guest';
  const r = String(role).toLowerCase();
  if (r === 'admin' && isSuperAdmin) return 'super_admin';
  if (role === 'USER') return 'user';
  if (role === 'TRAINER') return 'trainer';
  if (role === 'ADMIN') return isSuperAdmin ? 'super_admin' : 'admin';
  return r;
}

function normalizePlan(plan) {
  if (!plan) return null;
  const p = String(plan).toLowerCase();
  if (plan === 'PREMIUM') return 'premium';
  if (plan === 'FREE') return 'free';
  return p;
}

export default function aiQuota(feature, options = {}) {
  const featureKey = canonicalFeatureKey(feature);
  const enabled = String(process.env.AI_QUOTA_ENABLED ?? '1') !== '0';

  return async function aiQuotaMiddleware(req, res, next) {
    try {
      if (!enabled) return next();

      const { userId, role, plan, user_type, isSuperAdmin } = await resolveCaller(req);

      const normalizedRole = normalizeRole(role, isSuperAdmin);
      const normalizedPlan = normalizePlan(user_type || req.user?.user_type || plan);
      let effectiveRole = normalizedRole;
      if (normalizedRole === 'user' && normalizedPlan === 'premium') {
        effectiveRole = 'premium_user';
      }

      // Bypass for roles that have unlimited permission or wildcard
      if (can(effectiveRole, 'use:ai_trainer:unlimited') || can(effectiveRole, '*')) {
        return next();
      }

      // Determine limit and period from config
      const featureConfig = QUOTA_CONFIG[featureKey] || QUOTA_CONFIG.default;
      const roleConfig = featureConfig[effectiveRole] || featureConfig.default;
      const limit = roleConfig?.limit ?? 5;
      const period = roleConfig?.period ?? 'day';

      const periodKey = getPeriodKey(period);
      const where = { feature: featureKey, period_key: periodKey };
      if (userId) {
        where.user_id = userId;
        where.anon_key = null;
      } else {
        where.user_id = null;
        where.anon_key = anonKeyFromReq(req);
      }

      const t = await sequelize.transaction();
      try {
        let row = await AIUsage.findOne({ where, transaction: t, lock: t.LOCK.UPDATE });
        if (!row) {
          row = await AIUsage.create({ ...where, count: 0 }, { transaction: t });
        }

        if (row.count >= limit) {
          await t.rollback();
          return res.status(429).json({
            success: false,
            code: 'AI_QUOTA_EXCEEDED',
            message: `Daily quota of ${limit} reached for ${featureKey}. Upgrade for unlimited access.`,
          });
        }

        row.count += 1;
        await row.save({ transaction: t, fields: ['count'] });
        await t.commit();
        return next();
      } catch (err) {
        await t.rollback();
        throw err;
      }
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to enforce AI quota', error: err?.message });
    }
  };
}

// For unit tests or external reuse
export const __internals = { getIsoWeekKey, canonicalFeatureKey, anonKeyFromReq };
