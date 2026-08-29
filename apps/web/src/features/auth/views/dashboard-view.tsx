'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, LogOut } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { signOut, useSession } from '@/lib/auth-client';

import { AUTH_ROUTES } from '../constants';

export function DashboardView() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (!isPending && !session) {
      router.replace(AUTH_ROUTES.signIn);
    }
  }, [isPending, router, session]);

  const handleSignOut = async () => {
    await signOut();
    router.push(AUTH_ROUTES.signIn);
    router.refresh();
  };

  if (isPending || !session) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden="true" />
      </div>
    );
  }

  const user = session.user;

  return (
    <div className="mx-auto flex min-h-svh max-w-3xl flex-col justify-center px-4 py-12">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="text-2xl">Dashboard</CardTitle>
            <CardDescription>
              You are signed in as {user?.email ?? 'your account'}.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => void handleSignOut()}>
            <LogOut aria-hidden="true" />
            Sign out
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Welcome back{user?.name ? `, ${user.name}` : ''}. Your workspace is ready.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
