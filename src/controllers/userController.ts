import type { Request, Response } from 'express';
import { userService } from '../services/userService';

export const userController = {
  createUser: async (req: Request, res: Response): Promise<void> => {
    const result = await userService.createUser(req.body);
    if (result.error) {
      res.status(400).json({ error: result.error });
      return;
    }
    res.status(201).json({ data: result.data });
  },

  getUserById: async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    const result = await userService.getUserById(req.params.id);
    if (result.error) {
      res.status(404).json({ error: result.error });
      return;
    }
    res.status(200).json({ data: result.data });
  },

  getUserByEmail: async (req: Request<{ email: string }>, res: Response): Promise<void> => {
    const result = await userService.getUserByEmail(req.params.email);
    if (result.error) {
      res.status(404).json({ error: result.error });
      return;
    }
    res.status(200).json({ data: result.data });
  },

  updateUser: async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    const result = await userService.updateUser(req.params.id, req.body);
    if (result.error) {
      res.status(400).json({ error: result.error });
      return;
    }
    res.status(200).json({ data: result.data });
  },

  deleteUser: async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    const result = await userService.deleteUser(req.params.id);
    if (result.error) {
      res.status(404).json({ error: result.error });
      return;
    }
    res.status(200).json({ data: result.data });
  },
};
