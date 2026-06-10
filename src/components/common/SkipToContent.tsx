export function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="sr-only z-skip-link rounded-full bg-neutral-950 px-5 py-3 font-semibold text-white shadow-xl focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:outline-none focus:ring-2 focus:ring-secondary"
    >
      Skip to main content
    </a>
  );
}
