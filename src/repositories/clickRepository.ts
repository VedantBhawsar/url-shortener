import { prisma } from '../database';
import type { Click } from '../../generated/prisma/client';
import type { RecordClickPayload } from '../types/shortLink';

export const clickRepository = {
  create: async (data: RecordClickPayload): Promise<Click> => {
    return prisma.click.create({ data });
  },

  findAllByShortLinkId: async (shortLinkId: string): Promise<Click[]> => {
    return prisma.click.findMany({ where: { shortLinkId } });
  },

  countByShortLinkId: async (shortLinkId: string): Promise<number> => {
    return prisma.click.count({ where: { shortLinkId } });
  },

  // BUG FIX: must be called before deleting a ShortLink to avoid FK constraint violation
  deleteAllByShortLinkId: async (shortLinkId: string): Promise<void> => {
    await prisma.click.deleteMany({ where: { shortLinkId } });
  },
};
