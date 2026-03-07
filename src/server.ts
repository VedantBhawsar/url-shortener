import express, { type Request, type Response } from 'express';
import cookieParser from 'cookie-parser';
import { PORT } from './config/constant';
import { userRouter, authRouter, shortLinkRouter } from './routes';
import { shortLinkController } from './controllers/shortLinkController';
import { createRedisFallbackCache } from './services/cacheService';
import { redisClient } from './database/redis';
import { clickWorker } from './services/clickWorker';

export const app = express();

app.use(express.json());
app.use(cookieParser());

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

// Public redirect route — must come after API routes.
app.get('/:shortUrl', shortLinkController.redirect);

// 404 fallback.
app.use((req: Request, res: Response) => {
  res.status(404).json({ message: 'Not found' });
});
