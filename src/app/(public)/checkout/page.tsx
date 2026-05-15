import { createMetadata } from "@/lib/seo";
import { CheckoutPageClient } from "@/components/checkout/CheckoutPageClient";

export const dynamic = "force-dynamic";

export const metadata = createMetadata({
  title: "Checkout",
  description: "Complete your GLAMO NEPAL order.",
  path: "/checkout",
  noIndex: true,
});

export default function CheckoutPage() {
  return <CheckoutPageClient />;
}