import type { Subscription, SubscriptionStatus } from '../../generated/prisma/client';
import type { PlanId, PlanConfig } from '../config/plans';

// ─── Subscription Types ───────────────────────────────────────────────────────

export type { Subscription, SubscriptionStatus };

export interface UserPlanInfo {
  planId: PlanId;
  plan: PlanConfig;
  subscription: Subscription | null;
}

// ─── Billing API Response Types ───────────────────────────────────────────────

export interface SubscriptionStatusResponse {
  planId: PlanId;
  planName: string;
  status: SubscriptionStatus | 'free';
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  usage: {
    linksUsed: number;
    linksLimit: number; // -1 = unlimited
    percentage: number; // 0-100, -1 if unlimited
  };
  features: {
    customExpiry: boolean;
    regionBlocking: boolean;
    fullAnalytics: boolean;
  };
  upgradeRequired: boolean;
}

export interface CheckoutSessionResponse {
  url: string;
}

// ─── Feature Gate Error Response ──────────────────────────────────────────────

export interface FeatureGateError {
  error: string;
  upgradeRequired: true;
  currentPlan: PlanId;
  feature: 'link_limit' | 'custom_expiry' | 'region_blocking' | 'full_analytics';
}
