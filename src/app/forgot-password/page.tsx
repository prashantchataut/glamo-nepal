import { Suspense } from "react";
import { AuthForm } from "@/components/auth/AuthForm";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Forgot Password",
  description: "Recover access to your GLAMO NEPAL customer account.",
  path: "/forgot-password",
  noIndex: true,
});

export default function ForgotPasswordPage() {
  return (
    <main className="bg-brand-bgLight py-10 md:py-16">
      <div className="container mx-auto px-4 md:px-6">
        <Suspense fallback={<div className="rounded-[2rem] bg-white p-8 text-brand-textMuted shadow-sm">Loading recovery form...</div>}>
          <AuthForm mode="forgot" />
        </Suspense>
      </div>
    </main>
  );
}
