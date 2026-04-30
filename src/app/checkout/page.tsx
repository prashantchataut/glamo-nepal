import { CheckoutPageClient } from "@/components/checkout/CheckoutPageClient";
import { createMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = createMetadata({
  title: "Checkout",
  description: "Complete your GLAMO NEPAL order with Nepal delivery details, COD availability, gift wrapping and payment selection.",
  path: "/checkout",
  noIndex: true,
});

export default function CheckoutPage() {
  return <CheckoutPageClient />;
}
