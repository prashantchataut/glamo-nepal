import { Suspense } from "react";
import { AuthForm } from "@/components/auth/AuthForm";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Register",
  description: "Create a GLAMO NEPAL customer account for orders, wishlist, addresses and beauty rewards.",
  path: "/register",
  noIndex: true,
});

export default function RegisterPage() {
  return (
    <main className="bg-cream-100 py-10 md:py-16">
      <div className="container mx-auto px-4 md:px-6">
        <Suspense fallback={<div className="mx-auto max-w-5xl bg-cream-50 p-8 text-cream-400">Loading registration...</div>}>
          <AuthForm mode="register" />
        </Suspense>
      </div>
    </main>
  );
}