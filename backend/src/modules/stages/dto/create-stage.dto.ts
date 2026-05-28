import { z } from 'zod';

export const CreateStageSchema = z.object({
  name: z.string().min(2).max(80),
  position: z.number().int().min(0),
  pipelineId: z.string().uuid(),
});

export type CreateStageDto = z.infer<typeof CreateStageSchema>;
