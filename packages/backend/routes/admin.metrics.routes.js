import express from 'express';
import authGuard from '../middleware/auth.guard.js';
import permissionGuard from '../middleware/permission.guard.js';
import { getOverviewMetrics, getContentOverviewMetrics } from '../controllers/admin.metrics.controller.js';

const router = express.Router();

// Unified admin dashboard metrics
router.get('/overview', authGuard, permissionGuard('read:admin_dashboard'), getOverviewMetrics);
router.get('/content-overview', authGuard, permissionGuard('read:admin_dashboard'), getContentOverviewMetrics);

export default router;
