import { HeroBanner } from "@/components/home/HeroBanner";
import { TrustBadgeMarquee } from "@/components/home/TrustBadgeMarquee";
import { QuickCategoryPills } from "@/components/home/QuickCategoryPills";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { ShopByCategory } from "@/components/home/ShopByCategory";
import { NewYearOfferBanner } from "@/components/home/NewYearOfferBanner";
import { PromoBannerGrid } from "@/components/home/PromoBannerGrid";
import { TheGlowEdit } from "@/components/home/TheGlowEdit";
import { BrandsMarquee } from "@/components/home/BrandsMarquee";
import { RoutineBuilderPreview } from "@/components/home/RoutineBuilderPreview";
import { BrandPhilosophyBanner } from "@/components/home/BrandPhilosophyBanner";
import { BeautyProfileQuiz } from "@/components/home/BeautyProfileQuiz";
import { BlogPreview } from "@/components/home/BlogPreview";
import { InstagramGallery } from "@/components/home/InstagramGallery";
import { NewsletterSignup } from "@/components/home/NewsletterSignup";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "GLAMO NEPAL — Premium Beauty & Skincare",
  description: "Curated beauty, skincare, makeup and haircare essentials with NPR pricing and Nepal delivery. Shop authentic products at GLAMO NEPAL.",
  path: "/",
});

export default function HomePage() {
  return (
    <>
      <HeroBanner />
      <TrustBadgeMarquee />
      <QuickCategoryPills />
      <FeaturedProducts />
      <ShopByCategory />
      <NewYearOfferBanner />
      <PromoBannerGrid />
      <TheGlowEdit />
      <BrandsMarquee />
      <RoutineBuilderPreview />
      <BrandPhilosophyBanner />
      <BeautyProfileQuiz />
      <BlogPreview />
      <InstagramGallery />
      <NewsletterSignup />
    </>
  );
}