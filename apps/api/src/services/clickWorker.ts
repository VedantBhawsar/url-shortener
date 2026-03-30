import { redisClient, isRedisConnected } from '../database/redis';
import { clickRepository } from '../repositories/clickRepository';
import { shortLinkRepository } from '../repositories/shortLinkRepository';
import type { RecordClickPayload } from '../types/shortLink';

const CLICK_EVENTS_QUEUE = 'click_events';
const BATCH_SIZE = 10;
const EMPTY_WAIT_MS = 100;
const DISCONNECTED_WAIT_MS = 500;
const ERROR_WAIT_MS = 1000;

let isWorkerRunning = false;

export const clickWorker = {
  /**
   * Starts the worker process that consumes click events from the Redis queue.
   * Runs in the background and processes clicks without blocking requests.
   */
  start: async (): Promise<void> => {
    if (isWorkerRunning) {
      return;
    }

    isWorkerRunning = true;
    clickWorker.batchProcessEvents();
  },

  batchProcessEvents: async (): Promise<void> => {
    while (isWorkerRunning) {
      try {
        if (!isRedisConnected()) {
          await new Promise((resolve) => setTimeout(resolve, DISCONNECTED_WAIT_MS));
          continue;
        }

        // Get batch of items from the queue using LRANGE
        const eventJsons = await redisClient.lRange(CLICK_EVENTS_QUEUE, 0, BATCH_SIZE - 1);

        if (!eventJsons || eventJsons.length === 0) {
          await new Promise((resolve) => setTimeout(resolve, EMPTY_WAIT_MS));
          continue;
        }

        const payloads: RecordClickPayload[] = [];

        for (const eventJson of eventJsons) {
          try {
            payloads.push(JSON.parse(eventJson) as RecordClickPayload);
          } catch {}
        }
        if (payloads.length === 0) {
          continue;
        }

        await clickRepository.createMany(payloads);

        const increments = new Map<string, number>();
        for (const payload of payloads) {
          increments.set(payload.shortLinkId, (increments.get(payload.shortLinkId) ?? 0) + 1);
        }

        for (const [shortLinkId, count] of increments) {
          await shortLinkRepository.incrementClicksBy(shortLinkId, count);
        }
        await redisClient.lTrim(CLICK_EVENTS_QUEUE, eventJsons.length, -1);
      } catch (error) {
        if (isWorkerRunning && isRedisConnected()) {
          console.error('[clickWorker] Worker error:', error);
          await new Promise((resolve) => setTimeout(resolve, ERROR_WAIT_MS));
        }
      }
    }
  },

  /**
   * Gracefully stops the worker.
   */
  stop: async (): Promise<void> => {
    isWorkerRunning = false;
  },

  /**
   * Returns current worker status.
   */
  getStatus: () => ({
    isRunning: isWorkerRunning,
    isRedisConnected: isRedisConnected(),
  }),
};
