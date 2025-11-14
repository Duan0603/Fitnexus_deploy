// routes/auth.js
import express from "express";
import passport from "passport";
import {
  createGoogleLoginOtp,
  createGoogleOtpState,
} from "../services/googleOtp.service.js";
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
  // Use a custom callback to log failures and debug session/profile issues
  (req, res, next) => {
    passport.authenticate(
      "google",
      { failureRedirect: `${FRONTEND_URL}/login`, keepSessionInfo: true },
      async (err, user, info) => {
        if (err) {
          console.error(
            "Google OAuth authenticate error:",
            err && err.stack ? err.stack : err
          );
          return res.redirect(`${FRONTEND_URL}/login?oauth=error`);
        }

        if (!user) {
          console.warn("Google OAuth authenticate: no user returned", {
            info: info || null,
            sessionKeys: req.session ? Object.keys(req.session) : null,
          });
          return res.redirect(`${FRONTEND_URL}/login?oauth=failed`);
        }

        // Log minimal user identity info for debugging (no secrets)
        try {
          console.info(
            "Google OAuth authenticate: user id:",
            user.user_id || user.id || null
          );
        } catch (e) {}

        // Establish login session
        req.logIn(user, (loginErr) => {
          if (loginErr) {
            console.error(
              "Google OAuth login error:",
              loginErr && loginErr.stack ? loginErr.stack : loginErr
            );
            return res.redirect(`${FRONTEND_URL}/login?oauth=error`);
          }
          // proceed to next handler which will perform OTP/email flow
          return next();
        });
      }
    )(req, res, next);
  },
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

      // If DISABLE_EMAIL is enabled, skip sending email and log OTP for debugging
      if (String(process.env.DISABLE_EMAIL || "").toLowerCase() === "true") {
        console.info("DISABLE_EMAIL active — OTP for user:", {
          email: oauthUser.email,
          otp: code,
          ttlSeconds,
        });
      } else {
        await sendMail({ to: oauthUser.email, subject, html, text });
      }

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
      // Ensure we don't keep a half-open OAuth session if OTP/email fails
      try {
        if (typeof req.logout === "function") {
          await new Promise((resolve, reject) =>
            req.logout((err) => (err ? reject(err) : resolve()))
          );
        }
      } catch (e) {
        console.error("Google OAuth OTP logout cleanup error:", e);
      }
      return res.redirect(`${FRONTEND_URL}/login?oauth=error`);
    }
  }
);

router.get("/me", (req, res) => {
  res.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate"
  );
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  res.set("Surrogate-Control", "no-store");

  if (!(req.isAuthenticated?.() && req.user)) {
    return res.status(401).json({ message: "Unauthenticated" });
  }

  const plain =
    typeof req.user?.toJSON === "function" ? req.user.toJSON() : req.user;
  const { passwordHash, providerId, ...safe } = plain || {};
  return res.json({ user: safe });
});

export default router;
