import { prisma } from '../database';
import type { Subscription, SubscriptionStatus } from '../../generated/prisma/client';

// ─── Subscription Repository ──────────────────────────────────────────────────

type CreateSubscriptionData = {
  userId: string;
  stripeCustomerId: string;
  stripeSubscriptionId?: string;
  stripePriceId?: string;
  status: SubscriptionStatus;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
};

type UpdateSubscriptionData = Partial<Omit<CreateSubscriptionData, 'userId' | 'stripeCustomerId'>>;

export const subscriptionRepository = {
  findByUserId: async (userId: string): Promise<Subscription | null> => {
    return prisma.subscription.findUnique({ where: { userId } });
  },

  findByStripeCustomerId: async (stripeCustomerId: string): Promise<Subscription | null> => {
    return prisma.subscription.findUnique({ where: { stripeCustomerId } });
  },

  findByStripeSubscriptionId: async (
    stripeSubscriptionId: string,
  ): Promise<Subscription | null> => {
    return prisma.subscription.findUnique({ where: { stripeSubscriptionId } });
  },

  create: async (data: CreateSubscriptionData): Promise<Subscription> => {
    return prisma.subscription.create({ data });
  },

  updateById: async (id: string, data: UpdateSubscriptionData): Promise<Subscription> => {
    return prisma.subscription.update({ where: { id }, data });
  },

  upsertByStripeCustomerId: async (
    stripeCustomerId: string,
    userId: string,
    data: UpdateSubscriptionData,
  ): Promise<Subscription> => {
    return prisma.subscription.upsert({
      where: { stripeCustomerId },
      create: {
        userId,
        stripeCustomerId,
        status: data.status ?? 'ACTIVE',
        ...data,
      },
      update: data,
    });
  },

  countByUserId: async (userId: string): Promise<number> => {
    return prisma.shortLink.count({ where: { userId } });
  },
};
