import { HeroBanner } from "@/components/home/HeroBanner";
import { TrustBadgeMarquee } from "@/components/home/TrustBadgeMarquee";
import { QuickCategoryPills } from "@/components/home/QuickCategoryPills";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { ShopByCategory } from "@/components/home/ShopByCategory";
import { EditorialBanner } from "@/components/home/EditorialBanner";
import { PromoBannerGrid } from "@/components/home/PromoBannerGrid";
import { TheGlowEdit } from "@/components/home/TheGlowEdit";
import { BrandsMarquee } from "@/components/home/BrandsMarquee";
import { RoutineBuilderPreview } from "@/components/home/RoutineBuilderPreview";
import { BrandPhilosophyBanner } from "@/components/home/BrandPhilosophyBanner";
import { BeautyProfileQuiz } from "@/components/home/BeautyProfileQuiz";
import { BlogPreview } from "@/components/home/BlogPreview";
import { InstagramGallery } from "@/components/home/InstagramGallery";
import { NewsletterSignup } from "@/components/home/NewsletterSignup";
import { RecentlyViewedStrip } from "@/components/product/RecentlyViewedStrip";
import { ProductRecommendationStrip } from "@/components/product/ProductRecommendationStrip";
import { SoftWaveDivider, BlushCurveDivider, GoldSparkleLine } from "@/components/ui/illustrations/SectionDividers";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "GLAMO NEPAL — Premium Beauty & Skincare",
  description: "Curated beauty, skincare, makeup and haircare essentials with रू pricing and Nepal delivery. Shop authentic products at GLAMO NEPAL.",
  path: "/",
});

export default function HomePage() {
  return (
    <>
      <HeroBanner />
      <TrustBadgeMarquee />
      <QuickCategoryPills />
      <RecentlyViewedStrip />
      <GoldSparkleLine className="my-8 md:my-12" />
      <FeaturedProducts />
      <ProductRecommendationStrip title="Recommended for You" subtitle="Personalized picks" context="home" />
      <BlushCurveDivider />
      <ShopByCategory />
      <EditorialBanner />
      <SoftWaveDivider />
      <PromoBannerGrid />
      <GoldSparkleLine className="my-8 md:my-12" />
      <TheGlowEdit />
      <ProductRecommendationStrip title="Trending Now" subtitle="Popular this week" context="home" />
      <BrandsMarquee />
      <BlushCurveDivider />
      <RoutineBuilderPreview />
      <BrandPhilosophyBanner />
      <BeautyProfileQuiz />
      <GoldSparkleLine className="my-8 md:my-12" />
      <BlogPreview />
      <InstagramGallery />
      <NewsletterSignup />
    </>
  );
}