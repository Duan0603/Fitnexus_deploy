// packages/backend/routes/billing.routes.js
import { Router } from 'express';
import { getActivePlans } from '../controllers/subscriptionPlan.controller.js';

const router = Router();

// Public: list active subscription plans
router.get('/plans', getActivePlans);

export default router;

