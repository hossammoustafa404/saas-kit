import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { LANDING_STATS, PRODUCT_NAME } from '../constants';

export function LandingHero() {
  return (
    <section className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,var(--color-primary)/0.15,transparent)]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)] opacity-40"
        aria-hidden="true"
      />

      <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="secondary" className="mb-6 gap-1.5 px-3 py-1">
            <Sparkles className="size-3.5" aria-hidden="true" />
            Now with AI-powered insights
          </Badge>

          <h1 className="text-4xl font-bold tracking-tight text-balance sm:text-5xl lg:text-6xl">
            The workspace for{' '}
            <span className="text-primary">high-performing teams</span>
          </h1>

          <p className="mt-6 text-lg text-muted-foreground text-pretty sm:text-xl">
            {PRODUCT_NAME} helps teams align on goals, track progress, and ship
            faster — without the chaos of scattered tools and endless status
            meetings.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="#get-started"
              className={cn(buttonVariants({ size: 'lg' }), 'w-full sm:w-auto')}
            >
              Start free trial
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <Link
              href="#features"
              className={cn(
                buttonVariants({ size: 'lg', variant: 'outline' }),
                'w-full sm:w-auto',
              )}
            >
              See how it works
            </Link>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
            {LANDING_STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl font-bold tracking-tight">
                  {stat.value}
                </p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
