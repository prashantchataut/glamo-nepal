"use client";

import { RouteError } from "@/components/common/RouteError";

export default function RegisterError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteError title="Registration page needs a refresh" description="Something went wrong loading the registration form. Please try again." reset={reset} />;
}