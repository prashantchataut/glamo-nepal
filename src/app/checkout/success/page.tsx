import { CheckoutSuccessClient } from "@/components/checkout/CheckoutSuccessClient";
import { createMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = createMetadata({
  title: "Checkout Success",
  description: "GLAMO NEPAL order confirmation screen.",
  path: "/checkout/success",
  noIndex: true,
});

export default function CheckoutSuccessPage() {
  return <CheckoutSuccessClient />;
}
