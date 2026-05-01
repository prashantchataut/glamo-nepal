import dynamicImport from "next/dynamic";
import { createMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = createMetadata({
  title: "Checkout",
  description: "Complete your GLAMO NEPAL order with Nepal delivery details, COD availability, gift wrapping and payment selection.",
  path: "/checkout",
  noIndex: true,
});

const CheckoutPageClient = dynamicImport(
  () => import("@/components/checkout/CheckoutPageClient").then((mod) => mod.CheckoutPageClient),
  { ssr: false }
);

export default function CheckoutPage() {
  return <CheckoutPageClient />;
}