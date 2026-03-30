import { Router } from 'express';
import { healthController } from '../controllers/healthController';

/**
 * @swagger
 * tags:
 *   - name: Health
 *     description: System health and status endpoints
 */

export const healthRouter = Router();

/**
 * @swagger
 * /api/v1/health:
 *   get:
 *     tags:
 *       - Health
 *     summary: Get system health status
 *     description: Returns database, Redis, uptime, and API version information
 *     responses:
 *       200:
 *         description: System is healthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthStatus'
 *       503:
 *         description: System is degraded (one or more services unhealthy)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthStatus'
 */
healthRouter.get('/', healthController.check);
