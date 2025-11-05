// packages/backend/controllers/adminSub.controller.js
import User from "../models/user.model.js";

/**
 * Lấy current user an toàn từ req; nếu thiếu thì fetch DB.
 */
async function getCurrentAdmin(req) {
  // nếu authGuard đã gắn sẵn
  if (req.user && req.user.user_id) return req.user;

  // nếu chỉ có userId trên req (phổ biến)
  if (req.userId) {
    const u = await User.findByPk(req.userId, {
      attributes: [
        "user_id",
        "email",
        "username",
        "role",
        "isSuperAdmin",
        "parentAdminId",
        "status",
      ],
    });
    return u;
  }

  return null;
}

export async function listSubAdmins(req, res, next) {
  try {
    const me = await getCurrentAdmin(req);
    if (!me) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    if (me.role !== "ADMIN") {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const limit = Number(req.query.limit) || 20;
    const offset = Number(req.query.offset) || 0;

    // Admin chính → xem sub-admin do MÌNH tạo
    // Admin phụ  → xem các sub-admin cùng parent với mình
    const parentFilter = me.isSuperAdmin ? me.user_id : (me.parentAdminId ?? -1);

    const where = {
      role: "ADMIN",
      isSuperAdmin: false,
      parentAdminId: parentFilter,
    };

    const { rows, count } = await User.findAndCountAll({
      where,
      limit,
      offset,
      order: [["created_at", "DESC"]],
      attributes: [
        "user_id",
        "email",
        "username",
        "role",
        "isSuperAdmin",
        "parentAdminId",
        "created_at",
      ],
    });

    res.json({ success: true, data: { rows, count } });
  } catch (err) {
    next(err);
  }
}

export async function createSubAdmin(req, res, next) {
  try {
    const me = await getCurrentAdmin(req);
    if (!me) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    if (!(me.role === "ADMIN" && me.isSuperAdmin)) {
      return res.status(403).json({ success: false, message: "Chỉ admin chính được tạo admin phụ" });
    }

    const { email, username, password } = req.body || {};
    if (!email || !username || !password) {
      return res.status(400).json({ success: false, message: "Thiếu email/username/password" });
    }

    const existed =
      (await User.findOne({ where: { email } })) ||
      (await User.findOne({ where: { username } }));
    if (existed) {
      return res.status(409).json({ success: false, message: "Email hoặc username đã tồn tại" });
    }

    const u = await User.create({
      email,
      username,
      passwordHash: password, // hook model sẽ hash
      role: "ADMIN",
      isSuperAdmin: false,
      parentAdminId: me.user_id,
      status: "ACTIVE",
    });

    res.status(201).json({
      success: true,
      data: {
        user_id: u.user_id,
        email: u.email,
        username: u.username,
        role: u.role,
        isSuperAdmin: u.isSuperAdmin,
        parentAdminId: u.parentAdminId,
      },
    });
  } catch (err) {
    next(err);
  }
}
