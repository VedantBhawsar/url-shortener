import type { RedisClient as RedisClientType } from 'bun';
import { LRUCache } from 'lru-cache';

interface CacheConfig {
  maxSize?: number; // Maximum number of items in cache
  ttl?: number; // Time to live in seconds
}

export function createRedisFallbackCache<T extends Record<string, unknown>>(
  redis: RedisClientType,
  config: CacheConfig = {},
) {
  const { maxSize = 10000, ttl = 60 } = config;

  const memoryCache = new LRUCache<string, T>({
    max: maxSize,
    ttl: ttl * 1000, // Convert seconds to milliseconds
    updateAgeOnGet: true, // Reset TTL on access
  });

  return async function getOrFetch(key: string, resolver: () => Promise<T>): Promise<T> {
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
      // -------------------------
      // 2. Fallback to In-Memory LRU Cache
      // -------------------------

      const cached = memoryCache.get(key);

      if (cached) {
        return cached;
      }

      const result = await resolver();

      memoryCache.set(key, result);

      return result;
    }
  };
}
