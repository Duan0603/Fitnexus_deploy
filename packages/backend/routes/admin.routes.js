// packages/backend/routes/admin.routes.js
import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import activityTracker from "../middleware/activity.tracker.js";
import authGuard from '../middleware/auth.guard.js';
import permissionGuard from '../middleware/permission.guard.js';
import { sequelize } from '../config/database.js';
import User from '../models/user.model.js';

import {
  listUsers,
  getUsersStats,
  updateUserRole,
  updateUserPlan,
  resetPassword,
  lockUser,
  unlockUser,
  getPopularExercises,
} from '../controllers/admin.controller.js';

import {
  getUserPlans,
  getUserPlanById, // ⬅️ NEW
} from '../controllers/admin.plan.controller.js';

import {
  listSubAdmins,
  createSubAdmin,
} from '../controllers/adminSub.controller.js';

const router = express.Router();

router.patch('/users/:id/lock',   authGuard, permissionGuard('manage:users'), lockUser);
router.patch('/users/:id/unlock', authGuard, permissionGuard('manage:users'), unlockUser);

// Hard delete user (admin)
router.delete(
  '/users/:id',
  authGuard,
  permissionGuard('manage:users'),
  [
    param('id').isInt({ min: 1 }).toInt(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        success: false,
        message: 'Validation error',
        errors: errors.array(),
      });
    }

    try {
      const targetId = Number(req.params.id);
      const currentUserId = Number(req.userId || 0);

      if (!Number.isFinite(targetId) || targetId <= 0) {
        return res.status(400).json({ success: false, message: 'Invalid user id' });
      }
      if (currentUserId === targetId) {
        return res.status(400).json({
          success: false,
          message: 'You cannot delete your own account from admin panel',
        });
      }

      const result = await sequelize.transaction(async (t) => {
        const user = await User.findOne({
          where: { user_id: targetId },
          transaction: t,
          lock: t.LOCK.UPDATE,
        });

        if (!user) return { ok: false, reason: 'not_found' };

        await user.destroy({ transaction: t });
        return { ok: true, username: user.username, email: user.email };
      });

      if (!result.ok) {
        if (result.reason === 'not_found') {
          return res.status(404).json({ success: false, message: 'User not found' });
        }
        return res.status(400).json({ success: false, message: 'Cannot delete user' });
      }

      return res.json({
        success: true,
        message: 'User deleted successfully',
        data: {
          user_id: targetId,
          username: result.username,
          email: result.email,
        },
      });
    } catch (err) {
      console.error('Admin deleteUser (route) error:', err);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
);

// Get all plans of a specific user
router.get('/users/:userId/plans', authGuard, permissionGuard('manage:users'), getUserPlans);

// ⬇️ NEW: Get a specific plan of a user (admin)
router.get(
  '/users/:userId/plans/:planId',
  authGuard,
  permissionGuard('read:admin_dashboard'),
  [
    param('userId').isInt({ min: 1 }).toInt(),
    param('planId').isInt({ min: 1 }).toInt(),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, message: 'Validation error', errors: errors.array() });
    }
    return getUserPlanById(req, res, next);
  }
);

router.get(
  '/users/stats',
  authGuard,
  permissionGuard('manage:users'),
  (_req, res, next) => getUsersStats(_req, res, next)
);

router.get('/health', authGuard, permissionGuard('read:admin_dashboard'), (_req, res) => {
  res.json({ success: true, message: 'Admin route OK', timestamp: new Date().toISOString() });
});

router.get(
  '/users',
  authGuard,
  permissionGuard('manage:users'),
  [
    query('limit').optional().isInt({ min: 1, max: 200 }).toInt(),
    query('offset').optional().isInt({ min: 0 }).toInt(),
    query('search').optional().isString().trim().isLength({ max: 255 }),
    query('plan')
      .optional()
      .customSanitizer((v) => String(v).trim().toUpperCase())
      .isIn(['FREE', 'PREMIUM'])
      .withMessage('Invalid plan'),
    query('role')
      .optional()
      .customSanitizer((v) => String(v).trim().toUpperCase())
      .isIn(['USER', 'TRAINER', 'ADMIN'])
      .withMessage('Invalid role'),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, message: 'Validation error', errors: errors.array() });
    }
    return listUsers(req, res, next);
  }
);

router.patch(
  '/users/:id/role',
  authGuard,
  permissionGuard('manage:users'),
  [
    param('id').isInt({ min: 1 }).toInt(),
    body('role').isIn(['USER', 'TRAINER', 'ADMIN']).withMessage('Invalid role'),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, message: 'Validation error', errors: errors.array() });
    }
    return updateUserRole(req, res, next);
  }
);

router.patch(
  '/users/:id/plan',
  authGuard,
  permissionGuard('manage:users'),
  [
    param('id').isInt({ min: 1 }).toInt(),
    body('plan')
      .customSanitizer((v) => String(v).trim().toUpperCase())
      .isIn(['FREE', 'PREMIUM'])
      .withMessage('Invalid plan'),
    body('duration_days').optional().isInt({ min: 1 }).toInt(),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, message: 'Validation error', errors: errors.array() });
    }
    return updateUserPlan(req, res, next);
  }
);

router.post(
  '/users/:userId/reset-password',
  authGuard,
  permissionGuard('manage:users'),
  [
    param('userId').isInt({ min: 1 }).toInt(),
    body('newPassword')
      .isString()
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 chars')
      .matches(/[A-Z]/).withMessage('Need at least 1 uppercase letter')
      .matches(/[a-z]/).withMessage('Need at least 1 lowercase letter')
      .matches(/\d/).withMessage('Need at least 1 digit')
      .matches(/[\W_]/).withMessage('Need at least 1 special character'),
    body('confirmPassword')
      .custom((val, { req }) => val === req.body.newPassword)
      .withMessage('Passwords do not match'),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, message: 'Validation error', errors: errors.array() });
    }
    return resetPassword(req, res, next);
  }
);

router.get(
  '/subadmins',
  authGuard,
  permissionGuard('read:admin_dashboard'),
  [
    query('limit').optional().isInt({ min: 1, max: 200 }).toInt(),
    query('offset').optional().isInt({ min: 0 }).toInt(),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, message: 'Validation error', errors: errors.array() });
    }
    return listSubAdmins(req, res, next);
  }
);

router.get(
  '/popular-exercises',
  authGuard,
  permissionGuard('manage:users'),
  [
    query('limit').optional().isInt({ min: 1, max: 200 }).toInt(),
    query('offset').optional().isInt({ min: 0 }).toInt(),
    query('search').optional().isString().trim().isLength({ max: 255 }),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, message: 'Validation error', errors: errors.array() });
    }
    return getPopularExercises(req, res, next);
  }
);

router.post(
  '/subadmins',
  authGuard,
  permissionGuard('manage:users'),
  [
    body('email').isEmail().withMessage('Invalid email').normalizeEmail(),
    body('username').isString().trim().isLength({ min: 3, max: 50 }).withMessage('Invalid username'),
    body('password')
      .isString()
      .isLength({ min: 8 }).withMessage('Password must be at least 8 chars')
      .matches(/[A-Z]/).withMessage('Need at least 1 uppercase letter')
      .matches(/[a-z]/).withMessage('Need at least 1 lowercase letter')
      .matches(/\d/).withMessage('Need at least 1 digit')
      .matches(/[\W_]/).withMessage('Need at least 1 special character'),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, message: 'Validation error', errors: errors.array() });
    }
    return createSubAdmin(req, res, next);
  }
);

export default router;
