import { Suspense } from "react";
import { auth } from "@/auth";
import { CtaSection } from "@/components/landing/cta-section";
import { DeveloperSection } from "@/components/landing/developer-section";
import { LandingFooter } from "@/components/landing/landing-footer";
import { PricingSection } from "@/components/landing/pricing-section";
import { ProductMockupSection } from "@/components/landing/product-mockup-section";
import { WorkflowSection } from "@/components/landing/workflow-section";

async function AuthenticatedCtaSection() {
  const session = await auth();

  return <CtaSection isAuthenticated={!!session?.user} />;
}

async function AuthenticatedLandingFooter() {
  const session = await auth();

  return <LandingFooter isAuthenticated={!!session?.user} />;
}

export function LandingPage() {
  return (
    <div className="flex min-h-full flex-col">
      <main className="flex-1">
        <ProductMockupSection />
        <WorkflowSection />
        <PricingSection />
        <DeveloperSection />
        <Suspense fallback={<CtaSection />}>
          <AuthenticatedCtaSection />
        </Suspense>
      </main>
      <Suspense fallback={<LandingFooter />}>
        <AuthenticatedLandingFooter />
      </Suspense>
    </div>
  );
}
