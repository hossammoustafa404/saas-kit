import { Logger } from '@nestjs/common';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { betterAuth } from 'better-auth';
import { admin, openAPI, organization } from 'better-auth/plugins';
import { adminAc, userAc } from 'better-auth/plugins/admin/access';
import { EnvSchema } from '../../../shared/config/env.schema';
import { MAIL_SEND_JOB } from '../../../shared/mail/mail.constants';
import { AUTH_BASE_PATH, VERIFICATION_EMAIL_SUBJECT } from '../auth.constants';
import { MemberRole, UserRole } from '../enums';
import type { CreateAuthOptions } from '../interfaces';
import { httpObservabilityPlugin } from '../plugins/http-observability.plugin';

const logger = new Logger('createAuth');

export function createAuth({
  prisma,
  mailQueue,
  observabilityService,
}: CreateAuthOptions) {
  const env = EnvSchema.parse(process.env);

  return betterAuth({
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    basePath: AUTH_BASE_PATH,
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
        try {
          await mailQueue.add(MAIL_SEND_JOB, {
            to: data.user.email,
            subject: VERIFICATION_EMAIL_SUBJECT,
            text: `Verify your email by opening this link:\n${data.url}`,
            html: '',
          });
        } catch (error) {
          logger.error(
            'Failed to enqueue verification email',
            error instanceof Error ? error.stack : undefined,
          );
        }
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
      organization({
        allowUserToCreateOrganization: (user) =>
          user.role === UserRole.Customer,
        creatorRole: MemberRole.Owner,
        teams: {
          enabled: false,
        },
        dynamicAccessControl: {
          enabled: false,
        },
      }),
      openAPI(),
      ...(observabilityService === undefined
        ? []
        : [httpObservabilityPlugin(observabilityService)]),
    ],
    hooks: {},
    databaseHooks: {},
    logger: {
      disabled: true,
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;
