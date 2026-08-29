import Link from 'next/link';
import { Suspense } from 'react';

import { AuthCard, RedirectIfAuthenticated, SignInForm } from '../components';
import { AUTH_ROUTES } from '../constants';

export function SignInView() {
  return (
    <AuthCard
      title="Welcome back"
      description="Sign in to your Pulse workspace."
      footer={
        <>
          Don&apos;t have an account?{' '}
          <Link href={AUTH_ROUTES.signUp} className="font-medium text-foreground underline-offset-4 hover:underline">
            Create one
          </Link>
        </>
      }
    >
      <RedirectIfAuthenticated />
      <Suspense fallback={null}>
        <SignInForm />
      </Suspense>
    </AuthCard>
  );
}
