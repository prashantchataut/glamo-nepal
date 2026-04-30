import { BeautyProfileQuiz } from "@/components/home/BeautyProfileQuiz";
import { BlogPreview } from "@/components/home/BlogPreview";
import { BrandPhilosophyBanner } from "@/components/home/BrandPhilosophyBanner";
import { BrandsMarquee } from "@/components/home/BrandsMarquee";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { HeroBanner } from "@/components/home/HeroBanner";
import { InstagramGallery } from "@/components/home/InstagramGallery";
import { NewYearOfferBanner } from "@/components/home/NewYearOfferBanner";
import { NewsletterSignup } from "@/components/home/NewsletterSignup";
import { PromoBannerGrid } from "@/components/home/PromoBannerGrid";
import { QuickCategoryPills } from "@/components/home/QuickCategoryPills";
import { RoutineBuilderPreview } from "@/components/home/RoutineBuilderPreview";
import { ShopByCategory } from "@/components/home/ShopByCategory";
import { TheGlowEdit } from "@/components/home/TheGlowEdit";
import { TrustBadgeMarquee } from "@/components/home/TrustBadgeMarquee";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbJsonLd, createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Premium Beauty & Cosmetics in Nepal",
  description: "Shop GLAMO NEPAL for premium skincare, makeup, haircare, fragrance and beauty gifts from Naya Baneshwor, Kathmandu.",
  path: "/",
  keywords: ["beauty Nepal", "cosmetics Kathmandu", "skincare Nepal", "GLAMO NEPAL"],
});

export default function HomePage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }])} />
      <HeroBanner />
      <TrustBadgeMarquee />
      <QuickCategoryPills />
      <FeaturedProducts />
      <ShopByCategory />
      <NewYearOfferBanner />
      <TheGlowEdit />
      <PromoBannerGrid />
      <BrandPhilosophyBanner />
      <BeautyProfileQuiz />
      <RoutineBuilderPreview />
      <BrandsMarquee />
      <InstagramGallery />
      <BlogPreview />
      <NewsletterSignup />
    </>
  );
}
