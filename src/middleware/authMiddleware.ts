import type { Request, Response, NextFunction } from 'express';
import { authService } from '../services';
import { COOKIE_NAMES } from '../config/cookieConfig';

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const token = req.cookies?.[COOKIE_NAMES.ACCESS_TOKEN];

  if (!token) {
    res.status(401).json({ error: 'Access token cookie is required' });
    return;
  }

  const result = await authService.verifyAccessToken(token);

  if (result.error) {
    res.status(401).json({ error: result.error });
    return;
  }

  req.user = result.data ?? undefined;
  next();
}
