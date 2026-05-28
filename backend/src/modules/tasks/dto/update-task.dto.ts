import { z } from 'zod';
import { TaskStatus } from '@prisma/client';

export const UpdateTaskSchema = z.object({
  title: z.string().min(2).max(120).optional(),
  description: z.string().max(500).optional(),
  dueDate: z.string().datetime().optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  assignedUserId: z.string().uuid().optional(),
});

export type UpdateTaskDto = z.infer<typeof UpdateTaskSchema>;
