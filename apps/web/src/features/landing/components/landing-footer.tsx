import Link from 'next/link';
import { Activity } from 'lucide-react';

import { Separator } from '@/components/ui/separator';

import { LANDING_FOOTER_LINKS, LANDING_NAV_LINKS, PRODUCT_NAME } from '../constants';

export function LandingFooter() {
  return (
    <footer className="border-t border-border/60 py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
          <div className="flex items-center gap-2 font-semibold">
            <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Activity className="size-3.5" aria-hidden="true" />
            </div>
            <span>{PRODUCT_NAME}</span>
          </div>

          <nav className="flex flex-wrap justify-center gap-6" aria-label="Footer">
            {LANDING_NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
            {LANDING_FOOTER_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <Separator className="my-8" />

        <p className="text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} {PRODUCT_NAME}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
