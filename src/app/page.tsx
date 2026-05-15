import { HeroBanner } from "@/components/home/HeroBanner";
import { ShopByCategory } from "@/components/home/ShopByCategory";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { BrandPhilosophyBanner } from "@/components/home/BrandPhilosophyBanner";
import { BrandsMarquee } from "@/components/home/BrandsMarquee";
import { BestSellers } from "@/components/home/BestSellers";
import { EditorialStrip } from "@/components/home/EditorialStrip";
import { Testimonials } from "@/components/home/Testimonials";
import { NewsletterSignup } from "@/components/home/NewsletterSignup";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "GLAMO Nepal — Premium Beauty & Skincare",
  description:
    "Curated beauty, skincare, makeup and haircare essentials with रू pricing and Nepal delivery. Shop authentic products at GLAMO Nepal.",
  path: "/",
});

export default function HomePage() {
  return (
    <main>
      <HeroBanner />
      <ShopByCategory />
      <FeaturedProducts />
      <BrandPhilosophyBanner />
      <BrandsMarquee />
      <BestSellers />
      <EditorialStrip />
      <Testimonials />
      <NewsletterSignup />
    </main>
  );
}