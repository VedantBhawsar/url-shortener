import { RedisClient } from 'bun';
import { REDIS_URL } from '../config/constant';

const client = new RedisClient(REDIS_URL);
client.connect();

// Called when disconnected from Redis server
client.onclose = (error) => {
  console.error('Disconnected from Redis server:', error);
};

export { client as redisClient };
