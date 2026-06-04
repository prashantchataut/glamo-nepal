import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Dashboard",
  description: "Workspace.",
  path: "/admin",
  noIndex: true,
});

export const dynamic = "force-dynamic";

export default function AdminPage() {
  return <AdminDashboard />;
}