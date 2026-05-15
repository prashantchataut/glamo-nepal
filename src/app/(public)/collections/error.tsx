"use client";
import { RouteError } from "@/components/common/RouteError";

export default function CollectionsError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteError error={error} reset={reset} title="Collections unavailable" description="We could not load the collections. Please try again." />;
}