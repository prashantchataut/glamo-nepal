// TODO: Add auth guard redirect when Supabase auth is connected
// Example: if (!user) redirect('/login')
import { createMetadata } from "@/lib/seo";
import { OrdersClient } from "@/components/account/OrdersClient";

export const metadata = createMetadata({
  title: "My Orders",
  description: "View your GLAMO NEPAL order history and track deliveries.",
  path: "/account/orders",
  noIndex: true,
});

export default function OrdersPage() {
  return <OrdersClient />;
}