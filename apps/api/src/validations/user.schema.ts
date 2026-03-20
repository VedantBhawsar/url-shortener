import z from 'zod';

export const userRegisterSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email(),
  password: z.string().min(8).max(18),
  confirmPassword: z.string().min(8).max(18).optional(),
});

export const userLoginSchema = z.object({
  email: z.string(),
  password: z.string(),
});
