"use client";

import { RouteError } from "@/components/common/RouteError";

export default function BrandError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteError title="Brands unavailable" description="We couldn't load our brands list. Please try again." reset={reset} />;
}