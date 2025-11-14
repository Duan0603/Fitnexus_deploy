import jwt from "jsonwebtoken";

export default function authGuard(req, res, next) {
  try {
    // 1) Accept Passport session (e.g., Google OAuth)
    if (req.user && (req.user.user_id || req.user.id)) {
      req.userId = req.user.user_id || req.user.id;
      req.userRole = req.user.role || null;
      return next();
    }

    // 2) Fallback to Bearer JWT in Authorization header
    const authHeader = req.get("authorization") || req.get("Authorization") || "";
    const [scheme, token] = authHeader.split(" ");
    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Missing or invalid Authorization header",
      });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.sub || payload.userId || payload.id;
    req.userRole = payload.role || null;
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Invalid token, no user ID found",
      });
    }

    return next();
  } catch (err) {
    console.error("Auth Guard Error:", err);
    return res.status(401).json({
      success: false,
      message: "Unauthorized: Invalid or expired token",
      error: err.message,
    });
  }
}

