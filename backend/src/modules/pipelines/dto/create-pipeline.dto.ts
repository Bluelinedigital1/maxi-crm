import { z } from 'zod';
import { PipelineType } from '@prisma/client';

export const CreatePipelineSchema = z.object({
  name: z.string().min(2).max(80),
  type: z.nativeEnum(PipelineType),
});

export type CreatePipelineDto = z.infer<typeof CreatePipelineSchema>;
