import "server-only";
import { backendFetch } from "@/lib/server/backend";

const FORWARDED_HEADERS = ["cookie", "x-csrf-token", "x-forwarded-for", "x-real-ip", "authorization", "x-idempotency-key"] as const;

/**
 * Dispatch a POST to the backend over HTTP (service binding on Cloudflare,
 * absolute URL elsewhere). Previously invoked the Hono app in-process; that
 * coupled the backend into the frontend bundle and broke the OpenNext build.
 */
export async function dispatchApiRequest(path: string, request: Request, body: unknown): Promise<Response> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  for (const name of FORWARDED_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers[name] = value;
  }
  return backendFetch(path, { method: "POST", headers, body: JSON.stringify(body), forwardFrom: request });
}
