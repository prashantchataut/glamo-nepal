import { Suspense } from "react";
import { createMetadata } from "@/lib/seo";
import { ResetPasswordClient } from "@/components/auth/ResetPasswordClient";
import { AuthFormSkeleton } from "@/components/common/SkeletonComponents";

export const metadata = createMetadata({
  title: "Reset Password",
  description: "Set a new password for your GLAMO NEPAL account.",
  path: "/reset-password",
  noIndex: true,
});

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<AuthFormSkeleton />}>
      <ResetPasswordClient />
    </Suspense>
  );
}