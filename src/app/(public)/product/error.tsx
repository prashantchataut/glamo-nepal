"use client";

import { RouteError } from "@/components/common/RouteError";

export default function ProductDetailError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteError title="Product not found" description="We couldn't load this product. It may have been removed or the link may be incorrect." reset={reset} />;
}