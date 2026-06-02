"use client";

import { RouteError } from "@/components/common/RouteError";

export default function ForgotPasswordError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteError title="Password reset needs a refresh" description="Something went wrong loading the password reset form. Please try again." reset={reset} />;
}