import { z } from 'zod';

export const MoveStageSchema = z.object({
  stageId: z.string().uuid(),
});

export type MoveStageDto = z.infer<typeof MoveStageSchema>;
