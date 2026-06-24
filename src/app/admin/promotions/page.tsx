import { PromotionsView } from "@/components/admin/promotions/PromotionsView";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({ title: "Promotions", description: "Manage discount codes, launch playbooks and campaign planning.", path: "/admin/promotions", noIndex: true });
export const dynamic = "force-dynamic";

export default function PromotionsPage() {
  return <PromotionsView />;
}
