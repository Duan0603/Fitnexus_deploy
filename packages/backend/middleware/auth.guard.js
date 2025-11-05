import jwt from "jsonwebtoken";

export default function authGuard(req, res, next) {
  try {
    // Lấy Authorization header từ request
    const authHeader = req.get("authorization") || req.get("Authorization") || "";
    console.log("Auth Header:", authHeader);

    // Tách scheme và token
    const [scheme, token] = authHeader.split(" ");

    // Kiểm tra scheme và token
    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Missing or invalid Authorization header",
      });
    }

    // Verify token
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // Gán userId và userRole từ payload
    req.userId = payload.sub || payload.userId || payload.id;
    req.userRole = payload.role || null;

    // Kiểm tra userId
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Invalid token, no user ID found",
      });
    }

    next();
  } catch (err) {
    console.error("Auth Guard Error:", err); // Log lỗi để dễ dàng debug
    return res.status(401).json({
      success: false,
      message: "Unauthorized: Invalid or expired token",
      error: err.message, // Trả lại thông báo lỗi chi tiết cho dev
    });
  }
}
