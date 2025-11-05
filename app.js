import bodyParser from "body-parser";
import express from "express";
import dns from "dns";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import workoutRouter from "./routes/workout.routes.js";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";

import passport from "./config/passport.js";
import googleAuthRoutes from "./routes/auth.js"; // Google OAuth
import authRouter from "./routes/auth.routes.js";
import adminRouter from "./routes/admin.routes.js";
import trainerRouter from "./routes/trainer.routes.js";
import exerciseRouter from "./routes/exercise.routes.js";
import planRouter from "./routes/plan.routes.js";
import onboardingRouter from "./routes/onboarding.routes.js";
import nutritionRouter from "./routes/nutrition.routes.js";
import billingRouter from "./routes/billing.routes.js";
import paymentRouter from "./routes/payment.routes.js";
import adminRevenueRoutes from "./routes/admin.revenue.routes.js"; // ✅ Import route

dotenv.config();
import activityTracker from "./middleware/activity.tracker.js";

/* -------------------- Khởi tạo app -------------------- */
const app = express();
const isDev = process.env.NODE_ENV !== "production";
const FRONTEND = process.env.FRONTEND_URL || "http://localhost:5173";

/* -------------------- IPv4 preference -------------------- */
try {
  dns.setDefaultResultOrder?.("ipv4first");
} catch {}

/* -------------------- PayOS Webhook Raw Body -------------------- */
// ✅ Middleware này phải ĐẶT TRƯỚC express.json()
app.use("/api/payment/payos-webhook", bodyParser.raw({ type: "*/*" }));

/* -------------------- Body & Cookies -------------------- */
app.use(cookieParser());
app.use(express.json({ limit: "200kb" }));
app.use(express.urlencoded({ extended: true, limit: "200kb" }));

/* -------------------- CORS -------------------- */
const corsOptions = {
  origin: [
    FRONTEND,
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:5178",
    "http://localhost:5179",
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "Cache-Control",
    "Pragma",
    "Expires",
    "X-Requested-With",
  ],
  exposedHeaders: ["Set-Cookie"],
};
app.use(cors(corsOptions));

/* -------------------- Security & Logging -------------------- */
app.use(helmet());
if (process.env.NODE_ENV !== "test") {
  const morganFormat = isDev ? "dev" : "combined";
  app.use(
    morgan(morganFormat, {
      skip: (req, res) => {
        const url = req.originalUrl || req.url || "";
        const isApiOrAuth = url.startsWith("/api") || url.startsWith("/auth");
        const isRedirect =
          res.statusCode === 301 ||
          res.statusCode === 302 ||
          res.statusCode === 307 ||
          res.statusCode === 308;
        const isAsset =
          url.startsWith("/assets") ||
          url.startsWith("/static") ||
          url.includes("favicon.ico");
        if (isDev && ((isRedirect && !isApiOrAuth) || isAsset)) return true;
        return false;
      },
    })
  );
}

/* -------------------- Session -------------------- */
if (!process.env.SESSION_SECRET) {
  console.warn("[WARN] SESSION_SECRET is missing in .env");
}
app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev_fallback_secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
    },
  })
);

/* -------------------- Passport -------------------- */
app.use(passport.initialize());
app.use(passport.session());

/* -------------------- Rate limit -------------------- */
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isDev ? 1000 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
    errors: [],
  },
});

/* -------------------- Routes -------------------- */
app.use("/api/auth", authLimiter, authRouter);
app.use("/auth", googleAuthRoutes);
app.use("/api/onboarding", onboardingRouter);
app.use("/api/nutrition", nutritionRouter);
app.use("/api/billing", billingRouter);
app.use("/api/payment", paymentRouter);

// ✅ Di chuyển dòng này xuống đây sau khi app được khởi tạo
app.use("/api/admin/revenue", adminRevenueRoutes);

// Theo dõi hoạt động người dùng
app.use("/api", activityTracker);
app.use("/api/admin", adminRouter);
app.use("/api/trainer", trainerRouter);
app.use("/api/exercises", exerciseRouter);
app.use("/api/plans", planRouter);
app.use("/api/workout", workoutRouter);

/* -------------------- Health -------------------- */
app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

/* -------------------- Root -------------------- */
app.get("/", (_req, res) => {
  res.json({ message: "Chào mừng các tình yêu đã đến với web của anh 💕" });
});

/* -------------------- 404 & Redirect Dev -------------------- */
if (isDev && FRONTEND) {
  app.get(/^\/(?!api|auth|static|assets|uploads).*/, (req, res) => {
    const target = `${FRONTEND}${req.originalUrl || ""}`;
    return res.redirect(target);
  });
}

app.use("*", (_req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    errors: [],
  });
});

/* -------------------- Error handler -------------------- */
app.use((err, _req, res, _next) => {
  if (isDev) console.error("Global error:", err);
  const status = err.status || 500;
  const safeMessage =
    status === 500 && !isDev ? "Internal server error" : err.message;

  res.status(status).json({
    success: false,
    message: safeMessage || "Internal server error",
    errors: Array.isArray(err.errors) ? err.errors : [],
    ...(isDev ? { stack: err.stack } : {}),
  });
});

export default app;
