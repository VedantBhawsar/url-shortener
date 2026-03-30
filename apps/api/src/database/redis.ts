import { createClient, type RedisClientType } from 'redis';
import { REDIS_URL } from '../config/constant';

let _connected = false;

// Create the client synchronously — `connect()` is what opens the socket.
// This means `redisClient` is a valid object reference immediately on import.
const client = createClient({ url: REDIS_URL }) as RedisClientType;

client.on('connect', () => {
  _connected = true;
});

client.on('error', (error) => {
  console.error('[Redis] Connection error:', error);
});

client.on('close', () => {
  _connected = false;
});

// Open the TCP connection asynchronously.
(async () => {
  try {
    await client.connect();
  } catch (error) {
    console.error('[Redis] Failed to connect:', error);
  }
})();

/** Returns true while the Redis socket is up and ready. */
export const isRedisConnected = () => _connected;

export const redisClient = client;
