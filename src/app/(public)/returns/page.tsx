import { LegalLayout } from "@/components/legal/LegalLayout";
import { returnsSections } from "@/lib/legal";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Returns Policy",
  description: "Read GLAMO NEPAL returns, exchange, refund and damaged item guidance.",
  path: "/returns",
});

export default function ReturnsPage() {
  return <LegalLayout title="Returns Policy" description="Beauty-product returns, exchange and damaged item guidance for GLAMO NEPAL shoppers." sections={returnsSections} />;
}
