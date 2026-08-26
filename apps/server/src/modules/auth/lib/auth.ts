import { prismaAdapter } from 'better-auth/adapters/prisma';
import { betterAuth } from 'better-auth';
import { admin, openAPI } from 'better-auth/plugins';
import { adminAc, userAc } from 'better-auth/plugins/admin/access';
import { EnvSchema } from '../../../shared/config/env.schema';
import type { PrismaClient } from '../../../shared/prisma/generated/client';

export function createAuth(prisma: PrismaClient) {
  const env = EnvSchema.parse(process.env);

  return betterAuth({
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    basePath: '/api/auth',
    database: prismaAdapter(prisma, { provider: 'postgresql' }),
    trustedOrigins: [env.WEB_ORIGIN, env.ADMIN_ORIGIN, env.BETTER_AUTH_URL],
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
      autoSignIn: true,
    },
    advanced: {
      database: {
        generateId: 'serial',
      },
    },
    plugins: [
      admin({
        defaultRole: 'customer',
        adminRoles: ['superadmin'],
        roles: {
          superadmin: adminAc,
          customer: userAc,
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
