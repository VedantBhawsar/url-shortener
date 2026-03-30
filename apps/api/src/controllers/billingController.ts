import type { Request, Response } from 'express';
import { billingService } from '../services/billingService';
import { webhookService } from '../services/webhookService';

// ─── Billing Controller ───────────────────────────────────────────────────────

export const billingController = {
  /** POST /api/v1/billing/create-checkout-session */
  createCheckoutSession: async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.sub;
    const email = req.user?.email;

    if (!userId || !email) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Prevent double-upgrades
    const { planId } = await billingService.getUserPlanInfo(userId);
    if (planId === 'premium') {
      res.status(400).json({ error: 'You already have an active premium subscription' });
      return;
    }

    const result = await billingService.createCheckoutSession(userId, email);
    if (result.error) {
      res.status(500).json({ error: result.error });
      return;
    }

    res.status(200).json({ data: result.data });
  },

  /** GET /api/v1/billing/subscription-status */
  getSubscriptionStatus: async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.sub;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const result = await billingService.getSubscriptionStatus(userId);
    if (result.error) {
      res.status(500).json({ error: result.error });
      return;
    }

    res.status(200).json({ data: result.data });
  },

  /** POST /api/v1/billing/cancel */
  cancelSubscription: async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.sub;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const result = await billingService.cancelSubscription(userId);
    if (result.error) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.status(200).json({ data: result.data });
  },

  /**
   * POST /api/v1/billing/webhook
   * Receives raw body — MUST be registered before express.json() middleware.
   * Validates Stripe signature before processing any event.
   */
  handleWebhook: async (req: Request, res: Response): Promise<void> => {
    const signature = req.headers['stripe-signature'];

    if (!signature || typeof signature !== 'string') {
      res.status(400).json({ error: 'Missing stripe-signature header' });
      return;
    }

    // req.body is a Buffer here (set by express.raw on the webhook route)
    const rawBody = req.body as Buffer;

    const result = await webhookService.processEvent(rawBody, signature);

    if (result.error) {
      // Return 400 for signature failures so Stripe knows to retry
      res.status(400).json({ error: result.error });
      return;
    }

    // Always return 200 quickly — processing is synchronous here but
    // Stripe considers anything ≥4xx a failure worth retrying
    res.status(200).json({ received: true });
  },
};
