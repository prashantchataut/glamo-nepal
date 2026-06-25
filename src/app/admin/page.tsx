import { SettingsView } from "@/components/admin/settings/SettingsView";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({ title: "Settings", description: "Store settings and operational defaults.", path: "/admin/settings", noIndex: true });
export const dynamic = "force-dynamic";

export default function SettingsPage() {
  return <SettingsView />;
}
