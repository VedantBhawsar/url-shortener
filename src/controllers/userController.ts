import type { Request, Response } from 'express';
import { userService } from '../services/userService';

export const userController = {
  getMe: async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.sub;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const result = await userService.getUserById(userId);
    if (result.error) {
      res.status(404).json({ error: result.error });
      return;
    }
    res.status(200).json({ data: result.data });
  },

  updateMe: async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.sub;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const result = await userService.updateUser(userId, req.body);
    if (result.error) {
      res.status(400).json({ error: result.error });
      return;
    }
    res.status(200).json({ data: result.data });
  },

  deleteMe: async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.sub;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const result = await userService.deleteUser(userId);
    if (result.error) {
      res.status(404).json({ error: result.error });
      return;
    }
    res.status(200).json({ data: result.data });
  },
};
