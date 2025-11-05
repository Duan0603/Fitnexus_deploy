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
const AI_API_URL =
  process.env.AI_API_URL || "http://127.0.0.1:8000/analyze-image/";
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
  async (req, res, next) => {
    if (!req.file) {
      const err = new Error("No image file uploaded");
      err.status = 400;
      return next(err);
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
      const height = (req.body && (req.body.known_height_cm || req.body.height_cm)) || null;
      if (height) {
        try { formData.append("known_height_cm", String(height)); } catch (_) {}
      }

      const response = await axios.post(AI_API_URL, formData, {
        headers: { ...formData.getHeaders() },
        timeout: 180000,
      });
      return res.status(200).json({
        success: true,
        message: "Image analyzed successfully.",
        data: response.data,
      });
    } catch (error) {
      const errorMessage = error?.response
        ? error.response.data?.detail || JSON.stringify(error.response.data)
        : error.message;
      console.error("[Trainer] Error calling AI service:", errorMessage);
      const err = new Error("Failed to process image with AI service.");
      err.status = 502; // Bad Gateway to upstream AI service
      err.errors = [{ details: errorMessage }];
      return next(err);
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
