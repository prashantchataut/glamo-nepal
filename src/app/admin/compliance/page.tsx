import { ComplianceView } from "@/components/admin/compliance/ComplianceView";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({ title: "Compliance", description: "Operational guardrails for beauty ecommerce admin workflows.", path: "/admin/compliance", noIndex: true });
export const dynamic = "force-dynamic";

export default function CompliancePage() {
  return <ComplianceView />;
}
