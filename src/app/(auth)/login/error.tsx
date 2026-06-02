"use client";

import { RouteError } from "@/components/common/RouteError";

export default function LoginError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteError title="Login page needs a refresh" description="Something went wrong loading the login form. Please try again." reset={reset} />;
}