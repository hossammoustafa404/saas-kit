import { z } from 'zod';

export const EnvSchema = z.object({
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  PORT: z.coerce.number().int().positive().default(9000),
  BETTER_AUTH_SECRET: z.string().min(1),
  BETTER_AUTH_URL: z.url(),
  WEB_ORIGIN: z.url(),
  ADMIN_ORIGIN: z.url(),
});

export type Env = z.infer<typeof EnvSchema>;
