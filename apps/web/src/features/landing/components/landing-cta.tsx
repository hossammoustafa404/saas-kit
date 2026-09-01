import { PRODUCT_NAME } from '../constants';
import { LandingCtaAuthButtons } from './landing-auth-buttons';

export function LandingCta() {
  return (
    <section
      id="get-started"
      className="border-t border-border/60 bg-muted/30 py-24"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card px-6 py-16 text-center sm:px-12">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--color-primary)/0.08,transparent_70%)]"
            aria-hidden="true"
          />

          <div className="relative mx-auto max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to move faster?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Join thousands of teams using {PRODUCT_NAME} to stay aligned, ship
              on time, and hit their goals.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <LandingCtaAuthButtons />
            </div>

            <p className="mt-6 text-sm text-muted-foreground">
              No credit card required · 14-day free trial · Cancel anytime
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
