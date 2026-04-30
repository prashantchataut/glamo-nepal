import { LegalLayout } from "@/components/legal/LegalLayout";
import { termsSections } from "@/lib/legal";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Terms & Conditions",
  description: "Review draft GLAMO NEPAL ecommerce terms for orders, payments, product information and customer support.",
  path: "/terms",
});

export default function TermsPage() {
  return <LegalLayout title="Terms & Conditions" description="Draft ecommerce terms that require owner and legal approval before production launch." sections={termsSections} />;
}
