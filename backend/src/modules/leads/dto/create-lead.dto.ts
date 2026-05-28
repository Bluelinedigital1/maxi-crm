import { z } from 'zod';

export const CreateLeadSchema = z.object({
  name: z.string().min(2).max(120),
  phone: z.string().min(8).max(20),
  email: z.string().email().optional(),
  companyName: z.string().max(120).optional(),
  source: z.string().min(1).max(50),
  currentStageId: z.string().uuid(),
  assignedUserId: z.string().uuid().optional(),
});

export type CreateLeadDto = z.infer<typeof CreateLeadSchema>;
