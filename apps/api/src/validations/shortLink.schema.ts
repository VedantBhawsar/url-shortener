import z from 'zod';

export const shortLinkCreateSchema = z.object({
  originalUrl: z.url(),
  shortUrl: z.string().min(6).max(50).optional(),
  /** ISO 8601 date string — must be in the future. Premium only (enforced by middleware). */
  expiresAt: z
    .string()
    .datetime({ offset: true })
    .refine((val) => new Date(val) > new Date(), {
      message: 'expiresAt must be a future date',
    })
    .optional(),
  /** Array of ISO 3166-1 alpha-2 country codes. Premium only (enforced by middleware). */
  blockedRegions: z.array(z.string().length(2).toUpperCase()).max(50).optional(),
});

export const shortLinkUpdateSchema = z.object({
  originalUrl: z.url().optional(),
  status: z.boolean().optional(),
  /** ISO 8601 date string — must be in the future. Premium only (enforced by middleware). */
  expiresAt: z
    .string()
    .datetime({ offset: true })
    .refine((val) => new Date(val) > new Date(), {
      message: 'expiresAt must be a future date',
    })
    .nullable()
    .optional(),
  /** Array of ISO 3166-1 alpha-2 country codes. Premium only (enforced by middleware). */
  blockedRegions: z.array(z.string().length(2).toUpperCase()).max(50).optional(),
});
