import { z } from 'zod';

export const SendMessageSchema = z.object({
  to: z.string().min(10).max(20),
  body: z.string().min(1).max(4096),
  leadId: z.string().uuid(),
});

export type SendMessageDto = z.infer<typeof SendMessageSchema>;
