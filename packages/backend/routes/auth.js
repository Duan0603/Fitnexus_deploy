// routes/auth.js
import express from "express";
import passport from "passport";
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
  // Custom callback to establish session and then redirect without OTP
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

        try {
          console.info(
            "Google OAuth authenticate: user id:",
            user.user_id || user.id || null
          );
        } catch {}

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

      let targetPath = "/dashboard";
      if (
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

