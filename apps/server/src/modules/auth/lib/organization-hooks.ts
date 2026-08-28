import type { OrganizationOptions } from 'better-auth/plugins';
import { APIError } from 'better-auth/api';
import { SUPER_ADMIN_CANNOT_HAVE_MEMBERSHIP } from '../auth.constants';
import { UserRole } from '../enums';
import type { PrismaClient } from '../../../shared/prisma/generated/client';

type OrganizationHooks = NonNullable<OrganizationOptions['organizationHooks']>;

export function createOrganizationHooks(
  prisma: PrismaClient,
): Pick<OrganizationHooks, 'beforeCreateInvitation' | 'beforeAddMember'> {
  return {
    beforeCreateInvitation: async (data) => {
      await rejectSuperAdminEmail(prisma, data.invitation.email);
    },
    beforeAddMember: async (data) => {
      rejectSuperAdminRole(
        typeof data.user.role === 'string' ? data.user.role : undefined,
      );
    },
  };
}

async function rejectSuperAdminEmail(
  prisma: PrismaClient,
  email: string,
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { role: true },
  });
  rejectSuperAdminRole(user?.role);
}

export function rejectSuperAdminRole(role: string | undefined): void {
  if (role === UserRole.SuperAdmin) {
    throw new APIError('FORBIDDEN', {
      message: SUPER_ADMIN_CANNOT_HAVE_MEMBERSHIP,
    });
  }
}
