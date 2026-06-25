import { SupportDeskView } from "@/components/admin/support/SupportDeskView";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({ title: "Support Desk", description: "Customer support workspace for orders, returns and templates.", path: "/admin/support", noIndex: true });
export const dynamic = "force-dynamic";

export default function SupportPage() {
  return <SupportDeskView />;
}
