"use client";

import { RouteError } from "@/components/common/RouteError";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function TrackOrderError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteError title="Order tracking unavailable" description="We couldn't load your order details. Please try again." reset={reset} />;
}