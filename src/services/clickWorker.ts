import { redisClient } from '../database/redis';
import { clickRepository } from '../repositories/clickRepository';
import { shortLinkRepository } from '../repositories/shortLinkRepository';
import type { RecordClickPayload } from '../types/shortLink';

const CLICK_EVENTS_QUEUE = 'click_events';
const BATCH_SIZE = 50;
const EMPTY_WAIT_MS = 100;
const DISCONNECTED_WAIT_MS = 500;
const ERROR_WAIT_MS = 1000;

let isWorkerRunning = false;
let isRedisConnected = false;

// Monitor Redis connection status
redisClient.onconnect = () => {
  isRedisConnected = true;
};

redisClient.onclose = () => {
  isRedisConnected = false;
};

export const clickWorker = {
  /**
   * Starts the worker process that consumes click events from Redis queue
   * This runs in the background and processes clicks without blocking the request
   */
  start: async (): Promise<void> => {
    if (isWorkerRunning) {
      return;
    }

    isWorkerRunning = true;

    // Process events in a loop
    clickWorker.batchProcessEvents();
  },

  batchProcessEvents: async (): Promise<void> => {
    while (isWorkerRunning) {
      try {
        if (!isRedisConnected) {
          await new Promise((resolve) => setTimeout(resolve, DISCONNECTED_WAIT_MS));
          continue;
        }

        const eventJsons = await redisClient.rpop(CLICK_EVENTS_QUEUE, BATCH_SIZE);

        if (!eventJsons || eventJsons.length === 0) {
          await new Promise((resolve) => setTimeout(resolve, EMPTY_WAIT_MS));
          continue;
        }

        const payloads: RecordClickPayload[] = [];
        for (const eventJson of eventJsons) {
          try {
            payloads.push(JSON.parse(eventJson) as RecordClickPayload);
          } catch (error) {
            console.error('Invalid click event payload:', error);
          }
        }

        if (payloads.length === 0) {
          continue;
        }

        try {
          await clickRepository.createMany(payloads);

          const increments = new Map<string, number>();
          for (const payload of payloads) {
            increments.set(payload.shortLinkId, (increments.get(payload.shortLinkId) ?? 0) + 1);
          }

          for (const [shortLinkId, count] of increments) {
            await shortLinkRepository.incrementClicksBy(shortLinkId, count);
          }
        } catch (error) {
          console.error('Error processing click event batch:', error);
        }
      } catch (error) {
        if (isWorkerRunning && isRedisConnected) {
          console.error('Worker error:', error);
          await new Promise((resolve) => setTimeout(resolve, ERROR_WAIT_MS));
        }
      }
    }
  },

  /**
   * Continuously processes click events from the queue
   * Polls the queue every 100ms for new events when Redis is connected
   */
  processEvents: async (): Promise<void> => {
    while (isWorkerRunning) {
      try {
        // Skip polling if Redis is not connected
        if (!isRedisConnected) {
          await new Promise((resolve) => setTimeout(resolve, 500));
          continue;
        }

        // Pop from the right side of the queue (FIFO)
        const eventJson = await redisClient.rpop(CLICK_EVENTS_QUEUE);

        if (!eventJson) {
          // No events; sleep for 100ms before polling again
          await new Promise((resolve) => setTimeout(resolve, 100));
          continue;
        }

        const payload = JSON.parse(eventJson) as RecordClickPayload;

        // Process the click event
        try {
          await clickRepository.create(payload);
          await shortLinkRepository.incrementClicks(payload.shortLinkId);
        } catch (error) {
          console.error('Error processing click event:', error);
          // Don't re-push on error — log and move on
        }
      } catch (error) {
        if (isWorkerRunning && isRedisConnected) {
          console.error('Worker error:', error);
          // Wait before retrying
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    }
  },

  /**
   * Gracefully stops the worker
   */
  stop: async (): Promise<void> => {
    isWorkerRunning = false;
  },

  /**
   * Get worker status
   */
  getStatus: () => ({
    isRunning: isWorkerRunning,
    isRedisConnected,
  }),
};
