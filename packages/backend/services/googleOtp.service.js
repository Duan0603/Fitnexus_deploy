// packages/backend/services/googleOtp.service.js
import crypto from "crypto";
import { redis } from "../utils/redisClient.js";

const DEFAULT_TTL_MIN = Number(process.env.GOOGLE_OTP_TTL_MIN || process.env.OTP_TTL_MIN || 10);
const DEFAULT_MAX_ATTEMPTS = Number(
  process.env.GOOGLE_OTP_MAX_ATTEMPTS || process.env.OTP_MAX_ATTEMPTS || 5
);

const otpKey = (userId) => ({
  data: `google_login_otp:${userId}`,
  attempts: `google_login_otp:${userId}:attempts`,
});
const stateKey = (token) => `google_login_state:${token}`;

const genCode = () => String(Math.floor(100000 + Math.random() * 900000));
const hash = (code) => crypto.createHash("sha256").update(code).digest("hex");
const genToken = () => crypto.randomBytes(24).toString("hex");

export async function createGoogleLoginOtp(userId, { ttlMin = DEFAULT_TTL_MIN } = {}) {
  if (!userId) throw new Error("UserId required for OTP");
  const code = genCode();
  const codeHash = hash(code);
  const k = otpKey(userId);
  const ttlSeconds = Math.max(30, ttlMin * 60);
  await redis.set(k.data, JSON.stringify({ code_hash: codeHash, createdAt: Date.now() }), "EX", ttlSeconds);
  await redis.set(k.attempts, "0", "EX", ttlSeconds);
  return { code, ttlMin, ttlSeconds };
}

export async function verifyGoogleLoginOtp(userId, code) {
  if (!userId || !code) return { ok: false, reason: "invalid_input" };
  const k = otpKey(userId);
  const stored = await redis.get(k.data);
  if (!stored) return { ok: false, reason: "expired" };

  const attempts = Number((await redis.get(k.attempts)) || "0");
  if (attempts >= DEFAULT_MAX_ATTEMPTS) {
    await redis.del(k.data);
    await redis.del(k.attempts);
    return { ok: false, reason: "max_attempts" };
  }

  const { code_hash } = JSON.parse(stored);
  if (hash(code) !== code_hash) {
    await redis.incr(k.attempts);
    return { ok: false, reason: "mismatch" };
  }

  await redis.del(k.data);
  await redis.del(k.attempts);
  return { ok: true };
}

export async function clearGoogleLoginOtp(userId) {
  if (!userId) return;
  const k = otpKey(userId);
  await redis.del(k.data);
  await redis.del(k.attempts);
}

export async function createGoogleOtpState(userId, { email, redirectTo, ttlSeconds }) {
  if (!userId) throw new Error("userId required");
  const token = genToken();
  const payload = JSON.stringify({
    userId,
    email,
    redirectTo: redirectTo || null,
    createdAt: Date.now(),
  });
  await redis.set(stateKey(token), payload, "EX", ttlSeconds || DEFAULT_TTL_MIN * 60);
  return token;
}

export async function getGoogleOtpState(token) {
  if (!token) return null;
  const data = await redis.get(stateKey(token));
  if (!data) return null;
  return JSON.parse(data);
}

export async function clearGoogleOtpState(token) {
  if (!token) return;
  await redis.del(stateKey(token));
}

export async function refreshGoogleOtpState(token, ttlSeconds) {
  if (!token) return;
  await redis.expire(stateKey(token), ttlSeconds || DEFAULT_TTL_MIN * 60);
}
