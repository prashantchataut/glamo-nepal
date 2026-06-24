import { InventoryView } from "@/components/admin/inventory/InventoryView";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({ title: "Inventory", description: "Track stock, low-stock alerts and adjustments.", path: "/admin/inventory", noIndex: true });
export const dynamic = "force-dynamic";

export default function InventoryPage() {
  return <InventoryView />;
}
