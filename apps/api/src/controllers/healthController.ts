import type { Request, Response } from 'express';
import { redisClient } from '../database/redis';
import { prisma } from '../database';

export const healthController = {
  /** GET /api/v1/health */
  check: async (req: Request, res: Response): Promise<void> => {
    const startTime = Date.now();
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.API_VERSION || '1.0.0',
      database: { status: 'unknown', latency: 0 },
      redis: { status: 'unknown', latency: 0 },
    };

    // Check database
    try {
      const dbStart = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      health.database.latency = Date.now() - dbStart;
      health.database.status = 'healthy';
    } catch (error) {
      health.database.status = 'unhealthy';
      health.status = 'degraded';
    }

    // Check Redis
    try {
      const redisStart = Date.now();
      await redisClient.ping();
      health.redis.latency = Date.now() - redisStart;
      health.redis.status = 'healthy';
    } catch (error) {
      health.redis.status = 'unhealthy';
      health.status = 'degraded';
    }

    const statusCode = health.status === 'ok' ? 200 : 503;
    res.status(statusCode).json(health);
  },
};
