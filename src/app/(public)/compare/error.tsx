"use client";
// Client component required: uses browser-only interactivity, hooks, stores, or Next.js error-boundary reset.

import { RouteError } from "@/components/common/RouteError";

export default function ErrorBoundary({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteError title="This section needs a quick refresh" description="Something interrupted this page while loading." reset={reset} />;
}
