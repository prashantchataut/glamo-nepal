import { createMetadata } from "@/lib/seo";
import { OrdersClient } from "@/components/account/OrdersClient";

export const metadata = createMetadata({
  title: "Your Orders",
  description: "View your GLAMO NEPAL order history, track deliveries and manage returns.",
  path: "/account/orders",
  noIndex: true,
});

export default function OrdersPage() {
  return <OrdersClient />;
}