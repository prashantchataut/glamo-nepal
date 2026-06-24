import { AuditLogView } from "@/components/admin/audit/AuditLogView";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({ title: "Audit Log", description: "Review admin changes and exports.", path: "/admin/audit", noIndex: true });
export const dynamic = "force-dynamic";

export default function AuditPage() {
  return <AuditLogView />;
}
