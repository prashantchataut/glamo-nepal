import { CustomersView } from "@/components/admin/customers/CustomersView";
import { AdminRouteSearchSync } from "@/components/admin/shared/AdminRouteSearchSync";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({ title: "Customers", description: "Manage customer profiles and order history.", path: "/admin/customers", noIndex: true });
export const dynamic = "force-dynamic";

export default function CustomersPage() {
  return <><AdminRouteSearchSync target="customers" /><CustomersView /></>;
}
