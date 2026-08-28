import {
  LandingCta,
  LandingFeatures,
  LandingFooter,
  LandingHeader,
  LandingHero,
  LandingPricing,
} from '../components';

export function LandingView() {
  return (
    <div className="flex min-h-screen flex-col">
      <LandingHeader />
      <main className="flex-1">
        <LandingHero />
        <LandingFeatures />
        <LandingPricing />
        <LandingCta />
      </main>
      <LandingFooter />
    </div>
  );
}
