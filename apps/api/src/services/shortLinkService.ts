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
      // SECURITY: validate originalUrl before persisting
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

      const newShortLink = await shortLinkRepository.create({
        originalUrl: payload.originalUrl,
        shortUrl,
        userId: payload.userId,
      });

      return { data: newShortLink, error: null };
    } catch {
      return { data: null, error: 'Failed to create short link' };
    }
  },

  // SECURITY FIX: accepts userId so ownership is enforced
  getShortLinkById: async (id: string, userId: string): Promise<Result<ShortLink>> => {
    try {
      const shortLink = await shortLinkRepository.findById(id);
      if (!shortLink) return { data: null, error: 'Short link not found' };

      // SECURITY: prevent cross-user information disclosure
      if (shortLink.userId !== userId) {
        return { data: null, error: 'Short link not found' };
      }

      return { data: shortLink, error: null };
    } catch {
      return { data: null, error: 'Failed to get short link' };
    }
  },

  getShortLinkByShortUrl: async (shortUrl: string): Promise<Result<ShortLink>> => {
    try {
      const shortLink = await shortLinkRepository.findByShortUrl(shortUrl);
      if (!shortLink) return { data: null, error: 'Short link not found' };
      if (!shortLink.status) return { data: null, error: 'Short link is inactive' };
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

  // SECURITY FIX: accepts userId so ownership is enforced
  updateShortLink: async (
    id: string,
    payload: UpdateShortLinkPayload,
    userId: string,
  ): Promise<Result<ShortLink>> => {
    try {
      const shortLink = await shortLinkRepository.findById(id);
      if (!shortLink) return { data: null, error: 'Short link not found' };

      // SECURITY: prevent cross-user modification
      if (shortLink.userId !== userId) {
        return { data: null, error: 'Short link not found' };
      }

      // EDGE CASE: validate new originalUrl if provided
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

      // BUG FIX: delete associated Click rows first to avoid FK constraint violation
      await clickRepository.deleteAllByShortLinkId(id);

      const deleted = await shortLinkRepository.delete(id);
      return { data: deleted, error: null };
    } catch {
      return { data: null, error: 'Failed to delete short link' };
    }
  },

  /** Called on every redirect — records the click and increments the counter */
  recordClick: async (payload: RecordClickPayload): Promise<Result<Click>> => {
    try {
      const click = await clickRepository.create(payload);
      await shortLinkRepository.incrementClicks(payload.shortLinkId);
      return { data: click, error: null };
    } catch {
      return { data: null, error: 'Failed to record click' };
    }
  },

  // SECURITY FIX: accepts userId so ownership is enforced
  getAnalytics: async (
    shortLinkId: string,
    userId: string,
  ): Promise<Result<ShortLinkWithClicks>> => {
    try {
      const shortLinkWithClicks = await shortLinkRepository.findByIdWithClicks(shortLinkId);
      if (!shortLinkWithClicks) return { data: null, error: 'Short link not found' };

      // SECURITY: prevent cross-user analytics disclosure
      if (shortLinkWithClicks.userId !== userId) {
        return { data: null, error: 'Short link not found' };
      }

      return { data: shortLinkWithClicks, error: null };
    } catch {
      return { data: null, error: 'Failed to get analytics' };
    }
  },
};
