import type { Request, Response } from 'express';
import { shortLinkService } from '../services/shortLinkService';
import { eventPublisher } from '../services/eventPublisher';
import type {
  CreateShortLinkPayload,
  UpdateShortLinkPayload,
  RecordClickPayload,
} from '../types/shortLink';
import type { ShortLink } from '../../generated/prisma/client';
import { cache } from '../server';
import { shortLinkCreateSchema, shortLinkUpdateSchema } from '../validations/shortLink.schema';
import geoip from 'geoip-lite';
import { parseUserAgent } from '../lib/parseUserAgent';

export const shortLinkController = {
  /** POST /api/v1/links */
  createShortLink: async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.sub;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const safeBody = shortLinkCreateSchema.parse(req.body);
    const { originalUrl, shortUrl, expiresAt, blockedRegions } = safeBody;

    const payload: CreateShortLinkPayload = {
      originalUrl,
      shortUrl,
      userId,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      blockedRegions,
    };
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

    const safeBody = shortLinkUpdateSchema.parse(req.body);
    const payload: UpdateShortLinkPayload = {
      originalUrl: safeBody.originalUrl,
      status: safeBody.status,
      blockedRegions: safeBody.blockedRegions,
      expiresAt:
        safeBody.expiresAt === null
          ? null
          : safeBody.expiresAt !== undefined
            ? new Date(safeBody.expiresAt)
            : undefined,
    };

    const result = await shortLinkService.updateShortLink(req.params.id, payload, userId);
    if (result.error) {
      res.status(400).json({ error: result.error });
      return;
    }

    if (result.data?.shortUrl) {
      await cache.delete(result.data.shortUrl);
    }

    res.status(200).json({ data: result.data });
  },

  /** DELETE /api/v1/links/:id */
  deleteShortLink: async (req: Request<{ id: string }>, res: Response): Promise<void> => {
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

    if (result.data?.shortUrl) {
      await cache.delete(result.data.shortUrl);
    }

    res.status(200).json({ data: result.data });
  },

  /** GET /api/v1/redirect/:shortUrl — public redirect endpoint */
  redirect: async (req: Request<{ shortUrl: string }>, res: Response): Promise<void> => {
    const { shortUrl } = req.params;
    const ip = String(req.headers['x-forwarded-for'])?.split(',')[0] || req.socket.remoteAddress;

    // Resolve geo data before cache lookup so we can apply region blocking
    const geo = await geoip.lookup(ip || '');
    const visitorCountry = geo?.country ?? '';

    let result: ShortLink | null = null;
    try {
      result = (await cache(shortUrl, async () => {
        const response = await shortLinkService.getShortLinkByShortUrl(shortUrl);

        if (response.error || !response.data) {
          throw new Error(response.error || 'Short link not found');
        }

        return response.data;
      })) as ShortLink;
    } catch (error) {
      res.status(404).json({ error: (error as Error).message || 'Short link is not found' });
      return;
    }

    if (!result || !result.status) {
      res.status(404).json({ error: 'Short link is inactive' });
      return;
    }

    // Expiry check (cached result may not be re-fetched)
    if (result.expiresAt && new Date(result.expiresAt) < new Date()) {
      await cache.delete(shortUrl);
      res.status(410).json({ error: 'This short link has expired' });
      return;
    }

    // Region blocking check
    if (
      visitorCountry &&
      result.blockedRegions &&
      result.blockedRegions.length > 0 &&
      result.blockedRegions.includes(visitorCountry.toUpperCase())
    ) {
      res.status(403).json({ error: 'This link is not available in your region' });
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

    const rawUserAgent = req.headers['user-agent'] ?? '';
    const { browser, os, device } = parseUserAgent(rawUserAgent);

    const clickPayload: RecordClickPayload = {
      shortLinkId: result.id,
      ipAddress: ip || '',
      userAgent: rawUserAgent,
      referer: req.headers['referer'] ?? '',
      country: visitorCountry,
      city: geo?.city ?? '',
      region: geo?.region ?? '',
      latitude: geo?.ll?.[0] ?? 0,
      longitude: geo?.ll?.[1] ?? 0,
      browser,
      os,
      device,
    };

    eventPublisher.publishClickEvent(clickPayload).catch(console.error);

    res.status(200).json({
      data: {
        originalUrl: targetUrl.toString(),
        shortUrl: result.shortUrl,
      },
    });
  },

  /** GET /api/v1/links/:id/analytics */
  getAnalytics: async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    const userId = req.user?.sub;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const result = await shortLinkService.getAnalytics(req.params.id, userId);
    if (result.error) {
      res.status(404).json({ error: result.error });
      return;
    }
    res.status(200).json({ data: result.data });
  },
};
