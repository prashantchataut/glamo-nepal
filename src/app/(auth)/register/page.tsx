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
    <main className="bg-[#fbf7f3] px-4 py-8 pb-24 md:px-6 md:py-12 md:pb-16">
      <div className="container mx-auto">
        <Suspense fallback={<div className="mx-auto max-w-5xl bg-white p-8 text-neutral-400">Loading registration...</div>}>
          <AuthForm mode="register" />
        </Suspense>
      </div>
    </main>
  );
}