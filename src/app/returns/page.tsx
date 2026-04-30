import { LegalLayout } from "@/components/legal/LegalLayout";
import { returnsSections } from "@/lib/legal";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Returns Policy",
  description: "Read draft GLAMO NEPAL returns, exchange, refund and damaged item guidance.",
  path: "/returns",
});

export default function ReturnsPage() {
  return <LegalLayout title="Returns Policy" description="Draft beauty-product returns policy that needs final business and legal approval." sections={returnsSections} />;
}
