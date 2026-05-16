import { AccountDashboardClient } from "@/components/account/AccountDashboardClient";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "My Account",
  description: "Manage your GLAMO NEPAL account, orders, wishlist and settings.",
  path: "/account",
  noIndex: true,
});

export default function AccountDashboardPage() {
  return <AccountDashboardClient />;
}
