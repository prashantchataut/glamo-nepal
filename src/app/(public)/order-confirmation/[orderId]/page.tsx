import { CheckoutSuccessClient } from "@/components/checkout/CheckoutSuccessClient";
import { createMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = createMetadata({
  title: "Order Confirmed",
  description: "Your GLAMO Nepal order confirmation.",
  path: "/order-confirmation",
  noIndex: true,
});

export default function OrderConfirmationPage() {
  return <CheckoutSuccessClient />;
}
