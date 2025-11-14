import Notification from "../models/notification.model.js";

export async function listNotifications(req, res) {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
    const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);
    const status = String(req.query.status || "").toLowerCase();

    const where = { user_id: req.userId };
    if (status === "unread") {
      where.read_at = null;
    }

    const { rows, count } = await Notification.findAndCountAll({
      where,
      order: [["created_at", "DESC"]],
      limit,
      offset,
    });

    const unread = await Notification.count({ where: { user_id: req.userId, read_at: null } });

    return res.json({
      success: true,
      data: {
        items: rows,
        total: count,
        unread,
        limit,
        offset,
      },
    });
  } catch (err) {
    console.error("listNotifications error:", err);
    return res.status(500).json({ success: false, message: "Không thể tải thông báo" });
  }
}

export async function markNotificationRead(req, res) {
  try {
    const notification = await Notification.findByPk(req.params.id);
    if (!notification || notification.user_id !== req.userId) {
      return res.status(404).json({ success: false, message: "Không tìm thấy thông báo" });
    }
    if (!notification.read_at) {
      notification.read_at = new Date();
      await notification.save();
    }
    return res.json({ success: true, data: notification });
  } catch (err) {
    console.error("markNotificationRead error:", err);
    return res.status(500).json({ success: false, message: "Không thể cập nhật thông báo" });
  }
}

export async function markAllNotificationsRead(req, res) {
  try {
    await Notification.update(
      { read_at: new Date() },
      { where: { user_id: req.userId, read_at: null } }
    );
    return res.json({ success: true });
  } catch (err) {
    console.error("markAllNotificationsRead error:", err);
    return res.status(500).json({ success: false, message: "Không thể cập nhật thông báo" });
  }
}
