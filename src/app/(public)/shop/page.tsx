import { Suspense } from "react";
import ShopPageContent from "./ShopPageContent";
import { ProductGridSkeleton } from "@/components/common/SkeletonComponents";
import { createMetadata, breadcrumbJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";

export const metadata = createMetadata({
  title: "Shop Beauty Products",
  description: "Browse GLAMO NEPAL skincare, makeup, haircare, bodycare, fragrance and beauty tools with Nepal-market filters and NPR pricing.",
  path: "/shop",
  keywords: ["shop beauty Nepal", "skincare Nepal", "makeup Nepal", "sunscreen Nepal", "GLAMO NEPAL shop"],
});

export default function ShopPage() {
  return (
    <Suspense fallback={<ProductGridSkeleton />}>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Shop", path: "/shop" }])} />
      <ShopPageContent />
    </Suspense>
  );
}