import { ProductsView } from "@/components/admin/products/ProductsView";
import { ProductQualityChecklist } from "@/components/admin/products/ProductQualityChecklist";
import { AdminRouteSearchSync } from "@/components/admin/shared/AdminRouteSearchSync";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({ title: "Products", description: "Manage beauty catalog, stock, product status and images.", path: "/admin/products", noIndex: true });
export const dynamic = "force-dynamic";

export default function ProductsPage() {
  return <><AdminRouteSearchSync target="products" /><ProductQualityChecklist /><ProductsView /></>;
}
