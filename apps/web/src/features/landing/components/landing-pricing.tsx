import Link from 'next/link';
import { Check } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { AUTH_ROUTES } from '@/features/auth';
import { cn } from '@/lib/utils';

import { LANDING_PRICING } from '../constants';

export function LandingPricing() {
  return (
    <section id="pricing" className="py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Start free and scale as your team grows. No hidden fees, cancel
            anytime.
          </p>
        </div>

        <div className="mt-16 grid gap-8 pt-4 lg:grid-cols-3">
          {LANDING_PRICING.map((plan) => (
            <Card
              key={plan.name}
              className={cn(
                'relative flex flex-col overflow-visible border-border/60',
                plan.highlighted &&
                  'border-primary shadow-lg shadow-primary/10',
              )}
            >
              {plan.highlighted && (
                <Badge className="absolute -top-3 left-1/2 z-10 -translate-x-1/2">
                  Most popular
                </Badge>
              )}
              <CardHeader>
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold tracking-tight">
                    {plan.price}
                  </span>
                  <span className="ml-1 text-sm text-muted-foreground">
                    {plan.period}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-sm"
                    >
                      <Check
                        className="mt-0.5 size-4 shrink-0 text-primary"
                        aria-hidden="true"
                      />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Link
                  href={AUTH_ROUTES.signUp}
                  className={cn(
                    buttonVariants({
                      variant: plan.highlighted ? 'default' : 'outline',
                    }),
                    'w-full',
                  )}
                >
                  {plan.price === '$0' ? 'Get started' : 'Start free trial'}
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
