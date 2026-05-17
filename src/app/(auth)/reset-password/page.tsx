import { Suspense } from "react";
import { AuthForm } from "@/components/auth/AuthForm";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Reset Password",
  description: "Create a new password for your GLAMO NEPAL customer account.",
  path: "/reset-password",
  noIndex: true,
});

export default function ResetPasswordPage() {
  return (
    <main className="bg-[#fbf7f3] py-10 md:py-16">
      <div className="container mx-auto px-4 md:px-6">
        <Suspense fallback={<div className="mx-auto max-w-5xl bg-white p-8 text-neutral-400">Loading reset form...</div>}>
          <AuthForm mode="reset" />
        </Suspense>
      </div>
    </main>
  );
}