import type { Request, Response } from 'express';
import { authService } from '../services/authService';

export const authController = {
  register: async (req: Request, res: Response): Promise<void> => {
    const { name, email, password } = req.body as {
      name?: string;
      email?: string;
      password?: string;
    };

    if (!name || !email || !password) {
      res.status(400).json({ error: 'name, email, and password are required' });
      return;
    }

    const result = await authService.register({ name, email, password });
    if (result.error) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.status(201).json({ data: result.data });
  },

  login: async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body as { email?: string; password?: string };

    if (!email || !password) {
      res.status(400).json({ error: 'email and password are required' });
      return;
    }

    const result = await authService.login(email, password);
    if (result.error) {
      res.status(401).json({ error: result.error });
      return;
    }

    res.status(200).json({ data: result.data });
  },

  refresh: async (req: Request, res: Response): Promise<void> => {
    const { refreshToken } = req.body as { refreshToken?: string };

    if (!refreshToken) {
      res.status(400).json({ error: 'refreshToken is required' });
      return;
    }

    const result = await authService.refresh(refreshToken);
    if (result.error) {
      res.status(401).json({ error: result.error });
      return;
    }

    res.status(200).json({ data: result.data });
  },

  logout: async (req: Request, res: Response): Promise<void> => {
    const { refreshToken } = req.body as { refreshToken?: string };

    if (!refreshToken) {
      res.status(400).json({ error: 'refreshToken is required' });
      return;
    }

    const result = await authService.logout(refreshToken);
    if (result.error) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.status(200).json({ message: 'Logged out successfully' });
  },
};
