"use client";

import { RouteError } from "@/components/common/RouteError";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteError title="GLAMO needs a refresh" description="A storefront-level error happened. Please try again." reset={reset} />;
}
