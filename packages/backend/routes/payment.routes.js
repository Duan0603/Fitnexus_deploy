// packages/backend/routes/payment.routes.js
import { Router } from 'express';
import authGuard from '../middleware/auth.guard.js';
import authOrSessionGuard from '../middleware/authOrSession.guard.js';
import { createPaymentLink, handlePayosWebhook, returnUrl, cancelUrl, verifyPaymentStatus } from '../controllers/payment.controller.js';

const router = Router();

// Authenticated: create payOS payment link
// Allow either JWT or Passport session authentication
router.post('/create-link', authOrSessionGuard, createPaymentLink);
// Polling verification (no webhook needed in dev)
router.post('/verify', authOrSessionGuard, verifyPaymentStatus);

// payOS webhook (public but verified)
router.post('/payos-webhook', handlePayosWebhook);

// Redirect URLs (public)
router.get('/return', returnUrl);
router.get('/cancel', cancelUrl);

export default router;

