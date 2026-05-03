import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Cart",
  description: "Review your GLAMO NEPAL cart with NPR totals, quantity controls, free delivery messaging and checkout link.",
  path: "/cart",
  noIndex: true,
});

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return children;
}