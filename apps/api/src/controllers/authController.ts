import type { Request, Response } from 'express';
import { authService } from '../services/authService';
import {
  accessTokenCookieOptions,
  refreshTokenCookieOptions,
  clearCookieOptions,
  clearRefreshCookieOptions,
  COOKIE_NAMES,
} from '../config/cookieConfig';
import { userLoginSchema, userRegisterSchema } from '../validations/user.schema';

export const authController = {
  register: async (req: Request, res: Response): Promise<void> => {
    const safeBody = userRegisterSchema.parse(req.body);

    const { name, email, password } = safeBody;

    const result = await authService.register({ name, email, password });
    if (result.error) {
      res.status(400).json({ error: result.error });
      return;
    }

    if (result.data) {
      res.cookie(COOKIE_NAMES.ACCESS_TOKEN, result.data.accessToken, accessTokenCookieOptions);
      res.cookie(COOKIE_NAMES.REFRESH_TOKEN, result.data.refreshToken, refreshTokenCookieOptions);
      res.status(201).json({ data: { message: 'Registered successfully' } });
    }
  },

  login: async (req: Request, res: Response): Promise<void> => {
    const safebody = userLoginSchema.parse(req.body);
    const { email, password } = safebody;

    const result = await authService.login(email, password);
    if (result.error) {
      res.status(401).json({ error: result.error });
      return;
    }

    if (result.data) {
      res.cookie(COOKIE_NAMES.ACCESS_TOKEN, result.data.accessToken, accessTokenCookieOptions);
      res.cookie(COOKIE_NAMES.REFRESH_TOKEN, result.data.refreshToken, refreshTokenCookieOptions);
      res.status(200).json({ data: { message: 'Logged in successfully' } });
    }
  },

  refresh: async (req: Request, res: Response): Promise<void> => {
    const refreshToken = req.cookies?.[COOKIE_NAMES.REFRESH_TOKEN];

    if (!refreshToken) {
      res.status(400).json({ error: 'Refresh token cookie is required' });
      return;
    }

    const result = await authService.refresh(refreshToken);
    if (result.error) {
      res.status(401).json({ error: result.error });
      return;
    }

    if (result.data) {
      res.cookie(COOKIE_NAMES.ACCESS_TOKEN, result.data.accessToken, accessTokenCookieOptions);
      res.cookie(COOKIE_NAMES.REFRESH_TOKEN, result.data.refreshToken, refreshTokenCookieOptions);
      res.status(200).json({ data: { message: 'Token refreshed successfully' } });
    }
  },

  logout: async (req: Request, res: Response): Promise<void> => {
    const refreshToken = req.cookies?.[COOKIE_NAMES.REFRESH_TOKEN];

    if (!refreshToken) {
      res.status(400).json({ error: 'Refresh token cookie is required' });
      return;
    }

    const result = await authService.logout(refreshToken);
    if (result.error) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.clearCookie(COOKIE_NAMES.ACCESS_TOKEN, clearCookieOptions);
    res.clearCookie(COOKIE_NAMES.REFRESH_TOKEN, clearRefreshCookieOptions);

    res.status(200).json({ message: 'Logged out successfully' });
  },
};
