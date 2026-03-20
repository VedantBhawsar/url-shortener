import Bun from 'bun';
import type { User } from '../../generated/prisma/client';
import type { Result } from '../types/result';
import { userRepository } from '../repositories/userRepository';

const HASH_OPTIONS = { algorithm: 'bcrypt', cost: 10 } as const;

export const userService = {
  getUserById: async (id: string): Promise<Result<User>> => {
    try {
      const user = await userRepository.findById(id);
      if (!user) return { data: null, error: 'User not found' };
      return { data: user, error: null };
    } catch (error) {
      console.error('userService.getUserById:', error);
      return { data: null, error: 'Failed to fetch user' };
    }
  },

  updateUser: async (
    id: string,
    payload: Partial<Pick<User, 'name' | 'email' | 'password'>>,
  ): Promise<Result<User>> => {
    try {
      const hashedPassword = payload.password
        ? await Bun.password.hash(payload.password, HASH_OPTIONS)
        : undefined;

      const user = await userRepository.update(id, {
        ...payload,
        ...(hashedPassword !== undefined && { password: hashedPassword }),
      });

      return { data: user, error: null };
    } catch (error) {
      console.error('userService.updateUser:', error);
      return { data: null, error: 'Failed to update user' };
    }
  },

  deleteUser: async (id: string): Promise<Result<User>> => {
    try {
      const user = await userRepository.delete(id);
      return { data: user, error: null };
    } catch (error) {
      console.error('userService.deleteUser:', error);
      return { data: null, error: 'Failed to delete user' };
    }
  },
};
