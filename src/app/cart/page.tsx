import { CartPageClient } from "@/components/cart/CartPageClient";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Shopping Cart",
  description: "Review GLAMO NEPAL cart items, NPR totals, free delivery messaging and checkout link.",
  path: "/cart",
  noIndex: true,
});

export default function CartPage() {
  return <CartPageClient />;
}
