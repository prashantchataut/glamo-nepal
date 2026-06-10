import { Suspense } from "react";
import { AuthForm } from "@/components/auth/AuthForm";
import { AuthFormSkeleton } from "@/components/common/SkeletonComponents";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Login",
  description: "Sign in to your GLAMO NEPAL account to view orders, wishlist, and saved addresses.",
  path: "/login",
  noIndex: true,
});

export default function LoginPage() {
  return (
    <main className="bg-neutral-100 px-4 py-8 pb-24 md:px-6 md:py-12 md:pb-16">
      <div className="container mx-auto">
        <Suspense fallback={<AuthFormSkeleton />}>
          <AuthForm mode="login" />
        </Suspense>
      </div>
    </main>
  );
}