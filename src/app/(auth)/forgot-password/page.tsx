import { Suspense } from "react";
import { createMetadata } from "@/lib/seo";
import { ForgotPasswordClient } from "@/components/auth/ForgotPasswordClient";

export const metadata = createMetadata({
  title: "Forgot Password",
  description: "Reset your GLAMO NEPAL account password.",
  path: "/forgot-password",
  noIndex: true,
});

export default function ForgotPasswordPage() {
  return (
    <Suspense>
      <ForgotPasswordClient />
    </Suspense>
  );
}