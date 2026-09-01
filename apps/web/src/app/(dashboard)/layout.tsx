import { redirect } from 'next/navigation';

import { AUTH_ROUTES } from '@/features/auth';
import { DashboardShell } from '@/features/dashboard';
import { getSession } from '@/lib/auth-client';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = await getSession();

  if (!session) {
    redirect(AUTH_ROUTES.signIn);
  }

  return <DashboardShell>{children}</DashboardShell>;
}
