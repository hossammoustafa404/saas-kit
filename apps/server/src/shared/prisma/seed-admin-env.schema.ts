import { z } from 'zod';

export const SeedAdminEnvSchema = z.object({
  SEED_ADMIN_EMAIL: z.email(),
  SEED_ADMIN_PASSWORD: z.string().min(8),
  SEED_ADMIN_NAME: z.string().min(1),
});

export type SeedAdminEnv = z.infer<typeof SeedAdminEnvSchema>;
