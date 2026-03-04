import { Router } from 'express';
import { userController } from '../controllers/userController';

export const userRouter = Router();

userRouter.post('/', userController.createUser);
userRouter.get('/email/:email', userController.getUserByEmail);
userRouter.get('/:id', userController.getUserById);
userRouter.patch('/:id', userController.updateUser);
userRouter.delete('/:id', userController.deleteUser);
