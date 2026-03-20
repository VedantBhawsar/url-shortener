import { prisma } from '../database';
import type { ShortLink } from '../../generated/prisma/client';
import type {
  CreateShortLinkPayload,
  UpdateShortLinkPayload,
  ShortLinkWithClicks,
} from '../types/shortLink';

export const shortLinkRepository = {
  create: async (data: CreateShortLinkPayload & { shortUrl: string }): Promise<ShortLink> => {
    return prisma.shortLink.create({ data });
  },

  findById: async (id: string): Promise<ShortLink | null> => {
    return prisma.shortLink.findUnique({
      where: { id },
    });
  },

  findByIdWithClicks: async (id: string): Promise<ShortLinkWithClicks | null> => {
    return prisma.shortLink.findUnique({
      where: { id },
      include: { clicks: true },
    });
  },

  findByShortUrl: async (shortUrl: string): Promise<ShortLink | null> => {
    return prisma.shortLink.findUnique({
      where: { shortUrl },
    });
  },

  findAllByUserId: async (userId: string): Promise<ShortLink[]> => {
    return prisma.shortLink.findMany({
      where: { userId },
    });
  },

  update: async (id: string, data: UpdateShortLinkPayload): Promise<ShortLink> => {
    return prisma.shortLink.update({
      where: { id },
      data,
    });
  },

  incrementClicks: async (id: string): Promise<ShortLink> => {
    return prisma.shortLink.update({
      where: { id },
      data: { clicksCount: { increment: 1 } },
    });
  },

  incrementClicksBy: async (id: string, count: number): Promise<ShortLink> => {
    return prisma.shortLink.update({
      where: { id },
      data: { clicksCount: { increment: count } },
    });
  },

  deactivate: async (id: string): Promise<ShortLink> => {
    return prisma.shortLink.update({
      where: { id },
      data: {
        status: false,
      },
    });
  },

  delete: async (id: string): Promise<ShortLink> => {
    return prisma.shortLink.delete({
      where: { id },
    });
  },
};
