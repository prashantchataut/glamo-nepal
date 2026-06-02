"use client";
// Client component required: uses browser-only interactivity, hooks, stores, or Next.js error-boundary reset.

import Link from "next/link";
import { AlertTriangle, RefreshCcw, ShoppingBag } from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function RouteError({ title = "This GLAMO page needs a refresh", description = "Something interrupted this section. Try again or continue shopping.", reset, error: _error }: { title?: string; description?: string; reset?: () => void; error?: Error & { digest?: string } }) {
  return (
    <main className="min-h-[70vh] bg-brand-bgLight px-4 py-16">
      <div className="mx-auto max-w-3xl overflow-hidden rounded-[2.25rem] border border-brand-border bg-white text-center shadow-editorial">
        <div className="bg-[var(--gradient-editorial)] px-6 py-10 md:px-10 md:py-12">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-amber-700 shadow-sm ring-1 ring-brand-border"><AlertTriangle size={32} /></div>
          <p className="font-label mt-6 text-xs font-bold uppercase tracking-[0.24em] text-brand-primary">GLAMO recovery</p>
          <h1 className="mx-auto mt-3 max-w-2xl font-display text-4xl font-semibold leading-tight text-brand-textPrimary md:text-5xl">{title}</h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-brand-textMuted md:text-base">{description}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {reset ? <button onClick={reset} className="inline-flex items-center gap-2 rounded-full bg-brand-primary px-6 py-3 font-semibold text-white transition hover:bg-brand-primary-hover"><RefreshCcw size={17} /> Try again</button> : null}
            <Link href="/shop" className="inline-flex items-center gap-2 rounded-full border border-brand-primary/25 bg-white px-6 py-3 font-semibold text-brand-primary transition hover:bg-brand-primary-light"><ShoppingBag size={17} /> Back to shop</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
