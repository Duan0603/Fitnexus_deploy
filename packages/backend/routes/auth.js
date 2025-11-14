// routes/auth.js
import express from "express";
import passport from "passport";
import { createGoogleLoginOtp, createGoogleOtpState } from "../services/googleOtp.service.js";
import { sendMail } from "../utils/mailer.js";
import { buildEmailOtpTemplate } from "../utils/emailTemplates.js";
import User from "../models/user.model.js";
import { FRONTEND_URL } from "../config/env.js";

const router = express.Router();

router.get(
  "/google",
  (req, _res, next) => {
    if (req.query?.from) {
      req.session.googleOauthRedirect = String(req.query.from);
    }
    next();
  },
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account",
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${FRONTEND_URL}/login`,
    keepSessionInfo: true,
  }),
  async (req, res) => {
    try {
      if (!req.user) {
        return res.redirect(`${FRONTEND_URL}/login?oauth=failed`);
      }

      const baseUserId = req.user.user_id || req.user.id;
      const oauthUser =
        typeof req.user.toJSON === "function"
          ? req.user
          : await User.findByPk(baseUserId);
      if (!oauthUser) {
        return res.redirect(`${FRONTEND_URL}/login?oauth=failed`);
      }

      const userId = oauthUser.user_id || oauthUser.id || baseUserId;

      const { code, ttlMin, ttlSeconds } = await createGoogleLoginOtp(userId);
      const { subject, html, text } = buildEmailOtpTemplate({
        name: oauthUser.fullName || oauthUser.username || "bạn",
        code,
        ttlMin,
        brand: "FitNexus",
      });
      await sendMail({ to: oauthUser.email, subject, html, text });

      const redirectHint = req.session?.googleOauthRedirect || null;
      const otpToken = await createGoogleOtpState(userId, {
        email: oauthUser.email,
        redirectTo: redirectHint,
        ttlSeconds,
      });
      if (req.session) delete req.session.googleOauthRedirect;

      if (typeof req.logout === "function") {
        await new Promise((resolve, reject) =>
          req.logout((err) => (err ? reject(err) : resolve()))
        );
      }

      const url = new URL("/login/otp", FRONTEND_URL);
      if (oauthUser.email) url.searchParams.set("email", oauthUser.email);
      url.searchParams.set("otpToken", otpToken);
      if (redirectHint) {
        url.searchParams.set("from", redirectHint);
      }
      return res.redirect(url.toString());
    } catch (error) {
      console.error("Google OAuth OTP error:", error);
      return res.redirect(`${FRONTEND_URL}/login?oauth=error`);
    }
  }
);

router.get("/me", (req, res) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  res.set("Surrogate-Control", "no-store");

  if (!(req.isAuthenticated?.() && req.user)) {
    return res.status(401).json({ message: "Unauthenticated" });
  }

  const plain = typeof req.user?.toJSON === "function" ? req.user.toJSON() : req.user;
  const { passwordHash, providerId, ...safe } = plain || {};
  return res.json({ user: safe });
});

export default router;
