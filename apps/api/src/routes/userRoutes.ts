import { Router } from 'express';
import { userController } from '../controllers/userController';
import { authMiddleware } from '../middleware/authMiddleware';

export const userRouter = Router();

// All user routes require a valid access token.
userRouter.use(authMiddleware);
userRouter.get('/me', userController.getMe);
userRouter.patch('/me', userController.updateMe);
userRouter.delete('/me', userController.deleteMe);
