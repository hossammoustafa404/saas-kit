import { z } from 'zod';

export const EnvSchema = z.object({
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  PORT: z.coerce.number().int().positive().default(5000),
});

export type Env = z.infer<typeof EnvSchema>;
