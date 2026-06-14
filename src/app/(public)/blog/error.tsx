"use client";

import { RouteError } from "@/components/common/RouteError";

export default function BlogPostError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteError title="Article not found" description="We couldn't load this article. It may have been moved or the link may be incorrect." reset={reset} />;
}