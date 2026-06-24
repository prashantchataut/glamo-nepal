import { SetupWizardView } from "@/components/admin/setup/SetupWizardView";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({ title: "Setup Wizard", description: "Guided owner setup for GLAMO Nepal admin.", path: "/admin/setup", noIndex: true });
export const dynamic = "force-dynamic";

export default function SetupPage() {
  return <SetupWizardView />;
}
