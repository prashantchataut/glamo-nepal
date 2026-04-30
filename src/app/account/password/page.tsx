import { PasswordForm } from "@/components/account/PasswordForm";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Change Password",
  description: "Update GLAMO NEPAL account password in the frontend mock dashboard.",
  path: "/account/password",
  noIndex: true,
});

export default function PasswordPage() {
  return <PasswordForm />;
}
