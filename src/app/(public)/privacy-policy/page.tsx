import { LegalLayout } from "@/components/legal/LegalLayout";
import { privacySections } from "@/lib/legal";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({ title: "Privacy Policy", description: "Read the GLAMO Nepal privacy policy for customer data, orders, analytics and service providers.", path: "/privacy-policy" });
export default function PrivacyPolicyPage() { return <LegalLayout title="Privacy Policy" description="How GLAMO Nepal handles customer data, orders, support requests and service providers." sections={privacySections} />; }
