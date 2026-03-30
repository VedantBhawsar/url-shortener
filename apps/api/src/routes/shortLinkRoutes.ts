import { Router } from 'express';
import { shortLinkController } from '../controllers/shortLinkController';
import { authMiddleware } from '../middleware/authMiddleware';
import { createRateLimiter, rateLimitKeys } from '../middleware/rateLimit';
import {
  checkLinkLimit,
  checkExpiryAccess,
  checkRegionBlockingAccess,
} from '../middleware/planMiddleware';

/**
 * @swagger
 * tags:
 *   - name: Short Links
 *     description: Manage shortened URLs, analytics, and link operations
 */

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

/**
 * @swagger
 * /api/v1/links:
 *   post:
 *     tags:
 *       - Short Links
 *     summary: Create a new short link
 *     description: Create a shortened URL (rate limited to 20 per minute per user)
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               originalUrl:
 *                 type: string
 *                 format: uri
 *               shortUrl:
 *                 type: string
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *               blockedRegions:
 *                 type: array
 *                 items:
 *                   type: string
 *             required:
 *               - originalUrl
 *               - shortUrl
 *     responses:
 *       201:
 *         description: Short link created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ShortLink'
 *       400:
 *         description: Invalid input or duplicate short URL
 *       429:
 *         description: Rate limit exceeded
 *   get:
 *     tags:
 *       - Short Links
 *     summary: Get all short links
 *     description: Retrieve all short links created by the authenticated user
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of short links
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ShortLink'
 */

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

/**
 * @swagger
 * /api/v1/links/{id}:
 *   get:
 *     tags:
 *       - Short Links
 *     summary: Get a short link by ID
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Short link details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ShortLink'
 *       404:
 *         description: Short link not found
 *   patch:
 *     tags:
 *       - Short Links
 *     summary: Update a short link
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *               blockedRegions:
 *                 type: array
 *                 items:
 *                   type: string
 *               status:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Short link updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ShortLink'
 *   delete:
 *     tags:
 *       - Short Links
 *     summary: Delete a short link
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Short link deleted
 *       404:
 *         description: Short link not found
 */
shortLinkRouter.get('/:id', shortLinkController.getShortLinkById);

// Update: enforce premium-only field access
shortLinkRouter.patch(
  '/:id',
  checkExpiryAccess,
  checkRegionBlockingAccess,
  shortLinkController.updateShortLink,
);

shortLinkRouter.delete('/:id', shortLinkController.deleteShortLink);

/**
 * @swagger
 * /api/v1/links/{id}/analytics:
 *   get:
 *     tags:
 *       - Short Links
 *     summary: Get analytics for a short link
 *     description: Retrieve click statistics and geo-location data
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Analytics data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 clicksCount:
 *                   type: integer
 *                 clicks:
 *                   type: array
 *                   items:
 *                     type: object
 */
shortLinkRouter.get('/:id/analytics', shortLinkController.getAnalytics);
