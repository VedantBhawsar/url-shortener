import type { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService';

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or malformed Authorization header' });
    return;
  }

  const token = authHeader.slice(7); // strip "Bearer "

  const result = await authService.verifyAccessToken(token);

  if (result.error) {
    res.status(401).json({ error: result.error });
    return;
  }

  req.user = result.data ?? undefined;
  next();
}
