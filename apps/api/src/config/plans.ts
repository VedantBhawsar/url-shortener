// ─── Plan Definitions ─────────────────────────────────────────────────────────
// Plans are defined as code constants (not DB rows) since we only have 2 plans.
// The stripePriceId is read from env at runtime.

export const PLAN_ID = {
  FREE: 'free',
  PREMIUM: 'premium',
} as const;

export type PlanId = (typeof PLAN_ID)[keyof typeof PLAN_ID];

export interface PlanConfig {
  id: PlanId;
  name: string;
  /** Maximum number of active short links. -1 = unlimited. */
  maxLinks: number;
  /** Auto-applied expiry in days for new links. 0 = no auto-expiry. */
  defaultExpiryDays: number;
  /** Whether user can set a custom expiresAt on links. */
  customExpiry: boolean;
  /** Whether user can set blockedRegions on links. */
  regionBlocking: boolean;
  /** Whether user has access to full per-click analytics. */
  fullAnalytics: boolean;
  /** Monthly price in cents (USD). 0 = free. */
  priceMonthly: number;
  /** Stripe Price ID — loaded from environment variable. */
  stripePriceId: string | null;
}

export const PLANS: Record<PlanId, PlanConfig> = {
  free: {
    id: 'free',
    name: 'Free',
    maxLinks: 10,
    defaultExpiryDays: 7,
    customExpiry: false,
    regionBlocking: false,
    fullAnalytics: false,
    priceMonthly: 0,
    stripePriceId: null,
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    maxLinks: -1,
    defaultExpiryDays: 0,
    customExpiry: true,
    regionBlocking: true,
    fullAnalytics: true,
    priceMonthly: 900, // $9.00/month
    stripePriceId: process.env['STRIPE_PREMIUM_PRICE_ID'] ?? null,
  },
};

/** Soft-limit threshold — show warning when user reaches this % of their link cap. */
export const SOFT_LIMIT_THRESHOLD = 0.8;
