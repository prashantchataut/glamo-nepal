import { WishlistClient } from "@/components/account/WishlistClient";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Wishlist",
  description: "View saved GLAMO NEPAL products in the customer account wishlist.",
  path: "/account/wishlist",
  noIndex: true,
});

export default function WishlistPage() {
  return <WishlistClient />;
}
