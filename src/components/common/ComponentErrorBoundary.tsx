"use client";
import { Component, type ReactNode, type ErrorInfo } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  name?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  /** True when the failure looks like a failed lazy-chunk load (stale build). */
  isChunkLoadFailure: boolean;
  /** Bumped each time the user clicks "Try again" so we can force a re-mount. */
  retryToken: number;
}

/**
 * Detect the error shape Next.js / webpack throws when a lazy-loaded chunk
 * can't be fetched. This is by far the most common cause of the admin panel's
 * generic "Something went wrong loading this section" message: it happens when
 * a new deploy left the browser holding references to JS chunks that no longer
 * exist on the server (or whose hashes changed mid-session). The fix for that
 * case is a hard reload - NOT a component retry - so we detect it explicitly
 * and offer the right action.
 */
function isChunkLoadError(error: Error): boolean {
  const m = (error.message || "").toLowerCase();
  return (
    m.includes("loading chunk") ||
    m.includes("loading css chunk") ||
    m.includes("failed to fetch dynamically imported module") ||
    m.includes("importing a module script failed") ||
    m.includes("chunkloaderror") ||
    error.name === "ChunkLoadError"
  );
}

export class ComponentErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, isChunkLoadFailure: false, retryToken: 0 };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      isChunkLoadFailure: isChunkLoadError(error),
      // Don't reset retryToken here - incrementing it on retry (below) is what
      // forces the children to re-mount with a fresh lazy-import attempt.
      retryToken: 0,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const label = this.props.name ? `:${this.props.name}` : "";
    console.error(`[ErrorBoundary${label}]`, error, errorInfo);

    if (typeof window !== "undefined" && typeof fetch === "function") {
      const endpoint = "/api/error-report";
      fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          boundary: this.props.name || "unknown",
          url: window.location.href,
          timestamp: new Date().toISOString(),
          isChunkLoadFailure: isChunkLoadError(error),
        }),
      }).catch((err) => console.error("[ErrorBoundary] Failed to report error:", err));
    }
  }

  handleRetry = () => {
    // Soft retry: clear the error and bump the token so children re-mount.
    this.setState((prev) => ({ hasError: false, error: null, isChunkLoadFailure: false, retryToken: prev.retryToken + 1 }));
  };

  handleHardReload = () => {
    if (typeof window === "undefined") return;
    // Bust cached chunks on reload by appending a cache-defeating query. A plain
    // reload can re-serve the stale chunks from the HTTP cache; this forces the
    // browser to re-fetch the current build's assets.
    const url = new URL(window.location.href);
    url.searchParams.set("__refresh", String(Date.now()));
    window.location.href = url.toString();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      const { error, isChunkLoadFailure } = this.state;
      const sectionLabel = this.props.name ? `“${this.props.name}”` : "this section";

      return (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center" role="alert">
          <p className="text-sm font-semibold text-red-800">
            {isChunkLoadFailure
              ? `We updated the dashboard - please reload to see ${sectionLabel}.`
              : `Something went wrong loading ${sectionLabel}.`}
          </p>
          {/* Show the actual cause. This turns a black-box error into something
              actionable: the developer (and the support thread) can read exactly
              what failed instead of guessing from "Something went wrong". */}
          {error?.message ? (
            <p className="mx-auto mt-2 max-w-md break-words rounded-md bg-white/60 px-3 py-1.5 font-mono text-[11px] text-red-700">
              {error.message}
            </p>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {isChunkLoadFailure ? (
              <button
                onClick={this.handleHardReload}
                className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                Reload page
              </button>
            ) : (
              <>
                <button
                  onClick={this.handleRetry}
                  className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
                >
                  Try again
                </button>
                <button
                  onClick={this.handleHardReload}
                  className="rounded-full border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50"
                >
                  Reload page
                </button>
              </>
            )}
          </div>
        </div>
      );
    }

    // key on retryToken so a soft retry fully re-mounts children (and thus
    // re-attempts the lazy import), instead of reconciling the failed tree.
    return <div key={this.state.retryToken}>{this.props.children}</div>;
  }
}
