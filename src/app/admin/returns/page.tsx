import { ReturnsView } from "@/components/admin/returns/ReturnsView";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({ title: "Returns", description: "Manage hygiene-safe beauty returns and resolutions.", path: "/admin/returns", noIndex: true });
export const dynamic = "force-dynamic";

export default function ReturnsPage() {
  return <ReturnsView />;
}
