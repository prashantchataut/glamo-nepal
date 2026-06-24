import { PopupsView } from "@/components/admin/popups/PopupsView";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({ title: "Popup Manager", description: "Create, schedule, pause and delete storefront popups.", path: "/admin/popups", noIndex: true });
export const dynamic = "force-dynamic";

export default function PopupsPage() {
  return <PopupsView />;
}
