import { createMetadata } from "@/lib/seo";
import { OrdersClient } from "@/components/account/OrdersClient";

export const metadata = createMetadata({
  title: "Orders",
  description: "View your GLAMO NEPAL order history, delivery status and details.",
  path: "/account/orders",
  noIndex: true,
});

export default function OrdersPage() {
  return <OrdersClient />;
}