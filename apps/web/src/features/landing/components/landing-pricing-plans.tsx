'use client';

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
import { cn } from '@/lib/utils';
import { useSession } from '@/lib/auth-client';

import { LANDING_PRICING, MOCK_DEFAULT_PLAN_NAME } from '../constants';
import { LandingPlanCta } from './landing-auth-buttons';

export function LandingPricingPlans() {
  const { data: session } = useSession();

  return (
    <div className="mt-16 grid gap-8 pt-4 lg:grid-cols-3">
      {LANDING_PRICING.map((plan) => {
        const isCurrentPlan = session && plan.name === MOCK_DEFAULT_PLAN_NAME;

        return (
          <Card
            key={plan.name}
            className={cn(
              'relative flex flex-col overflow-visible border-border/60',
              plan.highlighted &&
                !isCurrentPlan &&
                'border-primary shadow-lg shadow-primary/10',
              isCurrentPlan && 'border-primary/60 shadow-md',
            )}
          >
            {isCurrentPlan ? (
              <Badge className="absolute -top-3 left-1/2 z-10 -translate-x-1/2">
                Current plan
              </Badge>
            ) : null}
            {!isCurrentPlan && plan.highlighted ? (
              <Badge className="absolute -top-3 left-1/2 z-10 -translate-x-1/2">
                Most popular
              </Badge>
            ) : null}
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
              <LandingPlanCta
                planName={plan.name}
                className={cn(
                  buttonVariants({
                    variant: isCurrentPlan
                      ? 'outline'
                      : plan.highlighted
                        ? 'default'
                        : 'outline',
                  }),
                  'w-full',
                )}
                label={
                  plan.price === '$0' ? 'Get started' : 'Start free trial'
                }
              />
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
