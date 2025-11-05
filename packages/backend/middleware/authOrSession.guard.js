import jwt from "jsonwebtoken";

// Accepts either Bearer JWT (like auth.guard) or Passport session (req.user)
export default function authOrSession(req, res, next) {
  try {
    const header = req.get("authorization") || req.get("Authorization") || "";
    const [scheme, token] = header.split(" ");

    if (scheme === "Bearer" && token) {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      req.userId = payload.sub || payload.userId || payload.id;
      req.userRole = payload.role || null;
      if (!req.userId) return res.status(401).json({ success: false, message: "Unauthorized" });
      return next();
    }

    // Fallback to session (Passport)
    if (typeof req.isAuthenticated === "function" && req.isAuthenticated() && req.user) {
      const u = req.user;
      // Sequelize instance or plain object
      const id = u.user_id || u.id || (typeof u.get === 'function' ? u.get('user_id') : null);
      if (!id) return res.status(401).json({ success: false, message: "Unauthorized" });
      req.userId = id;
      req.userRole = u.role || null;
      return next();
    }

    return res.status(401).json({ success: false, message: "Unauthorized" });
  } catch (_err) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
}

