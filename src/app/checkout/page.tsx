import { CheckoutPageClient } from "@/components/checkout/CheckoutPageClient";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Checkout",
  description: "Complete your GLAMO NEPAL order with secure checkout. Pay with Khalti, eSewa, card or cash on delivery.",
  path: "/checkout",
  noIndex: true,
});

export default function CheckoutPage() {
  return <CheckoutPageClient />;
}