import { AccountDashboardClient } from "@/components/account/AccountDashboardClient";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "My Account",
  description: "Manage your GLAMO NEPAL profile, orders, wishlist and addresses.",
  path: "/account",
  noIndex: true,
});

export default function AccountPage() {
  return <AccountDashboardClient />;
}
