import { Suspense } from "react";
import { createMetadata } from "@/lib/seo";
import { VerifyEmailClient } from "@/components/auth/VerifyEmailClient";
import { AuthFormSkeleton } from "@/components/common/SkeletonComponents";

export const metadata = createMetadata({
  title: "Verify Email",
  description: "Verify your GLAMO NEPAL account email address.",
  path: "/verify-email",
  noIndex: true,
});

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<AuthFormSkeleton />}>
      <VerifyEmailClient />
    </Suspense>
  );
}