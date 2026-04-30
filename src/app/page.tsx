import { createMetadata } from "@/lib/seo";
import { HeroBanner } from "@/components/home/HeroBanner";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { ShopByCategory } from "@/components/home/ShopByCategory";
import { QuickCategoryPills } from "@/components/home/QuickCategoryPills";
import { TheGlowEdit } from "@/components/home/TheGlowEdit";
import { PromoBannerGrid } from "@/components/home/PromoBannerGrid";
import { BrandPhilosophyBanner } from "@/components/home/BrandPhilosophyBanner";
import { BeautyProfileQuiz } from "@/components/home/BeautyProfileQuiz";
import { RoutineBuilderPreview } from "@/components/home/RoutineBuilderPreview";
import { InstagramGallery } from "@/components/home/InstagramGallery";
import { BlogPreview } from "@/components/home/BlogPreview";
import { NewsletterSignup } from "@/components/home/NewsletterSignup";
import { TrustBadgeMarquee } from "@/components/home/TrustBadgeMarquee";
import { DashainSaleBanner } from "@/components/home/DashainSaleBanner";
import { BrandsMarquee } from "@/components/home/BrandsMarquee";

export const metadata = createMetadata({
  title: "GLAMO NEPAL — Premium Beauty & Cosmetics",
  description:
    "Shop premium beauty, cosmetics and personal care curated for Nepal. Authentic skincare, makeup, haircare and more at GLAMO NEPAL, Naya Baneshwor.",
  path: "/",
  keywords: [
    "GLAMO NEPAL",
    "beauty Nepal",
    "cosmetics Kathmandu",
    "skincare Nepal",
    "makeup Nepal",
    "Nepal beauty ecommerce",
    "Khalti beauty",
    "eSewa beauty",
  ],
});

export default function HomePage() {
  return (
    <>
      <HeroBanner />
      <QuickCategoryPills />
      <FeaturedProducts />
      <ShopByCategory />
      <DashainSaleBanner />
      <TheGlowEdit />
      <PromoBannerGrid />
      <BrandPhilosophyBanner />
      <BeautyProfileQuiz />
      <RoutineBuilderPreview />
      <BrandsMarquee />
      <InstagramGallery />
      <BlogPreview />
      <TrustBadgeMarquee />
      <NewsletterSignup />
    </>
  );
}