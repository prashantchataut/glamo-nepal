"use client";

export default function VerifyEmailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="bg-neutral-100 py-10 md:py-16">
      <div className="container mx-auto max-w-md px-4 md:px-6 text-center">
        <h1 className="font-display text-3xl font-semibold text-neutral-900">Something went wrong</h1>
        <p className="mt-4 text-neutral-500">{error.message || "An error occurred during email verification."}</p>
        <button
          onClick={reset}
          className="mt-6 rounded-full bg-primary px-6 py-3 text-[13px] font-medium uppercase tracking-[0.1em] text-neutral-50 transition-colors hover:bg-primary-dark"
        >
          Try again
        </button>
      </div>
    </main>
  );
}