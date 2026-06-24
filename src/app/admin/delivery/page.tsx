import { DeliveryManagerView } from "@/components/admin/delivery/DeliveryManagerView";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({ title: "Delivery Manager", description: "Manage delivery zones, fees and Cash on Delivery settings.", path: "/admin/delivery", noIndex: true });
export const dynamic = "force-dynamic";

export default function DeliveryPage() {
  return <DeliveryManagerView />;
}
