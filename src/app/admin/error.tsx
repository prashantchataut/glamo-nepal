"use client";

import { AlertTriangle, RefreshCcw } from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-bgLight px-4">
      <div className="mx-auto max-w-md rounded-[2rem] border border-brand-border bg-white p-8 text-center shadow-soft">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-amber-700">
          <AlertTriangle size={32} />
        </div>
        <h2 className="mt-6 font-display text-2xl font-semibold text-brand-textPrimary">Something went wrong</h2>
        <p className="mt-3 text-sm text-brand-textMuted">
          The admin panel encountered an error. Please try again.
        </p>
        <button
          onClick={reset}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand-primary px-6 py-3 font-semibold text-white transition hover:bg-brand-primary-hover"
        >
          <RefreshCcw size={17} /> Try again
        </button>
      </div>
    </div>
  );
}