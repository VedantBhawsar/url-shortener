import type { RedisClientType } from 'redis';
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

  const getOrFetch = async (key: string, resolver: () => Promise<T>): Promise<T> => {
    // -------------------------
    // 1. Try Redis First
    // -------------------------

    try {
      const redisValue = await redis.get(key);

      if (redisValue) {
        return JSON.parse(redisValue);
      }

      const result = await resolver();

      await redis.setEx(key, ttl, JSON.stringify(result));

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

  const cache = getOrFetch as typeof getOrFetch & {
    delete: (key: string) => Promise<void>;
    clear: () => Promise<void>;
  };

  cache.delete = async (key: string): Promise<void> => {
    try {
      await redis.del(key);
    } catch {
      // best-effort to remove stale entry, ignore Redis errors
    }
    memoryCache.delete(key);
  };

  cache.clear = async (): Promise<void> => {
    try {
      // Clearing all keys is a heavy operation; use carefully.
      if (typeof (redis as any).flushdb === 'function') {
        await (redis as any).flushdb();
      }
    } catch {
      // best effort
    }
    memoryCache.clear();
  };

  return cache;
}
