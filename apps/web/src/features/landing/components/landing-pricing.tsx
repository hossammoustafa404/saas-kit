import { LandingPricingPlans } from './landing-pricing-plans';

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

        <LandingPricingPlans />
      </div>
    </section>
  );
}
