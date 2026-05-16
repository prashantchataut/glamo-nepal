import { AuthForm } from "@/components/auth/AuthForm";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Forgot Password",
  description: "Recover access to your GLAMO NEPAL customer account.",
  path: "/forgot-password",
  noIndex: true,
});

export default function ForgotPasswordPage({
  searchParams,
}: {
  searchParams?: { redirect?: string };
}) {
  const redirectTo = searchParams?.redirect || "/account";

  return (
    <main className="bg-cream-100 py-10 md:py-16">
      <div className="container mx-auto px-4 md:px-6">
        <AuthForm mode="forgot" redirectTo={redirectTo} />
      </div>
    </main>
  );
}
