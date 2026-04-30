import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Compare Products",
  description: "Compare up to three GLAMO NEPAL products by price, brand, category, concerns, size, origin, stock and features.",
  alternates: { canonical: "/compare" },
};

export default function CompareLayout({ children }: { children: React.ReactNode }) {
  return children;
}
