import { CheckoutSuccessClient } from "@/components/checkout/CheckoutSuccessClient";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Order Confirmed",
  description: "GLAMO NEPAL order confirmation screen.",
  path: "/order/success",
  noIndex: true,
});

export default function OrderSuccessPage() {
  return <CheckoutSuccessClient />;
}
