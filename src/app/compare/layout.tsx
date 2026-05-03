import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Compare Products",
  description: "Compare up to three GLAMO NEPAL products by price, brand, category, concerns, size, origin, stock and features.",
  path: "/compare",
  noIndex: true,
});

export default function CompareLayout({ children }: { children: React.ReactNode }) {
  return children;
}