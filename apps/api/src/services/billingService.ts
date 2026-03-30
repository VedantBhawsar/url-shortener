import { stripe } from '../lib/stripe';
import { subscriptionRepository } from '../repositories/subscriptionRepository';
import { PLANS, PLAN_ID, SOFT_LIMIT_THRESHOLD } from '../config/plans';
import type { PlanId, PlanConfig } from '../config/plans';
import type {
  SubscriptionStatusResponse,
  CheckoutSessionResponse,
  UserPlanInfo,
} from '../types/billing';
import type { Result } from '../types/result';
import type { Subscription } from '../../generated/prisma/client';
import { CLIENT_URL } from '../config/constant';

// ─── Billing Service ──────────────────────────────────────────────────────────

/**
 * Resolves the effective plan for a user by inspecting their subscription.
 * - No subscription → free
 * - ACTIVE or PAST_DUE within period → premium
 * - Everything else → free
 */
function resolvePlanId(subscription: Subscription | null): PlanId {
  if (!subscription) return PLAN_ID.FREE;

  if (subscription.status === 'ACTIVE') return PLAN_ID.PREMIUM;

  if (subscription.status === 'PAST_DUE') {
    // Grace period: treat as premium until period ends
    if (subscription.currentPeriodEnd && subscription.currentPeriodEnd > new Date()) {
      return PLAN_ID.PREMIUM;
    }
  }

  return PLAN_ID.FREE;
}

export const billingService = {
  /**
   * Returns the user's current plan config (resolved from their subscription).
   * Cheap to call — just fetches one subscription row.
   */
  getUserPlanInfo: async (userId: string): Promise<UserPlanInfo> => {
    const subscription = await subscriptionRepository.findByUserId(userId);
    const planId = resolvePlanId(subscription);
    return { planId, plan: PLANS[planId], subscription };
  },

  /**
   * Creates a Stripe Checkout Session for upgrading to premium.
   * - Creates a Stripe Customer on first checkout if one doesn't exist yet.
   * - Returns the hosted checkout URL.
   */
  createCheckoutSession: async (
    userId: string,
    email: string,
  ): Promise<Result<CheckoutSessionResponse>> => {
    try {
      const premiumPlan: PlanConfig = PLANS[PLAN_ID.PREMIUM];

      if (!premiumPlan.stripePriceId) {
        return { data: null, error: 'Premium plan is not configured. Contact support.' };
      }

      // Resolve or create the Stripe Customer
      let stripeCustomerId: string;
      const existingSub = await subscriptionRepository.findByUserId(userId);

      if (existingSub?.stripeCustomerId) {
        stripeCustomerId = existingSub.stripeCustomerId;
      } else {
        const customer = await stripe.customers.create({ email, metadata: { userId } });
        stripeCustomerId = customer.id;
      }

      const session = await stripe.checkout.sessions.create({
        customer: stripeCustomerId,
        payment_method_types: ['card'],
        mode: 'subscription',
        line_items: [{ price: premiumPlan.stripePriceId, quantity: 1 }],
        success_url: `${CLIENT_URL}/dashboard/billing?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${CLIENT_URL}/dashboard/billing?canceled=true`,
        subscription_data: {
          metadata: { userId },
        },
        allow_promotion_codes: true,
      });

      if (!session.url) {
        return { data: null, error: 'Failed to create checkout session' };
      }

      return { data: { url: session.url }, error: null };
    } catch (err) {
      console.error('[billingService.createCheckoutSession]', err);
      return { data: null, error: 'Failed to create checkout session' };
    }
  },

  /**
   * Returns the full subscription status response for the authenticated user.
   */
  getSubscriptionStatus: async (userId: string): Promise<Result<SubscriptionStatusResponse>> => {
    try {
      const { planId, plan, subscription } = await billingService.getUserPlanInfo(userId);
      const linksUsed = await subscriptionRepository.countByUserId(userId);

      const linksLimit = plan.maxLinks;
      const percentage = linksLimit === -1 ? -1 : Math.round((linksUsed / linksLimit) * 100);

      const response: SubscriptionStatusResponse = {
        planId,
        planName: plan.name,
        status: subscription?.status ?? 'free',
        currentPeriodEnd: subscription?.currentPeriodEnd?.toISOString() ?? null,
        cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd ?? false,
        usage: { linksUsed, linksLimit, percentage },
        features: {
          customExpiry: plan.customExpiry,
          regionBlocking: plan.regionBlocking,
          fullAnalytics: plan.fullAnalytics,
        },
        upgradeRequired: false,
      };

      return { data: response, error: null };
    } catch (err) {
      console.error('[billingService.getSubscriptionStatus]', err);
      return { data: null, error: 'Failed to fetch subscription status' };
    }
  },

  /**
   * Cancels subscription at period end (does not cancel immediately).
   */
  cancelSubscription: async (userId: string): Promise<Result<{ message: string }>> => {
    try {
      const subscription = await subscriptionRepository.findByUserId(userId);

      if (!subscription?.stripeSubscriptionId) {
        return { data: null, error: 'No active subscription found' };
      }

      if (subscription.status !== 'ACTIVE') {
        return { data: null, error: 'Subscription is not active' };
      }

      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });

      await subscriptionRepository.updateById(subscription.id, {
        cancelAtPeriodEnd: true,
      });

      return { data: { message: 'Subscription will be canceled at period end' }, error: null };
    } catch (err) {
      console.error('[billingService.cancelSubscription]', err);
      return { data: null, error: 'Failed to cancel subscription' };
    }
  },

  /**
   * Resumes a subscription that is scheduled to cancel at period end.
   * Sets cancel_at_period_end to false so the subscription renews normally.
   */
  resumeSubscription: async (userId: string): Promise<Result<{ message: string }>> => {
    try {
      const subscription = await subscriptionRepository.findByUserId(userId);

      if (!subscription?.stripeSubscriptionId) {
        return { data: null, error: 'No active subscription found' };
      }

      if (subscription.status !== 'ACTIVE') {
        return { data: null, error: 'Subscription is not active' };
      }

      if (!subscription.cancelAtPeriodEnd) {
        return { data: null, error: 'Subscription is not scheduled for cancellation' };
      }

      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: false,
      });

      await subscriptionRepository.updateById(subscription.id, {
        cancelAtPeriodEnd: false,
      });

      return { data: { message: 'Subscription renewal resumed successfully' }, error: null };
    } catch (err) {
      console.error('[billingService.resumeSubscription]', err);
      return { data: null, error: 'Failed to resume subscription' };
    }
  },

  /**
   * Returns soft-limit warning state.
   * Returns true when usage >= SOFT_LIMIT_THRESHOLD but < 100% of limit.
   */
  isSoftLimitReached: async (userId: string): Promise<boolean> => {
    const { plan } = await billingService.getUserPlanInfo(userId);
    if (plan.maxLinks === -1) return false;
    const linksUsed = await subscriptionRepository.countByUserId(userId);
    const ratio = linksUsed / plan.maxLinks;
    return ratio >= SOFT_LIMIT_THRESHOLD && ratio < 1;
  },
};
