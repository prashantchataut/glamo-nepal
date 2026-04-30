import { AccountShell } from "@/components/account/AccountShell";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "My Account",
  description: "Manage GLAMO NEPAL profile, orders, wishlist, addresses and password settings.",
  path: "/account",
  noIndex: true,
});

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return <AccountShell>{children}</AccountShell>;
}
