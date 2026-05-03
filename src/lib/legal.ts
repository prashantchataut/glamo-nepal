import type { LegalSection } from "@/components/legal/LegalLayout";
import { SITE_CONFIG } from "@/lib/config";
import { FREE_DELIVERY_THRESHOLD } from "@/lib/delivery";
import { formatNPR } from "@/lib/utils";

export const privacySections: LegalSection[] = [
  { id: "collection", title: "Information we collect", body: ["GLAMO NEPAL may collect customer details such as name, phone number, email address, delivery address, order preferences and support messages when customers shop, create an account or contact the store.", "Basic device and shopping activity information may be used to improve site performance, product discovery and customer support."] },
  { id: "use", title: "How information is used", body: ["Customer data is used to process orders, coordinate delivery, verify payments, manage returns, answer support requests and improve the shopping experience.", "Marketing messages should only be sent with appropriate consent and a clear way to opt out."] },
  { id: "sharing", title: "Service providers", body: ["Necessary order details may be shared with payment providers, delivery partners and support tools so GLAMO NEPAL can complete purchases and provide customer care.", "GLAMO NEPAL should not sell customer data."] },
  { id: "security", title: "Security", body: ["Customer information should be handled through secure connections, restricted staff access and careful operational procedures.", "Payment confirmations should be verified with the selected payment provider before an order is fulfilled."] },
  { id: "contact", title: "Contact", body: [`For privacy questions, contact ${SITE_CONFIG.phone} or visit ${SITE_CONFIG.address}.`] },
];

export const termsSections: LegalSection[] = [
  { id: "scope", title: "Scope of service", body: ["These terms describe the GLAMO NEPAL ecommerce shopping experience for beauty, cosmetics and personal care products in Nepal.", "By placing an order, customers agree to provide accurate contact, delivery and payment information."] },
  { id: "orders", title: "Orders and pricing", body: ["Prices are shown in NPR. GLAMO NEPAL may confirm, cancel or adjust orders according to stock availability, payment verification, courier coverage and any clear pricing error.", "Product availability and offers may change without prior notice."] },
  { id: "payments", title: "Payments", body: ["Payment methods may include Khalti, eSewa, Cash on Delivery and Cards where available.", "Orders paid online are processed after payment confirmation. COD orders may be confirmed by phone or message before dispatch."] },
  { id: "product-info", title: "Product information", body: ["GLAMO NEPAL aims to present product names, prices, descriptions, ingredients and usage guidance accurately.", "Customers should read labels and patch test new beauty products, especially if they have allergies or sensitive skin."] },
  { id: "contact", title: "Contact", body: [`Questions can be sent to ${SITE_CONFIG.phone} or handled at ${SITE_CONFIG.address}.`] },
];

export const shippingSections: LegalSection[] = [
  { id: "coverage", title: "Delivery coverage", body: ["GLAMO NEPAL delivers inside Kathmandu Valley and to many locations across Nepal through available courier partners.", "Some addresses may require phone confirmation before dispatch."] },
  { id: "timelines", title: "Estimated timelines", body: ["Kathmandu Valley orders are usually delivered within 1 to 2 business days after confirmation.", "Outside-Valley orders usually arrive within 3 to 5 business days after dispatch, with additional time possible for remote areas or weather disruptions."] },
  { id: "fees", title: "Delivery fees", body: [`Free delivery is available on eligible orders over ${formatNPR(FREE_DELIVERY_THRESHOLD)} inside Kathmandu Valley. Thresholds for other areas may vary.`, "Delivery fees below that threshold depend on address, courier coverage, order size and payment method."] },
  { id: "pickup", title: "Store pickup", body: [`Store pickup may be arranged from ${SITE_CONFIG.address} after order confirmation.`] },
];

export const returnsSections: LegalSection[] = [
  { id: "eligibility", title: "Eligibility", body: ["Eligible products may be returned within 7 days if they are unused, unopened, sealed and in their original condition.", "Opened beauty, skincare, fragrance and hygiene-sensitive items may not be returnable unless they arrive damaged or incorrect."] },
  { id: "damaged", title: "Damaged or incorrect items", body: ["Customers should report damaged, missing or incorrect items as soon as possible with the order number, photos and delivery details.", "GLAMO NEPAL will review the issue and guide the customer on replacement, exchange or refund options."] },
  { id: "refunds", title: "Refunds and exchanges", body: ["Refunds for Khalti, eSewa and card payments follow the payment provider's processing timeline.", "COD returns may require manual verification before a refund or exchange is completed."] },
  { id: "support", title: "Support", body: [`For support, contact ${SITE_CONFIG.phone} or ${SITE_CONFIG.instagramHandle} at ${SITE_CONFIG.social.instagram}.`] },
];
