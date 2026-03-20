import { prisma } from '../database';
import type { RefreshToken } from '../../generated/prisma/client';

export const authRepository = {
  createRefreshToken: async (data: {
    token: string;
    userId: string;
    expiresAt: Date;
  }): Promise<RefreshToken> => {
    return prisma.refreshToken.create({ data });
  },

  findRefreshToken: async (token: string): Promise<RefreshToken | null> => {
    return prisma.refreshToken.findUnique({ where: { token } });
  },

  deleteRefreshToken: async (token: string): Promise<void> => {
    await prisma.refreshToken.delete({ where: { token } });
  },

  deleteAllUserRefreshTokens: async (userId: string): Promise<void> => {
    await prisma.refreshToken.deleteMany({ where: { userId } });
  },
};
