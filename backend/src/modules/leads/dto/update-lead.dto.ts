import { z } from 'zod';

export const UpdateLeadSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  phone: z.string().min(8).max(20).optional(),
  email: z.string().email().optional(),
  companyName: z.string().max(120).optional(),
  source: z.string().min(1).max(50).optional(),
  currentStageId: z.string().uuid().optional(),
  assignedUserId: z.string().uuid().optional(),
});

export type UpdateLeadDto = z.infer<typeof UpdateLeadSchema>;
