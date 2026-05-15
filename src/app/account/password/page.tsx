// TODO: Add auth guard redirect when Supabase auth is connected
// Example: if (!user) redirect('/login')
import { PasswordForm } from "@/components/account/PasswordForm";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Change Password",
  description: "Update your GLAMO NEPAL account password.",
  path: "/account/password",
  noIndex: true,
});

export default function PasswordPage() {
  return <PasswordForm />;
}
