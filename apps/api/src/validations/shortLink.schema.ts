import z from 'zod';

export const shortLinkCreateSchema = z.object({
  originalUrl: z.url(),
  shortUrl: z.string().min(6).max(50).optional(),
});
