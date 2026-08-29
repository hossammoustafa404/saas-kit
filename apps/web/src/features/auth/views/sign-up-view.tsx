import Link from 'next/link';
import { Suspense } from 'react';

import { AuthCard, RedirectIfAuthenticated, SignUpForm } from '../components';
import { AUTH_ROUTES } from '../constants';

export function SignUpView() {
  return (
    <AuthCard
      title="Create your account"
      description="Start your free trial. We will email you a verification link and sign you in once it is confirmed."
      footer={
        <>
          Already have an account?{' '}
          <Link href={AUTH_ROUTES.signIn} className="font-medium text-foreground underline-offset-4 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <RedirectIfAuthenticated />
      <Suspense fallback={null}>
        <SignUpForm />
      </Suspense>
    </AuthCard>
  );
}
