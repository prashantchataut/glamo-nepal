import "server-only";

/**
 * Cloudflare runtime context access — the single, correct entry point.
 *
 * On Cloudflare Workers (via OpenNext) the binding declared in wrangler.jsonc
 * (`API` → glamo-nepal-api) lets the frontend call the backend in-network
 * with no public-internet hop. On any other runtime (Vercel, Node, local dev
 * without `initOpenNextCloudflareForDev`) these return null/undefined and
 * callers fall back to an HTTP fetch against API_BASE_URL.
 *
 * IMPORTANT: we use the OFFICIAL getCloudflareContext() from
 * @opennextjs/cloudflare — NOT a raw Symbol read. A raw read of
 * Symbol.for("__cloudflare-context__") returns undefined silently during SSG
 * and throws during `next dev` unless initOpenNextCloudflareForDev() ran. The
 * official API (with the `async` option where needed) handles all of that.
 *
 * Reference: node_modules/@opennextjs/cloudflare/dist/api/cloudflare-context.js
 */

/** The service-binding shape we depend on. */
export interface WorkerBinding {
  fetch: (input: string | URL | Request, init?: RequestInit) => Promise<Response>;
}

/**
 * Name of the binding in wrangler.jsonc pointing at the backend worker.
 * Keep in sync with the `services[].binding` entry in wrangler.jsonc.
 */
export const API_WORKER_BINDING_NAME = "API";

function pickBinding(env: Record<string, unknown> | undefined): WorkerBinding | null {
  if (!env) return null;
  const binding = env[API_WORKER_BINDING_NAME] as WorkerBinding | undefined;
  return binding && typeof binding.fetch === "function" ? binding : null;
}

/**
 * SYNC access — use ONLY inside always-dynamic routes (the proxy). In
 * production the worker sets the global context before handling the request,
 * so the sync read always succeeds there. Returns undefined (never throws)
 * when off-Cloudflare so callers fall back to HTTP.
 */
export function getApiWorkerBinding(): WorkerBinding | undefined {
  try {
    // Dynamic require keeps this import out of the non-CF bundle path.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require("@opennextjs/cloudflare") as {
      getCloudflareContext: () => unknown;
    };
    const ctx = mod.getCloudflareContext() as
      | { env?: Record<string, unknown> }
      | null
      | undefined;
    return pickBinding(ctx?.env) ?? undefined;
  } catch {
    return undefined;
  }
}

/**
 * ASYNC access — use from SSR data fetchers (Server Components, SSG routes).
 * The async mode uses wrangler's platform proxy under the hood and is the only
 * safe option when a route may be statically generated.
 */
export async function backendBinding(): Promise<WorkerBinding | null> {
  try {
    const mod = (await import("@opennextjs/cloudflare")) as {
      getCloudflareContext: (opts?: { async?: boolean }) => Promise<unknown>;
    };
    const ctx = (await mod.getCloudflareContext({ async: true })) as
      | { env?: Record<string, unknown> }
      | null
      | undefined;
    return pickBinding(ctx?.env);
  } catch {
    return null;
  }
}
