import { LegalLayout } from "@/components/legal/LegalLayout";
import { termsSections } from "@/lib/legal";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Terms & Conditions",
  description: "Review GLAMO NEPAL ecommerce terms for orders, payments, product information and customer support.",
  path: "/terms",
});

export default function TermsPage() {
  return <LegalLayout title="Terms & Conditions" description="Terms and conditions for GLAMO NEPAL ecommerce shopping." sections={termsSections} />;
}
