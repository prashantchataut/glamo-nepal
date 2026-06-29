"use client";
// Client component required: uses browser-only interactivity, hooks, stores, or Next.js error-boundary reset.

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { useEffect } from "react";

export default function SegmentError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
  }, [error]);

  return (
    <main className="min-h-[70vh] bg-neutral-50 px-4 py-20">
      <div className="mx-auto max-w-xl rounded-[1.5rem] border border-brand-secondary/30 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <AlertTriangle size={30} strokeWidth={1.5} />
        </div>
        <p className="text-sm font-semibold text-neutral-500 text-secondary">GLAMO NEPAL</p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-neutral-900">This section needs a refresh</h1>
        <p className="mt-3 text-sm leading-relaxed text-neutral-500">Something interrupted this page. Try again or return to the storefront.</p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <button onClick={reset} className="rounded-full bg-primary px-7 py-3 font-semibold text-white hover:bg-neutral-950">Try again</button>
          <Link href="/" className="rounded-full border border-brand-primary px-7 py-3 font-semibold text-primary hover:bg-neutral-50">Back home</Link>
        </div>
      </div>
    </main>
  );
}
