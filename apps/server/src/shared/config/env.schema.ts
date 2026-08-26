import { z } from 'zod';

export const EnvSchema = z.object({
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  PORT: z.coerce.number().int().positive().default(9000),
  BETTER_AUTH_SECRET: z.string().min(1),
  BETTER_AUTH_URL: z.url(),
  WEB_ORIGIN: z.url(),
  ADMIN_ORIGIN: z.url(),
  POSTHOG_API_KEY: z
    .string()
    .optional()
    .transform((value) => {
      const trimmed = value?.trim();
      return trimmed === '' ? undefined : trimmed;
    })
    .refine((value) => value === undefined || value.startsWith('phc_'), {
      error: 'POSTHOG_API_KEY must be a project token starting with phc_',
    }),
  POSTHOG_HOST: z.url().default('https://us.i.posthog.com'),
});

export type Env = z.infer<typeof EnvSchema>;
