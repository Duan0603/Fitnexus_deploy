import express from "express";
import rateLimit from "express-rate-limit";
import passport from "passport";
import jwt from "jsonwebtoken";
import multer from "multer";

import { sendOtp, verifyOtp } from "../controllers/emailVerify.controller.js";
import {
  register,
  login,
  me,
  checkUsername,
  checkEmail,
  checkPhone,
  refreshToken,
  forgotPassword,
  resetPassword,
  logout,
  changePassword,
  updatePersonalInfo,
  streakSummary,
  pingStreak,
} from "../controllers/auth.controller.js";
import { resendGoogleOtp, verifyGoogleOtp } from "../controllers/googleOtp.controller.js";
import authGuard from "../middleware/auth.guard.js";
import { registerValidation, loginValidation } from "../middleware/auth.validation.js";
import { body, validationResult } from "express-validator";
import { FRONTEND_URL } from "../config/env.js";

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { message: "Too many login attempts, try again later." },
});

const forgotLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { message: "Too many requests, please try again later." },
});

const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { success: false, message: "Too many OTP requests, try again later." },
});

router.post("/register", registerValidation, register);
router.post("/login", loginLimiter, loginValidation, login);
router.get("/me", authGuard, me);
router.get("/check-username", checkUsername);
router.get("/check-email", checkEmail);
router.get("/check-phone", checkPhone);
router.post("/refresh", refreshToken);

router.post("/logout", authGuard, logout);

router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account",
    session: false,
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${FRONTEND_URL}/login`,
    session: false,
  }),
  async (req, res) => {
    if (!req.user) return res.redirect(`${FRONTEND_URL}/login`);

    const oauthUser = req.user;
    if (oauthUser && typeof oauthUser.save === "function") {
      oauthUser.lastLoginAt = new Date();
      oauthUser.save({ fields: ["lastLoginAt"] }).catch(() => {});
    }

    const userId = oauthUser.id ?? oauthUser.user_id ?? oauthUser._id;
    const accessToken = jwt.sign(
      { sub: userId, role: oauthUser.role, type: "access" },
      process.env.JWT_SECRET,
      { expiresIn: "4h" }
    );

    const isNew = oauthUser?.get?.("isNew") ? 1 : 0;
    const safeUser = (() => {
      try {
        const { passwordHash, providerId, ...rest } = oauthUser.toJSON();
        return rest;
      } catch {
        return {};
      }
    })();

    let targetOrigin = "*";
    try {
      targetOrigin = new URL(FRONTEND_URL).origin;
    } catch {
      targetOrigin = "*";
    }

    const safe = (obj) => JSON.stringify(obj).replace(/</g, "\\u003c");
    res.type("html").send(`<!doctype html>
<html><head><meta charset="utf-8"/></head><body>
<script>
  (function() {
    try {
      var payload = {
        source: "oauth",
        provider: "google",
        status: "success",
        token: ${safe(accessToken)},
        isNew: ${safe(isNew)},
        user: ${safe(safeUser)}
      };
      if (window.opener && typeof window.opener.postMessage === "function") {
        window.opener.postMessage(payload, ${JSON.stringify(targetOrigin)});
      }
    } catch (e) {} finally {
      window.close();
      setTimeout(function(){
        try { window.location.replace(${JSON.stringify(FRONTEND_URL)}); } catch(_) {}
      }, 300);
    }
  })();
</script>
OK
</body></html>`);
  }
);

router.get("/logout-session", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.redirect(FRONTEND_URL);
  });
});

router.post("/forgot-password", forgotLimiter, forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/send-otp", otpLimiter, sendOtp);
router.post("/verify-otp", verifyOtp);
router.get("/streak", authGuard, streakSummary);
router.post("/streak/ping", authGuard, pingStreak);
router.post("/google/otp/resend", otpLimiter, resendGoogleOtp);
router.post("/google/otp/verify", verifyGoogleOtp);

// Change password (authenticated)
const changePasswordValidation = [
  body('currentPassword').isLength({ min: 6 }).withMessage('Mật khẩu hiện tại không hợp lệ'),
  body('newPassword').isLength({ min: 8 }).withMessage('Mật khẩu mới phải từ 8 ký tự'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.newPassword) throw new Error('Xác nhận mật khẩu không khớp');
    return true;
  })
];

router.post("/change-password", authGuard, changePasswordValidation, (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array(),
    });
  }
  return changePassword(req, res, next);
});

// Update personal info
const personalInfoValidation = [
  body('email').optional().isEmail().withMessage('Email không hợp lệ'),
  body('phone').optional().isLength({ min: 10, max: 15 }).withMessage('Số điện thoại phải từ 10-15 ký tự'),
  body('firstName').optional().isLength({ min: 1, max: 50 }).withMessage('Tên phải từ 1-50 ký tự'),
  body('lastName').optional().isLength({ min: 1, max: 50 }).withMessage('Họ phải từ 1-50 ký tự'),
  body('dateOfBirth').optional().custom((value) => {
    if (!value) return true;
    const date = new Date(value);
    return !isNaN(date.getTime());
  }).withMessage('Ngày sinh không hợp lệ'),
  body('gender').optional().isIn(['male', 'female', 'other', 'MALE', 'FEMALE', 'OTHER']).withMessage('Giới tính không hợp lệ'),
];

// Use simplified validation: email, phone, fullName
const simplePersonalInfoValidation = [
  body('email').optional().isEmail().withMessage('Email không hợp lệ'),
  body('phone').optional().isLength({ min: 10, max: 15 }).withMessage('Số điện thoại phải từ 10-15 ký tự'),
  body('fullName').optional().isLength({ min: 1, max: 100 }).withMessage('Họ và tên phải từ 1-100 ký tự'),
];

router.put("/personal-info", authGuard, simplePersonalInfoValidation, (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array(),
    });
  }
  return updatePersonalInfo(req, res, next);
});

// Avatar upload/remove (supports JWT or session)
import authOrSession from "../middleware/authOrSession.guard.js";
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype || !file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"));
    }
    cb(null, true);
  },
});
import { uploadAvatar, removeAvatar } from "../controllers/auth.controller.js";
router.post("/avatar", authOrSession, upload.single("avatar"), uploadAvatar);
router.delete("/avatar", authOrSession, removeAvatar);

export default router;
