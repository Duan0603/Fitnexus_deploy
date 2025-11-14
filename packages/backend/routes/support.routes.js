// packages/backend/routes/support.routes.js
import { Router } from "express";
import multer from "multer";
import authOrSessionGuard from "../middleware/authOrSession.guard.js";
import authGuard from "../middleware/auth.guard.js";
import permissionGuard from "../middleware/permission.guard.js";
import {
  submitBugReport,
  listBugReports,
  getBugReportDetail,
  respondBugReport,
} from "../controllers/support.controller.js";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

router.post(
  "/report",
  authOrSessionGuard,
  upload.single("screenshot"),
  submitBugReport
);

router.get(
  "/reports",
  authGuard,
  permissionGuard("manage:support"),
  listBugReports
);

router.get(
  "/reports/:id",
  authGuard,
  permissionGuard("manage:support"),
  getBugReportDetail
);

router.patch(
  "/reports/:id/respond",
  authGuard,
  permissionGuard("manage:support"),
  respondBugReport
);

export default router;
