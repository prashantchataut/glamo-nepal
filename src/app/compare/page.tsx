import { ComparePageClient } from "@/components/compare/ComparePageClient";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Compare Products",
  description: "Compare up to three GLAMO NEPAL beauty products by price, brand, concern, size, origin, stock and features.",
  path: "/compare",
  noIndex: true,
});

export default function ComparePage() {
  return <ComparePageClient />;
}
