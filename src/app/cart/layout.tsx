import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cart",
  description: "Review your GLAMO NEPAL cart with NPR totals, quantity controls, free delivery messaging and checkout link.",
  alternates: { canonical: "/cart" },
};

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return children;
}
