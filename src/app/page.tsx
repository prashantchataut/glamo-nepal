import { HeroBanner } from "@/components/home/HeroBanner";
import { ShopByCategory } from "@/components/home/ShopByCategory";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { BrandPhilosophyBanner } from "@/components/home/BrandPhilosophyBanner";
import { BrandShowcase } from "@/components/home/BrandShowcase";
import { BestSellers } from "@/components/home/BestSellers";
import { EditorialStrip } from "@/components/home/EditorialStrip";
import { NewsletterSignup } from "@/components/home/NewsletterSignup";
import { LazySection } from "@/components/common/LazySection";
import { createMetadata } from "@/lib/seo";
import { localBusinessJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";

export const revalidate = 300;

export const metadata = createMetadata({
  title: "GLAMO Nepal — Premium Beauty & Skincare",
  description:
    "Curated beauty, skincare, makeup and haircare essentials with रू pricing and Nepal delivery. Shop authentic products at GLAMO Nepal.",
  path: "/",
});

export default function HomePage() {
  return (
    <main className="bg-neutral-50">
      <JsonLd data={localBusinessJsonLd()} />
      <HeroBanner />
      <ShopByCategory />
      <FeaturedProducts />
      <LazySection>
        <BrandPhilosophyBanner />
      </LazySection>
      <LazySection>
        <BrandShowcase />
      </LazySection>
      <LazySection>
        <BestSellers />
      </LazySection>
      <LazySection>
        <EditorialStrip />
      </LazySection>
      <LazySection>
        <NewsletterSignup />
      </LazySection>
    </main>
  );
}