import { RedisClient } from 'bun';

const client = new RedisClient();
client.connect();

// Called when disconnected from Redis server
client.onclose = (error) => {
  console.error('Disconnected from Redis server:', error);
};

export { client as redisClient };
