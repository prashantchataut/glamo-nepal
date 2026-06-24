import { BackupExportView } from "@/components/admin/backups/BackupExportView";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({ title: "Backups and Exports", description: "Download products, orders, customers, media and activity exports.", path: "/admin/backups", noIndex: true });
export const dynamic = "force-dynamic";

export default function BackupsPage() {
  return <BackupExportView />;
}
