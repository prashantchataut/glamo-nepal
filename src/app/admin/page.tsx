import { DashboardView } from "@/components/admin/dashboard/DashboardView";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Dashboard",
  description: "Store overview, today's actions and recent orders.",
  path: "/admin",
  noIndex: true,
});

export const dynamic = "force-dynamic";

export default function AdminHomePage() {
  return <DashboardView />;
}
