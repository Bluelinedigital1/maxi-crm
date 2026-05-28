import { z } from 'zod';

export const CreateInstanceSchema = z.object({
  name: z.string().min(2).max(60),
  phoneNumber: z.string().min(10).max(20),
});

export type CreateInstanceDto = z.infer<typeof CreateInstanceSchema>;
