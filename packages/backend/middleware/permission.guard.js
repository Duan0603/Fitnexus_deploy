// packages/backend/middleware/permission.guard.js
import { can } from '../config/rbac.policy.js';
import User from '../models/user.model.js';
import jwt from 'jsonwebtoken';
import { ensureActiveSubscription } from '../services/subscription.service.js';

/**
 * Chuẩn hóa role/plan về lowercase theo policy
 */
function normalizeRole(role, isSuperAdmin = false) {
  if (!role) return 'guest';
  const r = String(role).toLowerCase();
  if (r === 'admin' && isSuperAdmin) return 'super_admin';
  // map uppercase enums (USER/TRAINER/ADMIN) if any
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

async function resolveUserFromReq(req) {
  // Nếu middleware trước đã gắn đầy đủ user
  if (req.user && (req.user.id || req.user.user_id)) {
    const role = req.user.role;
    const plan = req.user.plan;
    const user_type = req.user.user_type;
    const isSuperAdmin = !!req.user.isSuperAdmin;
    await ensureActiveSubscription(req.user);
    return { role, plan, user_type, isSuperAdmin };
  }

  // Nếu auth.guard đã gắn userRole/userId
  const userId = req.userId || null;
  let role = req.userRole || null;
  let plan = null;
  let user_type = null;
  let isSuperAdmin = false;

  // Thử lấy từ JWT nếu chưa có userId
  if (!userId) {
    try {
      const header = req.get('authorization') || req.get('Authorization') || '';
      const [scheme, token] = header.split(' ');
      if (scheme === 'Bearer' && token) {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        const id = payload?.sub || payload?.userId || payload?.id || null;
        role = payload?.role || role;
        if (id) {
          const u = await User.findByPk(id);
          if (u) {
            await ensureActiveSubscription(u);
            return { role: u.role, plan: u.plan, user_type: u.user_type, isSuperAdmin: !!u.isSuperAdmin };
          }
        }
      }
    } catch (_) {}
  }

  if (userId && (role == null || plan == null)) {
    try {
      const u = await User.findByPk(userId);
      if (u) {
        await ensureActiveSubscription(u);
        role = u.role;
        plan = u.plan;
        user_type = u.user_type;
        isSuperAdmin = !!u.isSuperAdmin;
      }
    } catch (_) {}
  }

  return { role, plan, user_type, isSuperAdmin };
}

/**
 * Middleware kiểm tra xem user's role có permission được yêu cầu hay không.
 * @param {string} requiredPermission - Permission cần có, ví dụ 'manage:users'
 */
const permissionGuard = (requiredPermission) => async (req, res, next) => {
  try {
    const { role, plan, user_type, isSuperAdmin } = await resolveUserFromReq(req);

    if (!role) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Xử lý logic cho "premium_user" (virtual role)
    const normalizedRole = normalizeRole(role, isSuperAdmin);
    const normalizedPlan = normalizePlan(user_type || plan);

    let effectiveRole = normalizedRole;
    if (normalizedRole === 'user' && normalizedPlan === 'premium') {
      effectiveRole = 'premium_user';
    }

    if (can(effectiveRole, requiredPermission)) {
      return next();
    }

    return res.status(403).json({ message: 'Forbidden' });
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error' });
  }
};
export const verifyAdmin = permissionGuard("admin:access");
export default permissionGuard;
