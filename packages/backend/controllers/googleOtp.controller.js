// packages/backend/controllers/googleOtp.controller.js
import User from "../models/user.model.js";
import {
  createGoogleLoginOtp,
  verifyGoogleLoginOtp,
  clearGoogleLoginOtp,
  getGoogleOtpState,
  clearGoogleOtpState,
  refreshGoogleOtpState,
} from "../services/googleOtp.service.js";
import { recordLoginActivity } from "../services/streak.service.js";
import { buildEmailOtpTemplate } from "../utils/emailTemplates.js";
import { sendMail } from "../utils/mailer.js";

const safeUser = (user) => {
  if (!user) return null;
  const values = typeof user.toJSON === "function" ? user.toJSON() : user;
  const { passwordHash, providerId, ...rest } = values;
  return rest;
};

export async function resendGoogleOtp(req, res) {
  try {
    const { otpToken } = req.body ?? {};

    const pending = await getGoogleOtpState(otpToken);
    if (!pending?.userId) {
      return res.status(400).json({
        success: false,
        message: "Phiên đăng nhập Google đã hết hạn, hãy đăng nhập lại.",
      });
    }

    const user = await User.findByPk(pending.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const { code, ttlMin, ttlSeconds } = await createGoogleLoginOtp(user.user_id);
    const { subject, html, text } = buildEmailOtpTemplate({
      name: user.fullName || user.username || "bạn",
      code,
      ttlMin,
      brand: "FitNexus",
    });
    await sendMail({ to: user.email, subject, html, text });
    await refreshGoogleOtpState(otpToken, ttlSeconds);

    return res.json({ success: true, message: "Đã gửi lại mã OTP" });
  } catch (err) {
    console.error("resendGoogleOtp error:", err);
    return res.status(500).json({ success: false, message: "Không thể gửi OTP, thử lại sau." });
  }
}

export async function verifyGoogleOtp(req, res) {
  try {
    const { code, otpToken } = req.body ?? {};
    if (!code || !otpToken) {
      return res.status(400).json({ success: false, message: "Vui lòng nhập mã OTP." });
    }
    const pending = await getGoogleOtpState(otpToken);
    if (!pending?.userId) {
      return res.status(400).json({
        success: false,
        message: "Phiên OTP đã hết hạn, vui lòng đăng nhập lại bằng Google.",
      });
    }

    const validation = await verifyGoogleLoginOtp(pending.userId, code);
    if (!validation.ok) {
      let status = 400;
      let message = "Mã OTP không chính xác.";
      if (validation.reason === "expired") {
        message = "OTP đã hết hạn. Vui lòng yêu cầu mã mới.";
      } else if (validation.reason === "max_attempts") {
        message = "Nhập sai quá nhiều lần. Hãy đăng nhập lại bằng Google.";
        status = 429;
      }
      return res.status(status).json({ success: false, message });
    }

    const user = await User.findByPk(pending.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    await new Promise((resolve, reject) =>
      req.login(user, (err) => (err ? reject(err) : resolve()))
    );
    await clearGoogleLoginOtp(user.user_id);
    await clearGoogleOtpState(otpToken);
    const redirectTo = pending.redirectTo || null;
    await recordLoginActivity(user, req);

    return res.json({
      success: true,
      message: "Xác thực OTP thành công",
      data: { user: safeUser(user), redirectTo },
    });
  } catch (err) {
    console.error("verifyGoogleOtp error:", err);
    return res.status(500).json({
      success: false,
      message: "Không thể xác thực OTP. Vui lòng thử lại.",
    });
  }
}
