import type { Request, Response, NextFunction } from 'express';
import { LRUCache } from 'lru-cache';
import { redisClient } from '../database/redis';

type KeyGenerator = (req: Request) => string | null | undefined;

interface RateLimitOptions {
  name: string;
  windowMs: number;
  max: number;
  keyGenerator: KeyGenerator;
  message?: string;
  lruMax?: number;
}

export function createRateLimiter(options: RateLimitOptions) {
  const { name, windowMs, max, keyGenerator, message, lruMax = 10000 } = options;

  const memoryStore = new LRUCache<string, number>({
    max: lruMax,
    ttl: windowMs,
    updateAgeOnGet: false,
  });

  const windowSeconds = Math.ceil(windowMs / 1000);

  return async function rateLimiter(req: Request, res: Response, next: NextFunction) {
    const identifier = keyGenerator(req);

    if (!identifier) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const windowId = Math.floor(Date.now() / windowMs);
    const key = `rl:${name}:${identifier}:${windowId}`;

    try {
      const current = await redisClient.incr(key);

      if (current === 1) {
        await redisClient.expire(key, windowSeconds);
      }

      if (current > max) {
        res.status(429).json({ error: message ?? 'Too many requests' });
        return;
      }

      next();
    } catch {
      const current = (memoryStore.get(key) ?? 0) + 1;
      memoryStore.set(key, current);

      if (current > max) {
        res.status(429).json({ error: message ?? 'Too many requests' });
        return;
      }

      next();
    }
  };
}

export const rateLimitKeys = {
  ip: (req: Request) => req.ip ?? req.connection?.remoteAddress ?? 'unknown',
  user: (req: Request) => req.user?.sub,
};
