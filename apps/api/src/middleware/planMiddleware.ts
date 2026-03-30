import type { Request, Response, NextFunction } from 'express';
import { billingService } from '../services/billingService';
import { subscriptionRepository } from '../repositories/subscriptionRepository';
import type { FeatureGateError } from '../types/billing';

// ─── Plan Enforcement Middleware ──────────────────────────────────────────────

/**
 * Blocks link creation when the user has reached their plan's link limit.
 * Returns 403 with upgradeRequired: true so the frontend can show the upgrade
 * prompt without a separate call.
 */
export async function checkLinkLimit(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const userId = req.user?.sub;
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const { planId, plan } = await billingService.getUserPlanInfo(userId);

  // Unlimited plan — skip check
  if (plan.maxLinks === -1) {
    next();
    return;
  }

  const linksUsed = await subscriptionRepository.countByUserId(userId);

  if (linksUsed >= plan.maxLinks) {
    const body: FeatureGateError = {
      error: `You have reached the ${plan.maxLinks}-link limit on the ${plan.name} plan. Upgrade to Premium for unlimited links.`,
      upgradeRequired: true,
      currentPlan: planId,
      feature: 'link_limit',
    };
    res.status(403).json(body);
    return;
  }

  next();
}

/**
 * Blocks setting a custom expiresAt on links for users on the Free plan.
 * Applied to POST /links and PATCH /links/:id when expiresAt is present.
 */
export async function checkExpiryAccess(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  // Pass through if expiresAt is not being set
  if (req.body?.expiresAt === undefined) {
    next();
    return;
  }

  const userId = req.user?.sub;
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const { planId, plan } = await billingService.getUserPlanInfo(userId);

  if (!plan.customExpiry) {
    const body: FeatureGateError = {
      error: 'Custom expiry dates require a Premium subscription.',
      upgradeRequired: true,
      currentPlan: planId,
      feature: 'custom_expiry',
    };
    res.status(403).json(body);
    return;
  }

  next();
}

/**
 * Blocks setting blockedRegions on links for users on the Free plan.
 * Applied to POST /links and PATCH /links/:id when blockedRegions is present.
 */
export async function checkRegionBlockingAccess(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const regions = req.body?.blockedRegions;
  // Pass through if not set or empty array
  if (!regions || (Array.isArray(regions) && regions.length === 0)) {
    next();
    return;
  }

  const userId = req.user?.sub;
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const { planId, plan } = await billingService.getUserPlanInfo(userId);

  if (!plan.regionBlocking) {
    const body: FeatureGateError = {
      error: 'Region blocking requires a Premium subscription.',
      upgradeRequired: true,
      currentPlan: planId,
      feature: 'region_blocking',
    };
    res.status(403).json(body);
    return;
  }

  next();
}
