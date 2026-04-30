import { Suspense } from "react";
import { AuthForm } from "@/components/auth/AuthForm";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Login",
  description: "Sign in to your GLAMO NEPAL account to view orders, wishlist, saved addresses and loyalty points.",
  path: "/login",
  noIndex: true,
});

export default function LoginPage() {
  return (
    <main className="bg-brand-bgLight py-10 md:py-16">
      <div className="container mx-auto px-4 md:px-6">
        <Suspense fallback={<div className="rounded-[2rem] bg-white p-8 text-brand-textMuted shadow-sm">Loading secure login...</div>}>
          <AuthForm mode="login" />
        </Suspense>
      </div>
    </main>
  );
}
