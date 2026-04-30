import { LegalLayout } from "@/components/legal/LegalLayout";
import { shippingSections } from "@/lib/legal";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Shipping Policy",
  description: "Read draft GLAMO NEPAL shipping coverage, delivery estimates, fees and store pickup guidance.",
  path: "/shipping",
});

export default function ShippingPage() {
  return <LegalLayout title="Shipping Policy" description="Draft shipping policy for Nepal delivery, COD rules and store pickup workflows." sections={shippingSections} />;
}
