import { prisma } from '../database';
import type { User } from '../../generated/prisma/client';

export const userRepository = {
  create: async (data: Pick<User, 'name' | 'email' | 'password'>): Promise<User> => {
    return prisma.user.create({ data });
  },

  findById: async (id: string): Promise<User | null> => {
    return prisma.user.findUnique({ where: { id } });
  },

  findByEmail: async (email: string): Promise<User | null> => {
    return prisma.user.findUnique({ where: { email } });
  },

  update: async (
    id: string,
    data: Partial<Pick<User, 'name' | 'email' | 'password'>>,
  ): Promise<User> => {
    return prisma.user.update({ where: { id }, data });
  },

  delete: async (id: string): Promise<User> => {
    return prisma.user.delete({ where: { id } });
  },
};
