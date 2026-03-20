import { Router } from 'express';
import { shortLinkController } from '../controllers/shortLinkController';
import { authMiddleware } from '../middleware/authMiddleware';
import { createRateLimiter, rateLimitKeys } from '../middleware/rateLimit';

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

shortLinkRouter.post('/', shortLinkCreateLimiter, shortLinkController.createShortLink);
shortLinkRouter.get('/', shortLinkController.getAllShortLinks);
shortLinkRouter.get('/:id', shortLinkController.getShortLinkById);
shortLinkRouter.patch('/:id', shortLinkController.updateShortLink);
shortLinkRouter.delete('/:id', shortLinkController.deleteShortLink);
shortLinkRouter.get('/:id/analytics', shortLinkController.getAnalytics);
