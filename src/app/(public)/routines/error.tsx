"use client";
import { RouteError } from "@/components/common/RouteError";

export default function RoutinesError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteError error={error} reset={reset} title="Routines unavailable" description="We could not load the routines. Please try again." />;
}