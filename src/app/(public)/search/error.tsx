"use client";

import { RouteError } from "@/components/common/RouteError";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function SearchError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteError title="Search unavailable" description="Something went wrong with search. Please try again." reset={reset} />;
}