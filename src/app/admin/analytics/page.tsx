import { AnalyticsView } from "@/components/admin/analytics/AnalyticsView";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({ title: "Analytics", description: "Sales and performance reports.", path: "/admin/analytics", noIndex: true });
export const dynamic = "force-dynamic";

export default function AnalyticsPage() {
  return <AnalyticsView />;
}
