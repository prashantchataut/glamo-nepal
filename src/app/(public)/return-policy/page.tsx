import { LegalLayout } from "@/components/legal/LegalLayout";
import { returnsSections } from "@/lib/legal";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({ title: "Return Policy", description: "Read GLAMO Nepal returns, exchange, refund and damaged item guidance.", path: "/return-policy" });
export default function ReturnPolicyPage() { return <LegalLayout title="Return Policy" description="Beauty-product returns, exchange and damaged item guidance for GLAMO Nepal shoppers." sections={returnsSections} />; }
