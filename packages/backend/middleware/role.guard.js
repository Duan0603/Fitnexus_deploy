// Role-based authorization middleware
// Usage: router.get('/admin', authGuard, authorizeRoles('ADMIN'), handler)

export function authorizeRoles(...allowedRoles) {
  return function (req, res, next) {
    try {
      const role = req.userRole; // set by auth.guard

      if (!role) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      if (!allowedRoles.includes(role)) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }

      next();
    } catch (_err) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
  };
}

// Convenience helpers
export const requireAdmin = authorizeRoles('ADMIN');
export const requireTrainer = authorizeRoles('TRAINER', 'ADMIN');

