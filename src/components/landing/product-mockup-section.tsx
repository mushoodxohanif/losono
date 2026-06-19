import { FeaturesSection } from "@/components/landing/features-section";
import { HeroSection } from "@/components/landing/hero-section";
import {
  ProductMockupBottom,
  ProductMockupTop,
} from "@/components/landing/product-mockup";
import { MockupProvider } from "@/components/landing/product-mockup-context";

export function ProductMockupSection() {
  return (
    <MockupProvider>
      <HeroSection
        mockup={
          <div className="mt-16 sm:mt-20">
            <ProductMockupTop />
          </div>
        }
      />
      <FeaturesSection mockup={<ProductMockupBottom />} />
    </MockupProvider>
  );
}
