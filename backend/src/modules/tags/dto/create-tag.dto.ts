import { z } from 'zod';

export const CreateTagSchema = z.object({
  name: z.string().min(1).max(40),
  colorHex: z.string().regex(/^#([0-9A-Fa-f]{6})$/, 'Cor deve ser um hex válido (#RRGGBB)'),
});

export type CreateTagDto = z.infer<typeof CreateTagSchema>;
