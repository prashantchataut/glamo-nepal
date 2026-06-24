import { IssueCenterView } from "@/components/admin/issues/IssueCenterView";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({ title: "Issue Center", description: "Plain-language admin issues and owner action list.", path: "/admin/issues", noIndex: true });
export const dynamic = "force-dynamic";

export default function IssuesPage() {
  return <IssueCenterView />;
}
