'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { buttonVariants } from '@/components/ui/button';
import { AUTH_ROUTES } from '@/features/auth';
import { useSession } from '@/lib/auth-client';
import { cn } from '@/lib/utils';

import { MOCK_DEFAULT_PLAN_NAME } from '../constants';

export function LandingHeaderAuthButtons() {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return <div className="hidden h-8 w-44 sm:block" aria-hidden="true" />;
  }

  if (session) {
    return (
      <Link href={AUTH_ROUTES.dashboard} className={buttonVariants({ size: 'sm' })}>
        Dashboard
      </Link>
    );
  }

  return (
    <>
      <Link
        href={AUTH_ROUTES.signIn}
        className={cn(
          buttonVariants({ variant: 'ghost', size: 'sm' }),
          'hidden sm:inline-flex',
        )}
      >
        Sign in
      </Link>
      <Link href={AUTH_ROUTES.signUp} className={buttonVariants({ size: 'sm' })}>
        Start free trial
      </Link>
    </>
  );
}

export function LandingHeroPrimaryButton() {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <div
        className={cn(buttonVariants({ size: 'lg' }), 'w-full sm:w-auto opacity-0')}
        aria-hidden="true"
      >
        Start free trial
      </div>
    );
  }

  if (session) {
    return (
      <Link
        href={AUTH_ROUTES.dashboard}
        className={cn(buttonVariants({ size: 'lg' }), 'w-full sm:w-auto')}
      >
        Go to dashboard
        <ArrowRight className="size-4" aria-hidden="true" />
      </Link>
    );
  }

  return (
    <Link
      href={AUTH_ROUTES.signUp}
      className={cn(buttonVariants({ size: 'lg' }), 'w-full sm:w-auto')}
    >
      Start free trial
      <ArrowRight className="size-4" aria-hidden="true" />
    </Link>
  );
}

export function LandingCtaAuthButtons() {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <div
        className={cn(buttonVariants({ size: 'lg' }), 'gap-1.5 opacity-0')}
        aria-hidden="true"
      >
        Start your free trial
      </div>
    );
  }

  if (session) {
    return (
      <Link
        href={AUTH_ROUTES.dashboard}
        className={cn(buttonVariants({ size: 'lg' }), 'gap-1.5')}
      >
        Go to dashboard
        <ArrowRight className="size-4" aria-hidden="true" />
      </Link>
    );
  }

  return (
    <>
      <Link
        href={AUTH_ROUTES.signUp}
        className={cn(buttonVariants({ size: 'lg' }), 'gap-1.5')}
      >
        Start your free trial
        <ArrowRight className="size-4" aria-hidden="true" />
      </Link>
      <Link
        href={AUTH_ROUTES.signIn}
        className={buttonVariants({ size: 'lg', variant: 'outline' })}
      >
        Sign in
      </Link>
    </>
  );
}

interface LandingPlanCtaProps {
  className?: string;
  label: string;
  planName: string;
}

function getAuthenticatedPlanCta(planName: string) {
  if (planName === MOCK_DEFAULT_PLAN_NAME) {
    return { label: 'Current plan', href: null };
  }

  if (planName === 'Pro') {
    return { label: 'Upgrade to Pro', href: AUTH_ROUTES.dashboard };
  }

  if (planName === 'Business') {
    return { label: 'Talk to sales', href: '#' };
  }

  return { label: 'Get started', href: AUTH_ROUTES.signUp };
}

export function LandingPlanCta({
  className,
  label,
  planName,
}: LandingPlanCtaProps) {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <span className={cn(className, 'opacity-0')} aria-hidden="true">
        {label}
      </span>
    );
  }

  if (session) {
    const cta = getAuthenticatedPlanCta(planName);

    if (!cta.href) {
      return (
        <span className={className} aria-current="true">
          {cta.label}
        </span>
      );
    }

    return (
      <Link href={cta.href} className={className}>
        {cta.label}
      </Link>
    );
  }

  return (
    <Link href={AUTH_ROUTES.signUp} className={className}>
      {label}
    </Link>
  );
}
