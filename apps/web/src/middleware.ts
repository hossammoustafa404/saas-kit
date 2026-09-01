import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import {
  AUTH_GUEST_ROUTES,
  AUTH_ROUTES,
  CHECK_EMAIL_CALLBACK_QUERY_PARAM,
  PROTECTED_ROUTE_PREFIXES,
} from '@/features/auth';
import { getSession } from '@/lib/auth-client';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const { data: session } = await getSession({
    fetchOptions: {
      headers: {
        cookie: request.headers.get('cookie') ?? '',
      },
    },
  });

  const isProtectedRoute = PROTECTED_ROUTE_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  );
  const isGuestAuthRoute = AUTH_GUEST_ROUTES.some((route) => pathname === route);

  if (isProtectedRoute && !session) {
    const signInUrl = new URL(AUTH_ROUTES.signIn, request.url);
    signInUrl.searchParams.set(CHECK_EMAIL_CALLBACK_QUERY_PARAM, pathname);
    return NextResponse.redirect(signInUrl);
  }

  if (isGuestAuthRoute && session) {
    return NextResponse.redirect(new URL(AUTH_ROUTES.dashboard, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/sign-in', '/sign-up'],
};
