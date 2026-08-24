import { z } from 'zod';

export const HealthSchema = z
  .object({
    status: z.literal('ok').describe('Process is accepting HTTP requests'),
  })
  .describe('Health signal that the API process is accepting HTTP')
  .meta({ example: { status: 'ok' } });

export type Health = z.infer<typeof HealthSchema>;
