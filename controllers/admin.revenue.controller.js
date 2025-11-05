// packages/backend/controllers/admin.revenue.controller.js
import db from "../models/initModels.js";
import { Op, fn, col, literal } from "sequelize";

/* === Danh sách giao dịch: chỉ lấy completed & pending === */
export const getTransactions = async (_req, res) => {
  try {
    const data = await db.Transaction.findAll({
      where: { status: { [Op.in]: ["completed", "pending"] } },
      include: [
        {
          model: db.User,
          as: "userTransaction",
          attributes: ["user_id", "username", "full_name", "email"], // ✅ thêm username + full_name
        },
        {
          model: db.SubscriptionPlan,
          as: "planTransaction",
          attributes: ["name"],
        },
      ],
      order: [["created_at", "DESC"]],
    });
    res.json(data);
  } catch (error) {
    console.error("❌ getTransactions Error:", error);
    res.status(500).json({ message: error.message });
  }
};

/* === Top người nạp tiền (completed) === */
export const getTopUsers = async (_req, res) => {
  try {
    const top = await db.Transaction.findAll({
      where: { status: "completed" },
      attributes: [
        "user_id",
        [fn("SUM", col("amount")), "total_spent"],
      ],
      include: [
        {
          model: db.User,
          as: "userTransaction",
          attributes: ["user_id", "username", "full_name", "email"], // ✅ thêm username + full_name
        },
      ],
      group: [
        col("Transaction.user_id"),
        col("userTransaction.user_id"),
        col("userTransaction.username"),
        col("userTransaction.full_name"),
        col("userTransaction.email"),
      ],
      order: [[literal(`"total_spent"`), "DESC"]],
      limit: 5,
      raw: true,
      nest: true,
      subQuery: false,
    });

    // Chuẩn hóa output gọn gàng cho frontend
    const result = top.map((r) => ({
      user_id: r.user_id,
      username: r.userTransaction?.username ?? null,
      full_name: r.userTransaction?.full_name ?? null,
      email: r.userTransaction?.email ?? null,
      total_spent: Number(r.total_spent) || 0,
    }));

    res.json(result);
  } catch (error) {
    console.error("❌ getTopUsers Error:", error);
    res.status(500).json({ message: error.message });
  }
};

/* === Doanh thu theo tháng (completed) === */
export const getRevenueStats = async (_req, res) => {
  try {
    const stats = await db.Transaction.findAll({
      where: { status: "completed" },
      attributes: [
        [fn("DATE_TRUNC", "month", col("created_at")), "month"],
        [fn("SUM", col("amount")), "total_revenue"],
      ],
      group: [literal(`DATE_TRUNC('month', "created_at")`)],
      order: [[literal(`DATE_TRUNC('month', "created_at")`), "ASC"]],
      raw: true,
    });
    res.json(stats);
  } catch (error) {
    console.error("❌ getRevenueStats Error:", error);
    res.status(500).json({ message: error.message });
  }
};
