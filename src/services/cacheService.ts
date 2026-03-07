import type { RedisClient as RedisClientType } from 'bun';

interface CacheEntry<T> {
  value: T;
  expiry: number;
}

export function createRedisFallbackCache<T>(redis: RedisClientType, ttl: number = 60) {
  const memoryCache = new Map<string, CacheEntry<T>>();

  return async function getOrFetch(key: string, resolver: () => Promise<T>): Promise<T> {
    const now = Date.now();

    // -------------------------
    // 1. Try Redis First
    // -------------------------

    try {
      const redisValue = await redis.get(key);

      if (redisValue) {
        return JSON.parse(redisValue);
      }

      const result = await resolver();

      await redis.setex(key, ttl, JSON.stringify(result));

      return result;
    } catch {
      const cached = memoryCache.get(key);

      if (cached && cached.expiry > now) {
        return cached.value;
      }

      const result = await resolver();

      memoryCache.set(key, {
        value: result,
        expiry: now + ttl * 1000,
      });

      return result;
    }
  };
}
