"use client";

import { RouteError } from "@/components/common/RouteError";

export default function ErrorBoundary({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteError title="This product page needs a quick refresh" description="Something interrupted this page while loading." reset={reset} />;
}
