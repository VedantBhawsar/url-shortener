import { Router } from 'express';
import { authController } from '../controllers';
import { createRateLimiter, rateLimitKeys } from '../middleware/rateLimit';

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

authRouter.post('/register', registerRateLimiter, authController.register);
authRouter.post('/login', loginRateLimiter, authController.login);
authRouter.post('/refresh', authController.refresh);
authRouter.post('/logout', authController.logout);
