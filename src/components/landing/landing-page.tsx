import { auth } from "@/auth";
import { CtaSection } from "@/components/landing/cta-section";
import { DeveloperSection } from "@/components/landing/developer-section";
import { LandingFooter } from "@/components/landing/landing-footer";
import { PricingSection } from "@/components/landing/pricing-section";
import { ProductMockupSection } from "@/components/landing/product-mockup-section";
import { WorkflowSection } from "@/components/landing/workflow-section";

export async function LandingPage() {
  const session = await auth();
  const isAuthenticated = !!session?.user;

  return (
    <div className="flex min-h-full flex-col">
      <main className="flex-1">
        <ProductMockupSection />
        <WorkflowSection />
        <PricingSection />
        <DeveloperSection />
        <CtaSection isAuthenticated={isAuthenticated} />
      </main>
      <LandingFooter isAuthenticated={isAuthenticated} />
    </div>
  );
}
