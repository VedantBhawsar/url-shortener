import { redisClient, isRedisConnected } from '../database/redis';
import type { RecordClickPayload } from '../types/shortLink';

const CLICK_EVENTS_QUEUE = 'click_events';

export const eventPublisher = {
  /**
   * Publishes a click event to the Redis queue.
   * Ultra-low latency (~0.3ms) — just pushes JSON to a list.
   *
   * If Redis is unavailable the event is silently dropped
   * (non-critical analytics, does not affect the redirect response).
   */
  publishClickEvent: async (payload: RecordClickPayload): Promise<void> => {
    if (!isRedisConnected()) {
      return;
    }

    try {
      await redisClient.lPush(CLICK_EVENTS_QUEUE, JSON.stringify(payload));
    } catch (error) {
      console.error('Failed to publish click event:', error);
    }
  },
};
