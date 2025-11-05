// packages/backend/middleware/activity.tracker.js
import User from "../models/user.model.js";
import jwt from "jsonwebtoken";

export default async function activityTracker(req, res, next) {
  try {
    const auth = req.headers.authorization;
    if (!auth?.startsWith("Bearer ")) return next();

    const token = auth.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded?.sub || decoded?.user_id; // ✅ JWT dùng "sub" khi tạo

    if (!userId) return next();

    // Tìm user (chỉ lấy id và lastActiveAt cho nhanh)
    const user = await User.findByPk(userId, {
      attributes: ["user_id", "lastActiveAt"],
    });
    if (!user) return next();

    const now = new Date();
    const last = user.lastActiveAt ? new Date(user.lastActiveAt) : null;

    // chỉ update nếu đã qua ít nhất 1 phút kể từ lần cuối
    if (!last || now - last > 60 * 1000) {
      await user.update({
        lastActiveAt: now,
        status: "ACTIVE", // ✅ mỗi request coi như hoạt động
      });
    }

    next();
  } catch (err) {
    // Không log lỗi token invalid để tránh spam console
    next();
  }
}
