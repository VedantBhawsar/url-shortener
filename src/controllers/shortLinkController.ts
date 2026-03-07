import type { Request, Response } from 'express';
import { shortLinkService } from '../services/shortLinkService';
import type {
  CreateShortLinkPayload,
  UpdateShortLinkPayload,
  RecordClickPayload,
} from '../types/shortLink';
import type { ShortLink } from '../../generated/prisma/client';
import { cache } from '../server';

export const shortLinkController = {
  /** POST /api/v1/links */
  createShortLink: async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.sub;

    // BUG FIX: separate auth check from validation — missing userId is a 401, not 400
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { originalUrl, shortUrl } = req.body as { originalUrl?: string; shortUrl?: string };

    if (!originalUrl) {
      res.status(400).json({ error: 'originalUrl is required' });
      return;
    }

    const payload: CreateShortLinkPayload = { originalUrl, shortUrl, userId };
    const result = await shortLinkService.createShortLink(payload);
    if (result.error) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.status(201).json({ data: result.data });
  },

  /** GET /api/v1/links/:id */
  getShortLinkById: async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    const userId = req.user?.sub;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // SECURITY FIX: pass userId so service can enforce ownership
    const result = await shortLinkService.getShortLinkById(req.params.id, userId);
    if (result.error) {
      res.status(404).json({ error: result.error });
      return;
    }
    res.status(200).json({ data: result.data });
  },

  /** GET /api/v1/links — returns all links for the authenticated user */
  getAllShortLinks: async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.sub;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const result = await shortLinkService.getAllShortLinksByUser(userId);
    if (result.error) {
      res.status(400).json({ error: result.error });
      return;
    }
    res.status(200).json({ data: result.data });
  },

  /** PATCH /api/v1/links/:id */
  updateShortLink: async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    const userId = req.user?.sub;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const payload = req.body as UpdateShortLinkPayload;

    // SECURITY FIX: pass userId so service can enforce ownership
    const result = await shortLinkService.updateShortLink(req.params.id, payload, userId);
    if (result.error) {
      res.status(400).json({ error: result.error });
      return;
    }
    res.status(200).json({ data: result.data });
  },

  /** DELETE /api/v1/links/:id */
  deleteShortLink: async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    // BUG FIX: was referencing undeclared `email` and `userId` variables;
    //          `userRepository.findByEmail` lookup was also entirely unnecessary.
    const userId = req.user?.sub;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const result = await shortLinkService.deleteShortLink(req.params.id, userId);
    if (result.error) {
      res.status(404).json({ error: result.error });
      return;
    }
    res.status(200).json({ data: result.data });
  },

  /** GET /:shortUrl — public redirect endpoint */
  redirect: async (req: Request<{ shortUrl: string }>, res: Response): Promise<void> => {
    const { shortUrl } = req.params;

    let result: ShortLink | null = null;
    try {
      result = (await cache(shortUrl, async () => {
        const response = await shortLinkService.getShortLinkByShortUrl(shortUrl);

        if (response.error || !response.data) {
          throw new Error('Short link not found');
        }

        return response.data;
      })) as ShortLink;
    } catch {
      res.status(404).json({ error: 'Short link not found' });
      return;
    }

    if (!result || !result.status) {
      res.status(404).json({ error: 'Short link is inactive' });
      return;
    }

    let targetUrl: URL;

    try {
      targetUrl = new URL(result.originalUrl);
    } catch {
      res.status(422).json({ error: 'Stored URL is malformed' });
      return;
    }

    if (targetUrl.protocol !== 'http:' && targetUrl.protocol !== 'https:') {
      res.status(422).json({ error: 'Stored URL has an unsafe protocol' });
      return;
    }

    const clickPayload: RecordClickPayload = {
      shortLinkId: result.id,
      ipAddress: req.ip ?? '',
      userAgent: req.headers['user-agent'] ?? '',
      referer: req.headers['referer'] ?? '',
      country: '',
      city: '',
      region: '',
      postalCode: '',
      latitude: 0,
      longitude: 0,
    };

    // async analytics
    shortLinkService.recordClick(clickPayload).catch(console.error);

    res.redirect(302, targetUrl.toString());
  },

  /** GET /api/v1/links/:id/analytics */
  getAnalytics: async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    const userId = req.user?.sub;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // SECURITY FIX: pass userId so service can enforce ownership
    const result = await shortLinkService.getAnalytics(req.params.id, userId);
    if (result.error) {
      res.status(404).json({ error: result.error });
      return;
    }
    res.status(200).json({ data: result.data });
  },
};
