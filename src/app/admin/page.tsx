import { DashboardView } from "@/components/admin/dashboard/DashboardView";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Dashboard",
  description: "Business action dashboard for GLAMO NEPAL operations.",
  path: "/admin",
  noIndex: true,
});

export const dynamic = "force-dynamic";

export default function AdminPage() {
  return <DashboardView />;
}
