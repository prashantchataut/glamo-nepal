import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Frontend-only GLAMO NEPAL checkout with Nepal phone validation, COD availability, delivery estimates and payment method simulation.",
  robots: { index: false, follow: false },
};

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
