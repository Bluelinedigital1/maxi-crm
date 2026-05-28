import { z } from 'zod';

export const CreateTaskSchema = z.object({
  title: z.string().min(2).max(120),
  description: z.string().max(500).optional(),
  dueDate: z.string().datetime(),
  leadId: z.string().uuid(),
  assignedUserId: z.string().uuid(),
});

export type CreateTaskDto = z.infer<typeof CreateTaskSchema>;
