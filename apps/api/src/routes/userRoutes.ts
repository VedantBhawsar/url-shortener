import { Router } from 'express';
import { userController } from '../controllers/userController';
import { authMiddleware } from '../middleware/authMiddleware';

/**
 * @swagger
 * tags:
 *   - name: Users
 *     description: User profile and account management
 */

export const userRouter = Router();

// All user routes require a valid access token.
userRouter.use(authMiddleware);

/**
 * @swagger
 * /api/v1/users/me:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get current user profile
 *     description: Retrieve the authenticated user's profile information
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *   patch:
 *     tags:
 *       - Users
 *     summary: Update user profile
 *     description: Update current user's profile information
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               displayName:
 *                 type: string
 *     responses:
 *       200:
 *         description: User profile updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *   delete:
 *     tags:
 *       - Users
 *     summary: Delete user account
 *     description: Permanently delete the authenticated user account and all associated data
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User account deleted
 *       401:
 *         description: Unauthorized
 */

userRouter.get('/me', userController.getMe);
userRouter.patch('/me', userController.updateMe);
userRouter.delete('/me', userController.deleteMe);
