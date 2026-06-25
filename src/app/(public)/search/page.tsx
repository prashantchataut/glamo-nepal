import { Suspense } from "react";
import SearchPageContent from "./SearchPageContent";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Search",
  description: "Search GLAMO NEPAL beauty products, brands, categories and Nepal-market picks.",
  path: "/search",
  noIndex: true,
});

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-neutral-50" />}>
      <SearchPageContent />
    </Suspense>
  );
}
