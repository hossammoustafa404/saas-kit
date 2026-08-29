'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { useSession } from '@/lib/auth-client';

import { AUTH_ROUTES } from '../constants';

export function RedirectIfAuthenticated() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (!isPending && session) {
      router.replace(AUTH_ROUTES.dashboard);
    }
  }, [isPending, router, session]);

  return null;
}
