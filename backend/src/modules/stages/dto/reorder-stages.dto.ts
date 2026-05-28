import { z } from 'zod';

export const ReorderStagesSchema = z.object({
  orderedIds: z.array(z.string().uuid()).min(1),
});

export type ReorderStagesDto = z.infer<typeof ReorderStagesSchema>;
