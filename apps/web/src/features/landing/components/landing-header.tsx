import Link from 'next/link';
import { Activity } from 'lucide-react';

import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { LANDING_NAV_LINKS, PRODUCT_NAME } from '../constants';
import { ThemeToggle } from './theme-toggle';

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold tracking-tight"
        >
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Activity className="size-4" aria-hidden="true" />
          </div>
          <span>{PRODUCT_NAME}</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex" aria-label="Main">
          {LANDING_NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            href="#get-started"
            className={cn(
              buttonVariants({ variant: 'ghost', size: 'sm' }),
              'hidden sm:inline-flex',
            )}
          >
            Sign in
          </Link>
          <Link href="#get-started" className={buttonVariants({ size: 'sm' })}>
            Start free trial
          </Link>
        </div>
      </div>
    </header>
  );
}
