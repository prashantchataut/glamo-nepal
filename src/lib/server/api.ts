import app from "../../../backend/src/index";

const FORWARDED_HEADERS = ["cookie", "x-csrf-token", "x-forwarded-for", "x-real-ip", "authorization", "x-idempotency-key"] as const;

export async function dispatchApiRequest(path: string, request: Request, body: unknown): Promise<Response> {
  const headers = new Headers({ "Content-Type": "application/json" });
  for (const name of FORWARDED_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  return app.request(path, { method: "POST", headers, body: JSON.stringify(body) });
}