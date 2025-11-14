// packages/backend/routes/payment.routes.js
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import authGuard from '../middleware/auth.guard.js';
import authOrSessionGuard from '../middleware/authOrSession.guard.js';
import { createPaymentLink, handlePayosWebhook, returnUrl, cancelUrl, verifyPaymentStatus, mockUpgradePremium, listMyPurchases } from '../controllers/payment.controller.js';

const router = Router();

// Rate limiters for payment endpoints to avoid request floods during tests
const createLinkLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
});
const verifyLimiter = rateLimit({
  windowMs: 15 * 1000,
  limit: 6,
  standardHeaders: true,
  legacyHeaders: false,
});

// Authenticated: create payOS payment link
// Allow either JWT or Passport session authentication
router.post('/create-link', createLinkLimiter, authOrSessionGuard, createPaymentLink);
// Polling verification (no webhook needed in dev)
router.post('/verify', verifyLimiter, authOrSessionGuard, verifyPaymentStatus);

// payOS webhook (public but verified)
router.post('/payos-webhook', handlePayosWebhook);

// Redirect URLs (public)
router.get('/return', returnUrl);
router.get('/cancel', cancelUrl);

// Dev-only: mock upgrade to Premium (no payment)
router.post('/mock-upgrade', authOrSessionGuard, mockUpgradePremium);
router.get('/my-purchases', authOrSessionGuard, listMyPurchases);

export default router;

