import type { BetterAuthPlugin } from 'better-auth';
import {
  APIError,
  createAuthEndpoint,
  sessionMiddleware,
} from 'better-auth/api';
import { z } from 'zod';
import type { PrismaClient } from '../../../shared/prisma/generated/client';
import { MemberRole } from '../enums';
import { rejectSuperAdminRole } from '../lib/organization-hooks';

const memberRoles = [
  MemberRole.Owner,
  MemberRole.Admin,
  MemberRole.Member,
] as const;

export function addMemberPlugin(prisma: PrismaClient): BetterAuthPlugin {
  return {
    id: 'add-member',
    endpoints: {
      addMemberHttp: createAuthEndpoint(
        '/organization/add-member',
        {
          method: 'POST',
          requireHeaders: true,
          use: [sessionMiddleware],
          body: z.object({
            userId: z.string(),
            role: z.enum(memberRoles),
            organizationId: z.string().optional(),
          }),
        },
        async (ctx) => {
          const session = ctx.context.session;
          if (session === undefined) {
            throw new APIError('UNAUTHORIZED');
          }

          const organizationId = parseId(
            ctx.body.organizationId ??
              activeOrganizationIdOf(session.session) ??
              '',
          );
          if (organizationId === undefined) {
            throw new APIError('BAD_REQUEST', {
              message: 'Organization ID is required',
            });
          }

          const callerId = parseId(session.user.id);
          const targetId = parseId(ctx.body.userId);
          if (callerId === undefined || targetId === undefined) {
            throw new APIError('BAD_REQUEST', { message: 'User not found' });
          }

          const caller = await prisma.member.findUnique({
            where: {
              organizationId_userId: {
                organizationId,
                userId: callerId,
              },
            },
            select: { role: true },
          });
          if (caller === null || !canAddMember(caller.role)) {
            throw new APIError('FORBIDDEN', {
              message:
                'You are not allowed to add a member to this organization',
            });
          }

          if (
            !hasPosition(caller.role, MemberRole.Owner) &&
            ctx.body.role === MemberRole.Owner
          ) {
            throw new APIError('FORBIDDEN', {
              message: 'You are not allowed to add a member with this role',
            });
          }

          const target = await prisma.user.findUnique({
            where: { id: targetId },
            select: { id: true, role: true },
          });
          if (target === null) {
            throw new APIError('BAD_REQUEST', { message: 'User not found' });
          }
          rejectSuperAdminRole(target.role);

          const alreadyMember = await prisma.member.findUnique({
            where: {
              organizationId_userId: {
                organizationId,
                userId: target.id,
              },
            },
            select: { id: true },
          });
          if (alreadyMember !== null) {
            throw new APIError('BAD_REQUEST', {
              message: 'User is already a member of this organization',
            });
          }

          const created = await prisma.member.create({
            data: {
              organizationId,
              userId: target.id,
              role: ctx.body.role,
            },
          });

          return ctx.json({
            id: String(created.id),
            organizationId: String(created.organizationId),
            userId: String(created.userId),
            role: created.role,
            createdAt: created.createdAt,
          });
        },
      ),
    },
  } satisfies BetterAuthPlugin;
}

function canAddMember(role: string): boolean {
  return (
    hasPosition(role, MemberRole.Owner) || hasPosition(role, MemberRole.Admin)
  );
}

function hasPosition(role: string, position: MemberRole): boolean {
  return role
    .split(',')
    .map((item) => item.trim())
    .includes(position);
}

function parseId(value: string): bigint | undefined {
  if (!/^\d+$/.test(value)) {
    return undefined;
  }

  return BigInt(value);
}

function activeOrganizationIdOf(sessionRow: object): string | undefined {
  if (
    !('activeOrganizationId' in sessionRow) ||
    typeof sessionRow.activeOrganizationId !== 'string'
  ) {
    return undefined;
  }

  return sessionRow.activeOrganizationId;
}
