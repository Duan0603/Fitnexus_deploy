import express from "express";
import { getTransactions, getTopUsers, getRevenueStats } from "../controllers/admin.revenue.controller.js";
import permissionGuard from "../middleware/permission.guard.js";

const router = express.Router();

// Chỉ admin có quyền xem doanh thu
router.get("/transactions", permissionGuard("manage:finance"), getTransactions);
router.get("/top-users", permissionGuard("manage:finance"), getTopUsers);
router.get("/revenue", permissionGuard("manage:finance"), getRevenueStats);

export default router;
