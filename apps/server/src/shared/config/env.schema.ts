import { z } from 'zod';

const optionalTrimmedString = z
  .string()
  .optional()
  .transform((value) => {
    const trimmed = value?.trim();
    return trimmed === '' ? undefined : trimmed;
  });

export const EnvSchema = z.object({
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  PORT: z.coerce.number().int().positive().default(9000),
  NODE_ENV: z.string().optional(),
  BETTER_AUTH_SECRET: z.string().min(1),
  BETTER_AUTH_URL: z.url(),
  WEB_ORIGIN: z.url(),
  ADMIN_ORIGIN: z.url(),
  REDIS_URL: z.url({ protocol: /^rediss?$/ }),
  RESEND_API_KEY: z.string().min(1),
  MAIL_FROM: z.email(),
  POSTHOG_API_KEY: optionalTrimmedString.refine(
    (value) => value === undefined || value.startsWith('phc_'),
    {
      error: 'POSTHOG_API_KEY must be a project token starting with phc_',
    },
  ),
  POSTHOG_HOST: optionalTrimmedString.pipe(z.url().optional()),
});

export type Env = z.infer<typeof EnvSchema>;
