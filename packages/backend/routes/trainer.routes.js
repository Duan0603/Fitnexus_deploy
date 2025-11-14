import { Router } from "express";
import rateLimit from "express-rate-limit";
import axios from "axios";
import multer from "multer";
import FormData from "form-data";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import authOrSession from "../middleware/authOrSession.guard.js";
import permissionGuard from "../middleware/permission.guard.js";
import aiQuota from "../middleware/ai.quota.js";
import { AI_API_URL } from "../config/env.js";
const router = Router();
// Resolve a stable uploads directory next to backend root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
// Multer config: images only, 10MB max
const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype || !file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"));
    }
    cb(null, true);
  },
});
// AI service endpoint (Python FastAPI)
// Health/feature probe for trainers
router.get("/tools", authOrSession, permissionGuard('manage:clients'), (_req, res) => {
  res.json({
    success: true,
    message: "Trainer tools accessible",
    timestamp: new Date().toISOString(),
  });
});
// Limit uploads to avoid abuse
const uploadLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many upload requests, please try again later.",
  },
});
// POST /api/trainer/upload - forward image to AI service
router.post(
  "/upload",
  authOrSession,
  // permissionGuard('manage:clients'), // Tạm thời bỏ để user thường cũng dùng được
  uploadLimiter,
  aiQuota('trainer_image_analyze'),
  upload.single("image"),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image file uploaded",
      });
    }

    const localPath = req.file.path;
    try {
      const formData = new FormData();
      formData.append(
        "file",
        fs.createReadStream(localPath),
        req.file.originalname
      );

      // Optional: forward known_height_cm if client provided (as text field in multipart)
      const height =
        (req.body && (req.body.known_height_cm || req.body.height_cm)) || null;
      if (height) {
        try {
          formData.append("known_height_cm", String(height));
        } catch {
          // ignore casting errors
        }
      }

      // Normalize AI API URL: if it doesn't already contain the analyze-image path,
      // append it so both domain-only and full URLs are supported.
      const base = String(AI_API_URL || "").trim();
      const targetUrl = base.includes("analyze-image")
        ? base
        : `${base.replace(/\/+$/, "")}/analyze-image/`;

      const response = await axios.post(targetUrl, formData, {
        headers: { ...formData.getHeaders() },
        timeout: 180000,
      });

      return res.status(200).json({
        success: true,
        message: "Image analyzed successfully.",
        data: response.data,
      });
    } catch (error) {
      if (error?.response) {
        const status = error.response.status || 502;
        const data = error.response.data;
        console.error(
          "[Trainer] Error calling AI service (HTTP):",
          status,
          data
        );
        const detail =
          (typeof data === "object" && data !== null && data.detail) ||
          (typeof data === "object" && data !== null && data.message) ||
          (typeof data === "string" ? data : "");

        return res.status(status).json({
          success: false,
          message: detail || "AI service error",
          errors: [{ details: data }],
        });
      }

      console.error(
        "[Trainer] Error calling AI service (network):",
        error?.message
      );
      return res.status(502).json({
        success: false,
        message: "Unable to reach AI service",
        errors: [{ details: error?.message || "Unknown error" }],
      });
    } finally {
      try {
        if (localPath && fs.existsSync(localPath)) fs.unlinkSync(localPath);
      } catch {
        // ignore cleanup errors
      }
    }
  }
);
export default router;
