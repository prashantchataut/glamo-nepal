import { Suspense } from "react";
import { AuthForm } from "@/components/auth/AuthForm";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Reset Password",
  description: "Preview the GLAMO NEPAL reset password screen for a future token-based auth flow.",
  path: "/reset-password",
  noIndex: true,
});

export default function ResetPasswordPage() {
  return (
    <main className="bg-brand-bgLight py-10 md:py-16">
      <div className="container mx-auto px-4 md:px-6">
        <Suspense fallback={<div className="rounded-[2rem] bg-white p-8 text-brand-textMuted shadow-sm">Loading reset form...</div>}>
          <AuthForm mode="reset" />
        </Suspense>
      </div>
    </main>
  );
}
