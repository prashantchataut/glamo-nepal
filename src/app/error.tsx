"use client";

import { RouteError } from "@/components/common/RouteError";

export default function ErrorBoundary({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteError title="Something went wrong" description="An unexpected error occurred. Please try again." reset={reset} />;
}
