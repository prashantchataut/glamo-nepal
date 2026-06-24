import { OrdersView } from "@/components/admin/orders/OrdersView";
import { AdminRouteSearchSync } from "@/components/admin/shared/AdminRouteSearchSync";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({ title: "Orders", description: "Manage order status, payments and fulfillment.", path: "/admin/orders", noIndex: true });
export const dynamic = "force-dynamic";

export default function OrdersPage() {
  return <><AdminRouteSearchSync target="orders" /><OrdersView /></>;
}
