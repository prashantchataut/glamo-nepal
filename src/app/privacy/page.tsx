import { LegalLayout } from "@/components/legal/LegalLayout";
import { privacySections } from "@/lib/legal";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Privacy Policy",
  description: "Read the GLAMO NEPAL privacy policy for customer data, orders, analytics and service providers.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return <LegalLayout title="Privacy Policy" description="Privacy policy for GLAMO NEPAL's premium beauty ecommerce experience." sections={privacySections} />;
}
