import { z } from 'zod';
import { Role } from '@prisma/client';

export const CreateUserSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(6).max(72),
  role: z.nativeEnum(Role).optional(),
});

export type CreateUserDto = z.infer<typeof CreateUserSchema>;
