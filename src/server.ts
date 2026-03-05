import express, { type Request, type Response } from 'express';
import { PORT } from './config/constant';
import { userRouter, authRouter, shortLinkRouter } from './routes';
import { shortLinkController } from './controllers/shortLinkController';

export const app = express();

app.use(express.json());

export function startServer() {
  app.listen(PORT, (error: any) => {
    if (error) {
      console.error(error);
    }

    console.info(`Server is running on http://localhost:${PORT}`);
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
