import { Suspense } from "react";
import { AuthForm } from "@/components/auth/AuthForm";
import { AuthFormSkeleton } from "@/components/common/SkeletonComponents";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Register",
  description: "Create a GLAMO NEPAL customer account for orders, wishlist, addresses and beauty rewards.",
  path: "/register",
  noIndex: true,
});

export default function RegisterPage() {
  return (
    <main className="bg-brand-surfaceWarm px-4 py-8 pb-24 md:px-6 md:py-12 md:pb-16">
      <div className="container mx-auto">
        <Suspense fallback={<AuthFormSkeleton />}>
          <AuthForm mode="register" />
        </Suspense>
      </div>
    </main>
  );
}