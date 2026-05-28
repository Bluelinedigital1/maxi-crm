import { z } from 'zod';
import { Role } from '@prisma/client';

export const UpdateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).max(72).optional(),
  role: z.nativeEnum(Role).optional(),
  isActive: z.boolean().optional(),
});

export type UpdateUserDto = z.infer<typeof UpdateUserSchema>;
