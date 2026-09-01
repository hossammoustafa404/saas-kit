'use client';

import { useSession } from '@/lib/auth-client';

export function DashboardProfileView() {
  const { data: session } = useSession();
  const user = session?.user;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
      <div className="space-y-1">
        <p className="text-sm font-medium">{user?.name ?? 'No name set'}</p>
        <p className="text-sm text-muted-foreground">
          {user?.email ?? 'No email'}
        </p>
      </div>
      <p className="text-sm text-muted-foreground">
        Profile settings are coming soon.
      </p>
    </div>
  );
}
