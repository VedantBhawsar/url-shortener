import { redisClient } from '../database/redis';
import type { RecordClickPayload } from '../types/shortLink';

const CLICK_EVENTS_QUEUE = 'click_events';

let isRedisConnected = true; // Assume connected initially

// Track Redis connection status
redisClient.onconnect = () => {
  isRedisConnected = true;
};

redisClient.onclose = () => {
  isRedisConnected = false;
};

export const eventPublisher = {
  /**
   * Publishes a click event to the Redis queue
   * Ultra-low latency (~0.3ms) - just pushes JSON to a list
   *
   * If Redis is unavailable, the event is silently dropped
   * (non-critical analytics, doesn't affect user experience)
   */
  publishClickEvent: async (payload: RecordClickPayload): Promise<void> => {
    try {
      // Skip if Redis is not connected
      if (!isRedisConnected) {
        return;
      }

      await redisClient.lpush(CLICK_EVENTS_QUEUE, JSON.stringify(payload));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'something went wrong into click client';
      console.error(message);
    }
  },

  /**
   * Check if Redis is currently connected
   */
  isConnected: () => isRedisConnected,
};
