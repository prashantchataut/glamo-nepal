import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Admin Dashboard",
  description: "Protected GLAMO NEPAL administration workspace for products, orders, inventory, banners and store operations.",
  path: "/admin",
  noIndex: true,
});

export default function AdminPage() {
  return <AdminDashboard />;
}
