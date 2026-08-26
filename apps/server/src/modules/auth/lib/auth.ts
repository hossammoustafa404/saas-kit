import { prismaAdapter } from 'better-auth/adapters/prisma';
import { betterAuth } from 'better-auth';
import { admin, openAPI } from 'better-auth/plugins';
import { adminAc, userAc } from 'better-auth/plugins/admin/access';
import { EnvSchema } from '../../../shared/config/env.schema';
import { MAIL_SEND_JOB } from '../../../shared/mail/mail.constants';
import { VERIFICATION_EMAIL_SUBJECT } from '../auth.constants';
import { UserRole } from '../enums';
import type { CreateAuthOptions } from '../interfaces';

export function createAuth({ prisma, mailQueue }: CreateAuthOptions) {
  const env = EnvSchema.parse(process.env);

  return betterAuth({
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    basePath: '/api/auth',
    database: prismaAdapter(prisma, { provider: 'postgresql' }),
    trustedOrigins: [env.WEB_ORIGIN, env.ADMIN_ORIGIN, env.BETTER_AUTH_URL],
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      autoSignIn: false,
    },
    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: false,
      sendVerificationEmail: async (data) => {
        await mailQueue.add(MAIL_SEND_JOB, {
          to: data.user.email,
          subject: VERIFICATION_EMAIL_SUBJECT,
          text: `Verify your email by opening this link:\n${data.url}`,
          html: '',
        });
      },
    },
    advanced: {
      database: {
        generateId: 'serial',
      },
    },
    plugins: [
      admin({
        defaultRole: UserRole.Customer,
        adminRoles: [UserRole.SuperAdmin],
        roles: {
          [UserRole.SuperAdmin]: adminAc,
          [UserRole.Customer]: userAc,
        },
      }),
      openAPI(),
    ],
    hooks: {},
    logger: {
      disabled: true,
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;

