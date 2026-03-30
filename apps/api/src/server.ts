import express, { type Request, type Response } from 'express';
import cookieParser from 'cookie-parser';
import { PORT } from './config/constant';
import { userRouter, authRouter, shortLinkRouter, billingRouter } from './routes';
import { shortLinkController } from './controllers/shortLinkController';
import { createRedisFallbackCache } from './services/cacheService';
import { redisClient } from './database/redis';
import { clickWorker } from './services/clickWorker';
import compression from 'compression';
import { createRateLimiter, rateLimitKeys } from './middleware/rateLimit';
import cors from 'cors';
export const app = express();

// Trust proxy to get correct client IP when behind a reverse proxy (e.g. Nginx, Load Balancer).
// Prefer setting TRUST_PROXY to a number (e.g. "1") or a subnet (e.g. "10.0.0.0/8").
if (process.env.TRUST_PROXY) {
  const trustProxy = Number.isNaN(Number(process.env.TRUST_PROXY))
    ? process.env.TRUST_PROXY
    : Number(process.env.TRUST_PROXY);
  app.set('trust proxy', trustProxy);
}

// ─── Billing router MUST come before express.json() ──────────────────────────
// If express.json() runs first, the raw body is consumed and Stripe signature
// The /webhook route inside uses express.raw() for raw Buffer parsing.
// verification will always fail.

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  }),
);
app.use(cookieParser());
app.use('/api/v1/billing', billingRouter);
app.use(express.json());
app.use(compression());

export const cache = createRedisFallbackCache(redisClient);

export function startServer() {
  app.listen(PORT, async (error: any) => {
    if (error) {
      console.error(error);
    }

    console.info(`Server is running on http://localhost:${PORT}`);

    // Start the click event worker
    await clickWorker.start();
  });
}

// home route.
app.get('/', (req: Request, res: Response) => {
  res.send('Hello World from the server');
});

// api routes.
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/links', shortLinkRouter);

const redirectRateLimiter = createRateLimiter({
  name: 'redirect',
  windowMs: 1000,
  max: 100,
  keyGenerator: rateLimitKeys.ip,
  message: 'Too many requests. Please slow down.',
});

// Public redirect route — must come after API routes.
app.get('/api/v1/redirect/:shortUrl', redirectRateLimiter, shortLinkController.redirect);

// 404 fallback.
app.use((req: Request, res: Response) => {
  res.status(404).json({ message: 'Not found' });
});
