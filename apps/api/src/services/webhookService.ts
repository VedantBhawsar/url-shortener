import type Stripe from 'stripe';
import { stripe } from '../lib/stripe';
import { STRIPE_WEBHOOK_SECRET } from '../config/constant';
import { subscriptionRepository } from '../repositories/subscriptionRepository';
import type { SubscriptionStatus } from '../../generated/prisma/client';
import type { Result } from '../types/result';

// ─── Stripe → Internal Status Mapping ────────────────────────────────────────

function mapStripeStatus(stripeStatus: Stripe.Subscription.Status): SubscriptionStatus {
  switch (stripeStatus) {
    case 'active':
      return 'ACTIVE';
    case 'past_due':
    case 'unpaid':
      return 'PAST_DUE';
    case 'canceled':
    case 'incomplete_expired':
      return 'CANCELED';
    case 'paused':
      return 'EXPIRED';
    default:
      return 'ACTIVE';
  }
}

/**
 * Extracts billing period dates from the first SubscriptionItem.
 * In Stripe API >=2026-03-25.dahlia, current_period_* moved from
 * Subscription to SubscriptionItem.
 */
function extractPeriodDates(stripeSub: Stripe.Subscription): {
  currentPeriodStart: Date | undefined;
  currentPeriodEnd: Date | undefined;
} {
  const firstItem = stripeSub.items.data[0];
  if (!firstItem) return { currentPeriodStart: undefined, currentPeriodEnd: undefined };
  return {
    currentPeriodStart: new Date(firstItem.current_period_start * 1000),
    currentPeriodEnd: new Date(firstItem.current_period_end * 1000),
  };
}

// ─── Event Handlers ───────────────────────────────────────────────────────────

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session): Promise<void> {
  if (session.mode !== 'subscription' || !session.subscription) return;

  const stripeSubscriptionId =
    typeof session.subscription === 'string' ? session.subscription : session.subscription.id;

  const stripeCustomerId =
    typeof session.customer === 'string' ? session.customer : (session.customer?.id ?? '');

  const stripeSub = await stripe.subscriptions.retrieve(stripeSubscriptionId);
  const userId =
    (stripeSub.metadata as Record<string, string>)['userId'] ??
    (session.metadata as Record<string, string> | null)?.['userId'] ??
    '';

  if (!userId) {
    return;
  }

  const { currentPeriodStart, currentPeriodEnd } = extractPeriodDates(stripeSub);

  await subscriptionRepository.upsertByStripeCustomerId(stripeCustomerId, userId, {
    stripeSubscriptionId,
    stripePriceId: stripeSub.items.data[0]?.price.id,
    status: mapStripeStatus(stripeSub.status),
    currentPeriodStart,
    currentPeriodEnd,
    cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
  });
}

async function handleSubscriptionUpdated(stripeSub: Stripe.Subscription): Promise<void> {
  const stripeCustomerId =
    typeof stripeSub.customer === 'string' ? stripeSub.customer : stripeSub.customer.id;

  const existing = await subscriptionRepository.findByStripeCustomerId(stripeCustomerId);
  if (!existing) {
    return;
  }

  const { currentPeriodStart, currentPeriodEnd } = extractPeriodDates(stripeSub);

  await subscriptionRepository.updateById(existing.id, {
    stripeSubscriptionId: stripeSub.id,
    stripePriceId: stripeSub.items.data[0]?.price.id,
    status: mapStripeStatus(stripeSub.status),
    currentPeriodStart,
    currentPeriodEnd,
    cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
  });
}

async function handleSubscriptionDeleted(stripeSub: Stripe.Subscription): Promise<void> {
  const stripeCustomerId =
    typeof stripeSub.customer === 'string' ? stripeSub.customer : stripeSub.customer.id;

  const existing = await subscriptionRepository.findByStripeCustomerId(stripeCustomerId);
  if (!existing) return;

  await subscriptionRepository.updateById(existing.id, {
    status: 'CANCELED',
    cancelAtPeriodEnd: false,
  });
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
  const stripeCustomerId =
    typeof invoice.customer === 'string' ? invoice.customer : (invoice.customer?.id ?? '');

  if (!stripeCustomerId) return;

  // In API >=2026-03-25.dahlia, subscription lives under parent.subscription_details
  const subscriptionId =
    invoice.parent?.type === 'subscription_details'
      ? invoice.parent.subscription_details?.subscription
      : null;

  if (!subscriptionId) return;

  const stripeSubId = typeof subscriptionId === 'string' ? subscriptionId : subscriptionId.id;

  const stripeSub = await stripe.subscriptions.retrieve(stripeSubId);
  const { currentPeriodStart, currentPeriodEnd } = extractPeriodDates(stripeSub);

  const existing = await subscriptionRepository.findByStripeCustomerId(stripeCustomerId);
  if (!existing) return;

  await subscriptionRepository.updateById(existing.id, {
    status: 'ACTIVE',
    currentPeriodStart,
    currentPeriodEnd,
  });
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  const stripeCustomerId =
    typeof invoice.customer === 'string' ? invoice.customer : (invoice.customer?.id ?? '');

  if (!stripeCustomerId) return;

  const existing = await subscriptionRepository.findByStripeCustomerId(stripeCustomerId);
  if (!existing) return;

  await subscriptionRepository.updateById(existing.id, { status: 'PAST_DUE' });
}

// ─── Webhook Service ──────────────────────────────────────────────────────────

export const webhookService = {
  /**
   * Validates the Stripe webhook signature and processes the event.
   * MUST receive the raw request body (Buffer), not parsed JSON.
   */
  processEvent: async (
    rawBody: Buffer,
    signature: string,
  ): Promise<Result<{ received: boolean }>> => {
    let event: Stripe.Event;

    try {
      event = await stripe.webhooks.constructEventAsync(rawBody, signature, STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.error('[webhook] signature verification failed:', err);
      return { data: null, error: 'Webhook signature verification failed' };
    }

    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
          break;

        case 'customer.subscription.updated':
          await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
          break;

        case 'customer.subscription.deleted':
          await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;

        case 'invoice.payment_succeeded':
          await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
          break;

        case 'invoice.payment_failed':
          await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
          break;

        default:
          console.info(`[webhook] unhandled event type: ${event.type}`);
      }

      return { data: { received: true }, error: null };
    } catch (err) {
      console.error(`[webhook] error processing event ${event.type}:`, err);
      return { data: null, error: `Failed to process webhook event: ${event.type}` };
    }
  },
};
