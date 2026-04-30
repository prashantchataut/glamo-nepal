"use client";

import { RouteError } from "@/components/common/RouteError";

export default function ErrorBoundary({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteError title="Unable to load this GLAMO section" description="This section could not load correctly." reset={reset} />;
}
