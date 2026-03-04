import { Router } from 'express';
import { userController } from '../controllers/userController';
import { authMiddleware } from '../middleware/authMiddleware';

export const userRouter = Router();

userRouter.post('/', userController.createUser);

// All user routes require a valid access token.
userRouter.use(authMiddleware);
userRouter.get('/email/:email', userController.getUserByEmail);
userRouter.get('/:id', userController.getUserById);
userRouter.patch('/:id', userController.updateUser);
userRouter.delete('/:id', userController.deleteUser);
