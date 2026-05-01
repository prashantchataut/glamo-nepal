import dynamic from "next/dynamic";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Checkout Success",
  description: "GLAMO NEPAL order confirmation screen.",
  path: "/checkout/success",
  noIndex: true,
});

const CheckoutSuccessClient = dynamic(
  () => import("@/components/checkout/CheckoutSuccessClient").then((mod) => mod.CheckoutSuccessClient),
  { ssr: false }
);

export default function CheckoutSuccessPage() {
  return <CheckoutSuccessClient />;
}