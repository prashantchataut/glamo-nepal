import { AuthForm } from "@/components/auth/AuthForm";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Reset Password",
  description: "Create a new password for your GLAMO NEPAL customer account.",
  path: "/reset-password",
  noIndex: true,
});

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams?: { redirect?: string };
}) {
  const redirectTo = searchParams?.redirect || "/account";

  return (
    <main className="bg-cream-100 py-10 md:py-16">
      <div className="container mx-auto px-4 md:px-6">
        <AuthForm mode="reset" redirectTo={redirectTo} />
      </div>
    </main>
  );
}
