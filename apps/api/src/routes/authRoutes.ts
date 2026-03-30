import { Router } from 'express';
import { authController } from '../controllers';
import { createRateLimiter, rateLimitKeys } from '../middleware/rateLimit';

/**
 * @swagger
 * tags:
 *   - name: Authentication
 *     description: User authentication endpoints (register, login, logout, refresh)
 */

export const authRouter = Router();

const loginRateLimiter = createRateLimiter({
  name: 'auth:login',
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyGenerator: rateLimitKeys.ip,
  message: 'Too many login attempts. Please try again later.',
});

const registerRateLimiter = createRateLimiter({
  name: 'auth:register',
  windowMs: 60 * 60 * 1000,
  max: 3,
  keyGenerator: rateLimitKeys.ip,
  message: 'Too many registration attempts. Please try again later.',
});

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Register a new user
 *     description: Create a new user account with email and password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *             required:
 *               - email
 *               - password
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Invalid input or user already exists
 */
authRouter.post('/register', registerRateLimiter, authController.register);

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Login user
 *     description: Authenticate user and receive access token (rate limited to 5 attempts per 15 minutes)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *             required:
 *               - email
 *               - password
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 *       429:
 *         description: Too many login attempts
 */
authRouter.post('/login', loginRateLimiter, authController.login);

/**
 * @swagger
 * /api/v1/auth/refresh:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Refresh access token
 *     description: Get a new access token using refresh token from cookies
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *       401:
 *         description: Refresh token invalid or expired
 */
authRouter.post('/refresh', authController.refresh);

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Logout user
 *     description: Invalidate session and clear cookies
 *     responses:
 *       200:
 *         description: Logout successful
 */
authRouter.post('/logout', authController.logout);
