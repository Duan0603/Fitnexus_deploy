// routes/auth.js
import express from "express";
import passport from "passport";
import User from "../models/user.model.js";
import { FRONTEND_URL } from "../config/env.js";

const router = express.Router();

// Bắt đầu OAuth Google, lưu lại path "from" (nếu có) để redirect sau khi login
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

// Callback từ Google: đăng nhập trực tiếp (không OTP) và redirect theo role / onboarding
router.get(
  "/google/callback",
  (req, res, next) => {
    passport.authenticate(
      "google",
      {
        failureRedirect: `${FRONTEND_URL}/login`,
        keepSessionInfo: true,
      },
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

        try {
          console.info(
            "Google OAuth authenticate: user id:",
            user.user_id || user.id || null
          );
        } catch {
          // ignore
        }

        req.logIn(user, (loginErr) => {
          if (loginErr) {
            console.error(
              "Google OAuth login error:",
              loginErr && loginErr.stack ? loginErr.stack : loginErr
            );
            return res.redirect(`${FRONTEND_URL}/login?oauth=error`);
          }
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

      const redirectHint = req.session?.googleOauthRedirect || null;
      if (req.session) delete req.session.googleOauthRedirect;

      const role = oauthUser.role;
      const isAdmin = role === "ADMIN";
      const isOnboarded = !!oauthUser.onboardingCompletedAt;

      let targetPath = "/dashboard";

      if (isAdmin) {
        // Admin sau khi login Google -> trang admin
        targetPath = "/admin";
      } else if (!isOnboarded) {
        // User mới hoặc chưa hoàn tất onboarding -> vào flow onboarding
        targetPath = "/onboarding";
      }

      // Nếu user đã onboarding xong và có from hợp lệ thì quay lại from
      if (
        isOnboarded &&
        typeof redirectHint === "string" &&
        redirectHint.startsWith("/") &&
        redirectHint.length <= 300
      ) {
        targetPath = redirectHint;
      }

      const url = new URL(targetPath, FRONTEND_URL);
      return res.redirect(url.toString());
    } catch (error) {
      console.error("Google OAuth finalize error:", error);
      return res.redirect(`${FRONTEND_URL}/login?oauth=error`);
    }
  }
);

// Lấy user từ session (dùng cho FE)
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

