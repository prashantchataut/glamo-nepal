import { redirect } from "next/navigation";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Wishlist",
  description: "View saved GLAMO NEPAL products in your account wishlist.",
  path: "/wishlist",
  noIndex: true,
});

export default function WishlistRoute() {
  redirect("/account/wishlist");
}
