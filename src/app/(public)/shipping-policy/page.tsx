import { LegalLayout } from "@/components/legal/LegalLayout";
import { shippingSections } from "@/lib/legal";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({ title: "Shipping Policy", description: "Read GLAMO Nepal shipping coverage, delivery timing and courier guidance.", path: "/shipping-policy" });
export default function ShippingPolicyPage() { return <LegalLayout title="Shipping Policy" description="Delivery timing, courier coverage and shipping expectations for GLAMO Nepal orders." sections={shippingSections} />; }
