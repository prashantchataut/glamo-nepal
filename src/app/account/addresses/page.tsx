import { AddressesClient } from "@/components/account/AddressesClient";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({ title: "Saved Addresses", description: "Manage GLAMO Nepal delivery addresses and default shipping locations.", path: "/account/addresses", noIndex: true });

export default function AddressesPage() {
  return <AddressesClient />;
}