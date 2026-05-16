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
    <main className="bg-cream-100 py-10 md:py-16">
      <div className="container mx-auto px-4 md:px-6">
        <Suspense fallback={<div className="mx-auto max-w-5xl bg-cream-50 p-8 text-cream-400">Loading secure login...</div>}>
          <AuthForm mode="login" />
        </Suspense>
      </div>
    </main>
  );
}