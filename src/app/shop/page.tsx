import { Suspense } from "react";
import ShopPageContent from "./ShopPageContent";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Shop Beauty Products",
  description: "Browse GLAMO NEPAL skincare, makeup, haircare, bodycare, fragrance and beauty tools with Nepal-market filters and NPR pricing.",
  path: "/shop",
});

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-brand-bgLight" />}>
      <ShopPageContent />
    </Suspense>
  );
}
