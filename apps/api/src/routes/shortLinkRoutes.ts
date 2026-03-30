import { Router } from 'express';
import { shortLinkController } from '../controllers/shortLinkController';
import { authMiddleware } from '../middleware/authMiddleware';
import { createRateLimiter, rateLimitKeys } from '../middleware/rateLimit';
import {
  checkLinkLimit,
  checkExpiryAccess,
  checkRegionBlockingAccess,
} from '../middleware/planMiddleware';

export const shortLinkRouter = Router();

// All CRUD routes require authentication.
shortLinkRouter.use(authMiddleware);

const shortLinkCreateLimiter = createRateLimiter({
  name: 'links:create',
  windowMs: 60 * 1000,
  max: 20,
  keyGenerator: rateLimitKeys.user,
  message: 'Too many short links created. Please try again later.',
});

// Create: enforce link count limit + premium-only field access
shortLinkRouter.post(
  '/',
  shortLinkCreateLimiter,
  checkLinkLimit,
  checkExpiryAccess,
  checkRegionBlockingAccess,
  shortLinkController.createShortLink,
);

shortLinkRouter.get('/', shortLinkController.getAllShortLinks);
shortLinkRouter.get('/:id', shortLinkController.getShortLinkById);

// Update: enforce premium-only field access
shortLinkRouter.patch(
  '/:id',
  checkExpiryAccess,
  checkRegionBlockingAccess,
  shortLinkController.updateShortLink,
);

shortLinkRouter.delete('/:id', shortLinkController.deleteShortLink);
shortLinkRouter.get('/:id/analytics', shortLinkController.getAnalytics);
