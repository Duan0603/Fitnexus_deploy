import crypto from "crypto";
import { Op } from "sequelize";
import { redis } from "../utils/redisClient.js";
import User from "../models/user.model.js";
import { sendMail } from "../utils/mailer.js";
import { buildEmailOtpTemplate } from "../utils/emailTemplates.js";

/** Tạo mã 6 số */
function genOTP() {
  // 100000..999999
  return String(Math.floor(100000 + Math.random() * 900000));
}
/** Hash OTP (không lưu raw OTP vào Redis) */
function hashOTP(code) {
  return crypto.createHash("sha256").update(code).digest("hex");
}
/** Key helper */
function keys(userId) {
  return {
    data: `email_verify:${userId}`,        // chứa code_hash, email, expiresAt
    attempts: `email_verify_attempts:${userId}`, // đếm số lần nhập sai
  };
}

/** POST /api/auth/send-otp  { email }  */
export async function sendOtp(req, res, next) {
  try {
    const { email } = req.body ?? {};
    if (!email) return res.status(400).json({ success: false, message: "Email is required" });

    const user = await User.findOne({ where: { email } });
    // Không lộ thông tin user tồn tại hay không
    if (!user) {
      return res.json({ success: true, message: "If the email exists, an OTP has been sent." });
    }

    const ttlMin = Number(process.env.OTP_TTL_MIN || 10);
    const maxAttempts = Number(process.env.OTP_MAX_ATTEMPTS || 5);

    // Tạo OTP + hash
    const code = genOTP();
    const codeHash = hashOTP(code);
    const k = keys(user.user_id);

    // Lưu vào Redis (JSON) với TTL
    const payload = JSON.stringify({
      code_hash: codeHash,
      email: user.email,
      createdAt: Date.now(),
    });

    // setex (giây)
    await redis.set(k.data, payload, "EX", ttlMin * 60);
    // reset attempts
    await redis.set(k.attempts, "0", "EX", ttlMin * 60);

    // Gửi mail OTP
    const { subject, html, text } = buildEmailOtpTemplate({
      name: user.fullName || user.username || "bạn",
      code,
      ttlMin,
      brand: "FitNexus",
    });
    await sendMail({ to: user.email, subject, html, text });

    return res.json({
      success: true,
      message: "If the email exists, an OTP has been sent.",
    });
  } catch (err) {
    next(err);
  }
}

/** POST /api/auth/verify-otp  { email, code } */
export async function verifyOtp(req, res, next) {
  try {
    const { email, code } = req.body ?? {};
    if (!email || !code) {
      return res.status(400).json({ success: false, message: "Email and code are required" });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      // vẫn trả chung chung
      return res.status(400).json({ success: false, message: "Invalid OTP or expired" });
    }

    const ttlMin = Number(process.env.OTP_TTL_MIN || 10);
    const maxAttempts = Number(process.env.OTP_MAX_ATTEMPTS || 5);
    const k = keys(user.user_id);

    const stored = await redis.get(k.data);
    if (!stored) {
      return res.status(400).json({ success: false, message: "Invalid OTP or expired" });
    }
    const attemptsRaw = (await redis.get(k.attempts)) || "0";
    const attempts = Number(attemptsRaw);

    if (attempts >= maxAttempts) {
      // quá số lần nhập sai
      await redis.del(k.data);
      await redis.del(k.attempts);
      return res.status(429).json({ success: false, message: "Too many attempts. Request a new OTP." });
    }

    const { code_hash } = JSON.parse(stored);
    const inputHash = hashOTP(code);

    if (inputHash !== code_hash) {
      // tăng attempts
      await redis.incr(k.attempts);
      // giữ nguyên TTL cũ
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    // Thành công → xoá OTP & attempts
    await redis.del(k.data);
    await redis.del(k.attempts);

    // (tuỳ mục đích) đánh dấu user.email_verified = true … nếu bạn có cột đó
    // await user.update({ emailVerifiedAt: new Date() });

    return res.json({ success: true, message: "Email verified successfully" });
  } catch (err) {
    next(err);
  }
}
