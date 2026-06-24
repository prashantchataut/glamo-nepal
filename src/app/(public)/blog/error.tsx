"use client";
// Client component required: Next.js error boundaries receive reset() and run after render failures.

import { RouteError } from "@/components/common/RouteError";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteError error={error} reset={reset} />;
}
