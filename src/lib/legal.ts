import type { LegalSection } from "@/components/legal/LegalLayout";
import { SITE_CONFIG } from "@/lib/constants";

export const privacySections: LegalSection[] = [
  { id: "collection", title: "Information we collect", body: ["GLAMO NEPAL may collect customer details such as name, phone, email, delivery address, order preferences and support messages when customers shop or create an account.", "Analytics and device information may be collected after production analytics tools are configured by the owner."] },
  { id: "use", title: "How information is used", body: ["Customer data is used to process orders, provide delivery support, improve the shopping experience, manage loyalty features and communicate order updates.", "Marketing communications should only be sent with the proper consent and unsubscribe controls."] },
  { id: "sharing", title: "Service providers", body: ["Production integrations may share necessary information with payment providers, delivery partners, analytics tools and support systems.", "GLAMO NEPAL should not sell customer data and should document all third-party processors before launch."] },
  { id: "security", title: "Security", body: ["This frontend is a mock implementation. Production must use secure backend sessions, server-side payment verification, encrypted transport and access-controlled admin APIs."] },
  { id: "contact", title: "Contact", body: [`For privacy questions, contact ${SITE_CONFIG.phone} or visit ${SITE_CONFIG.address}.`] },
];

export const termsSections: LegalSection[] = [
  { id: "scope", title: "Scope of service", body: ["These draft terms describe the intended GLAMO NEPAL ecommerce experience for beauty, cosmetics and personal care products in Nepal.", "Final terms must be reviewed by the owner and legal advisor before publication."] },
  { id: "orders", title: "Orders and pricing", body: ["Prices are shown in NPR. Mock products and pricing in this frontend must be replaced with supplier-approved, current production data before accepting orders.", "GLAMO NEPAL may confirm, cancel or adjust orders according to stock availability and payment verification rules."] },
  { id: "payments", title: "Payments", body: ["Payment methods shown include Khalti, eSewa, Cash on Delivery and Cards. Real merchant credentials and server-side verification are required before launch."] },
  { id: "content", title: "Product information", body: ["Product claims, ingredients, usage instructions, shade details and images must be supplier-approved and reviewed for accuracy before production."] },
  { id: "contact", title: "Contact", body: [`Questions can be sent to ${SITE_CONFIG.phone} or handled at ${SITE_CONFIG.address}.`] },
];

export const shippingSections: LegalSection[] = [
  { id: "coverage", title: "Delivery coverage", body: ["The frontend includes Nepal province, district and COD availability mock logic. Real courier coverage, delivery windows and serviceable locations must be configured by the owner."] },
  { id: "timelines", title: "Estimated timelines", body: ["Kathmandu Valley deliveries can be displayed as faster than out-of-valley deliveries, but final timelines must come from the selected courier and warehouse operations."] },
  { id: "fees", title: "Delivery fees", body: ["Delivery fee calculations are simulated. Production checkout should calculate fees from cart weight/value, address, courier rules, promotions and COD availability."] },
  { id: "pickup", title: "Store pickup", body: [`Store pickup messaging may reference ${SITE_CONFIG.address} once the owner confirms operating hours and pickup workflow.`] },
];

export const returnsSections: LegalSection[] = [
  { id: "eligibility", title: "Eligibility", body: ["Beauty and cosmetics returns require strict hygiene rules. Final eligibility must be approved by the owner and legal advisor.", "Unopened, unused and sealed products may be considered according to the production return policy."] },
  { id: "damaged", title: "Damaged or incorrect items", body: ["Customers should be able to report damaged, missing or incorrect items with order number, photos and delivery details. Photo upload is currently a frontend placeholder."] },
  { id: "refunds", title: "Refunds and exchanges", body: ["Refunds for Khalti, eSewa and card payments require payment-provider reconciliation. COD returns require manual verification and clear owner policy."] },
  { id: "support", title: "Support", body: [`For support, contact ${SITE_CONFIG.phone} or ${SITE_CONFIG.instagramHandle} at ${SITE_CONFIG.social.instagram}.`] },
];
