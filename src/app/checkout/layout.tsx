import type { ReactNode } from "react";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Checkout",
  description: "Complete your GLAMO NEPAL order with Nepal phone validation, COD availability, delivery estimates and payment selection.",
  path: "/checkout",
  noIndex: true,
});

export default function CheckoutLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
