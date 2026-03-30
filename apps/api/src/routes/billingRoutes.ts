import { Router, raw } from 'express';
import { billingController } from '../controllers/billingController';
import { authMiddleware } from '../middleware/authMiddleware';

export const billingRouter = Router();

// ─── Webhook route (raw body BEFORE json middleware) ─────────────────────────
// express.raw() parses the body as Buffer — required for Stripe signature verification.
// This route must be defined BEFORE the json() middleware is applied at the app level,
// which is handled by mounting this router in server.ts before express.json().
billingRouter.post('/webhook', raw({ type: 'application/json' }), billingController.handleWebhook);

// ─── Authenticated billing routes ─────────────────────────────────────────────
billingRouter.post(
  '/create-checkout-session',
  authMiddleware,
  billingController.createCheckoutSession,
);

billingRouter.get('/subscription-status', authMiddleware, billingController.getSubscriptionStatus);

billingRouter.post('/cancel', authMiddleware, billingController.cancelSubscription);

billingRouter.post('/resume', authMiddleware, billingController.resumeSubscription);
