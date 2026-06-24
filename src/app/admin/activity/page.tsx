import { ActivityHistoryView } from "@/components/admin/activity/ActivityHistoryView";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({ title: "Activity History", description: "Human-readable staff activity history.", path: "/admin/activity", noIndex: true });
export const dynamic = "force-dynamic";

export default function ActivityPage() {
  return <ActivityHistoryView />;
}
