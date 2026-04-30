"use client";

import Link from "next/link";
import { AlertTriangle, RefreshCcw } from "lucide-react";

export function RouteError({ title = "Something went wrong", description = "We could not load this GLAMO section. Please try again or return to the shop.", reset }: { title?: string; description?: string; reset?: () => void }) {
  return (
    <main className="bg-brand-bgLight py-16">
      <div className="container mx-auto max-w-2xl px-4 text-center md:px-6">
        <div className="rounded-[2rem] border border-amber-200 bg-white p-8 shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-amber-700">
            <AlertTriangle size={30} />
          </div>
          <p className="mt-5 text-xs font-bold uppercase tracking-[0.22em] text-brand-gold">GLAMO recovery</p>
          <h1 className="mt-3 font-serif text-4xl font-semibold text-brand-textPrimary">{title}</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-brand-textMuted">{description}</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            {reset ? <button onClick={reset} className="inline-flex items-center gap-2 rounded-full bg-brand-primary px-6 py-3 font-semibold text-white transition hover:bg-brand-bgDark"><RefreshCcw size={17} /> Try again</button> : null}
            <Link href="/shop" className="rounded-full border border-brand-primary px-6 py-3 font-semibold text-brand-primary transition hover:bg-brand-primary hover:text-white">Back to shop</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
