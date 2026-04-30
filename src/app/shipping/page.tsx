import { LegalLayout } from "@/components/legal/LegalLayout";
import { shippingSections } from "@/lib/legal";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Shipping Policy",
  description: "Read GLAMO NEPAL shipping coverage, delivery estimates, fees and store pickup guidance.",
  path: "/shipping",
});

export default function ShippingPage() {
  return <LegalLayout title="Shipping Policy" description="Shipping policy for Nepal delivery, COD serviceability and store pickup." sections={shippingSections} />;
}
