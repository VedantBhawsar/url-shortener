import type { ShortLink, Click } from '../../generated/prisma/client';
import type { Result } from '../types/result';
import type {
  CreateShortLinkPayload,
  UpdateShortLinkPayload,
  ShortLinkWithClicks,
  RecordClickPayload,
} from '../types/shortLink';
import { shortLinkRepository } from '../repositories/shortLinkRepository';
import { clickRepository } from '../repositories/clickRepository';
import { generateUniqueShortUrl } from '../lib/generateShortUrl';
import { billingService } from './billingService';
import { PLANS } from '../config/plans';

/** Validates that a string is an absolute http/https URL. */
function isValidHttpUrl(raw: string): boolean {
  try {
    const { protocol } = new URL(raw);
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
}

export const shortLinkService = {
  createShortLink: async (payload: CreateShortLinkPayload): Promise<Result<ShortLink>> => {
    try {
      if (!isValidHttpUrl(payload.originalUrl)) {
        return { data: null, error: 'originalUrl must be a valid http or https URL' };
      }

      let shortUrl = payload.shortUrl;

      if (shortUrl) {
        const exists = await shortLinkRepository.findByShortUrl(shortUrl);
        if (exists) return { data: null, error: 'Short URL already exists' };
      } else {
        shortUrl = await generateUniqueShortUrl(payload.originalUrl);
      }

      // Auto-apply default expiry for free plan users if none provided
      let expiresAt = payload.expiresAt;
      if (!expiresAt) {
        const { planId } = await billingService.getUserPlanInfo(payload.userId);
        const plan = PLANS[planId];
        if (plan.defaultExpiryDays > 0) {
          expiresAt = new Date(Date.now() + plan.defaultExpiryDays * 24 * 60 * 60 * 1000);
        }
      }

      const newShortLink = await shortLinkRepository.create({
        originalUrl: payload.originalUrl,
        shortUrl,
        userId: payload.userId,
        expiresAt,
        blockedRegions: payload.blockedRegions ?? [],
      });

      return { data: newShortLink, error: null };
    } catch {
      return { data: null, error: 'Failed to create short link' };
    }
  },

  getShortLinkById: async (id: string, userId: string): Promise<Result<ShortLink>> => {
    try {
      const shortLink = await shortLinkRepository.findById(id);
      if (!shortLink) return { data: null, error: 'Short link not found' };

      if (shortLink.userId !== userId) {
        return { data: null, error: 'Short link not found' };
      }

      return { data: shortLink, error: null };
    } catch {
      return { data: null, error: 'Failed to get short link' };
    }
  },

  getShortLinkByShortUrl: async (
    shortUrl: string,
    visitorCountry?: string,
  ): Promise<Result<ShortLink>> => {
    try {
      const shortLink = await shortLinkRepository.findByShortUrl(shortUrl);
      if (!shortLink) return { data: null, error: 'Short link not found' };
      if (!shortLink.status) return { data: null, error: 'Short link is inactive' };

      // Expiry check
      if (shortLink.expiresAt && shortLink.expiresAt < new Date()) {
        return { data: null, error: 'Short link has expired' };
      }

      // Region blocking check
      if (
        visitorCountry &&
        shortLink.blockedRegions.length > 0 &&
        shortLink.blockedRegions.includes(visitorCountry.toUpperCase())
      ) {
        return { data: null, error: 'This link is not available in your region' };
      }

      return { data: shortLink, error: null };
    } catch {
      return { data: null, error: 'Failed to get short link' };
    }
  },

  getAllShortLinksByUser: async (userId: string): Promise<Result<ShortLink[]>> => {
    try {
      const shortLinks = await shortLinkRepository.findAllByUserId(userId);
      return { data: shortLinks, error: null };
    } catch {
      return { data: null, error: 'Failed to get short links' };
    }
  },

  updateShortLink: async (
    id: string,
    payload: UpdateShortLinkPayload,
    userId: string,
  ): Promise<Result<ShortLink>> => {
    try {
      const shortLink = await shortLinkRepository.findById(id);
      if (!shortLink) return { data: null, error: 'Short link not found' };

      if (shortLink.userId !== userId) {
        return { data: null, error: 'Short link not found' };
      }

      if (payload.originalUrl !== undefined && !isValidHttpUrl(payload.originalUrl)) {
        return { data: null, error: 'originalUrl must be a valid http or https URL' };
      }

      const updated = await shortLinkRepository.update(id, payload);
      if (!updated) return { data: null, error: 'Short link not found' };
      return { data: updated, error: null };
    } catch {
      return { data: null, error: 'Failed to update short link' };
    }
  },

  deleteShortLink: async (id: string, userId: string): Promise<Result<ShortLink>> => {
    try {
      const shortLink = await shortLinkRepository.findById(id);

      if (!shortLink) {
        return { data: null, error: 'Short link not found' };
      }

      if (shortLink.userId !== userId) {
        return { data: null, error: 'Unauthorized to delete this short link' };
      }

      await clickRepository.deleteAllByShortLinkId(id);
      const deleted = await shortLinkRepository.delete(id);
      return { data: deleted, error: null };
    } catch {
      return { data: null, error: 'Failed to delete short link' };
    }
  },

  recordClick: async (payload: RecordClickPayload): Promise<Result<Click>> => {
    try {
      const click = await clickRepository.create(payload);
      await shortLinkRepository.incrementClicks(payload.shortLinkId);
      return { data: click, error: null };
    } catch {
      return { data: null, error: 'Failed to record click' };
    }
  },

  /**
   * Returns analytics data.
   * Free plan users receive aggregated totals only (no per-click detail).
   * Premium users receive the full click history.
   */
  getAnalytics: async (
    shortLinkId: string,
    userId: string,
  ): Promise<Result<ShortLinkWithClicks>> => {
    try {
      const shortLinkWithClicks = await shortLinkRepository.findByIdWithClicks(shortLinkId);
      if (!shortLinkWithClicks) return { data: null, error: 'Short link not found' };

      if (shortLinkWithClicks.userId !== userId) {
        return { data: null, error: 'Short link not found' };
      }

      const { plan } = await billingService.getUserPlanInfo(userId);

      // For free plan: strip out detailed click data, keep only aggregate count
      if (!plan.fullAnalytics) {
        return {
          data: {
            ...shortLinkWithClicks,
            clicks: [], // no per-click detail on free plan
          },
          error: null,
        };
      }

      return { data: shortLinkWithClicks, error: null };
    } catch {
      return { data: null, error: 'Failed to get analytics' };
    }
  },
};
