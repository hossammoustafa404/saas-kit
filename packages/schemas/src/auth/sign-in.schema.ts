import { z } from 'zod';

export const SignInSchema = z
  .object({
    email: z.email('Enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password must be at most 128 characters'),
  })
  .describe('Customer sign-in credentials');

export type SignInInput = z.infer<typeof SignInSchema>;
