import { Router } from 'express';
import { shortLinkController } from '../controllers/shortLinkController';
import { authMiddleware } from '../middleware/authMiddleware';

export const shortLinkRouter = Router();

// All CRUD routes require authentication.
shortLinkRouter.use(authMiddleware);

shortLinkRouter.post('/', shortLinkController.createShortLink);
shortLinkRouter.get('/', shortLinkController.getAllShortLinks);
shortLinkRouter.get('/:id', shortLinkController.getShortLinkById);
shortLinkRouter.patch('/:id', shortLinkController.updateShortLink);
shortLinkRouter.delete('/:id', shortLinkController.deleteShortLink);
shortLinkRouter.get('/:id/analytics', shortLinkController.getAnalytics);
