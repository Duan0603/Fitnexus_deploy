import { Router } from "express";
import authGuard from "../middleware/auth.guard.js";
import {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../controllers/notification.controller.js";

const router = Router();

router.get("/", authGuard, listNotifications);
router.patch("/read-all", authGuard, markAllNotificationsRead);
router.patch("/:id/read", authGuard, markNotificationRead);

export default router;
