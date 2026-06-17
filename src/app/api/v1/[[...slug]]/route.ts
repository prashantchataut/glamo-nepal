const API_BASE_URL = process.env.API_BASE_URL || "https://glamo-nepal-api.prashantchataut8.workers.dev/api/v1";

export const runtime = "edge";
export const dynamic = "force-dynamic";

async function proxyRequest(request: Request) {
  const url = new URL(request.url);
  const targetPath = url.pathname.replace(/^\/api\/v1/, "");
  const targetUrl = `${API_BASE_URL}${targetPath}${url.search}`;

  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.set("x-forwarded-for", request.headers.get("x-forwarded-for") || "unknown");
  headers.set("x-forwarded-host", url.host);
  headers.set("x-forwarded-proto", url.protocol.replace(":", ""));
  headers.set("x-request-id", crypto.randomUUID());

  const cookieHeader = request.headers.get("cookie");
  if (cookieHeader) {
    headers.set("cookie", cookieHeader);
  }

  try {
    const response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body: request.method !== "GET" && request.method !== "HEAD" ? request.body : undefined,
      redirect: "manual",
    });

    const responseHeaders = new Headers(response.headers);
    responseHeaders.delete("x-powered-by");
    responseHeaders.set("x-proxy-pass", "cloudflare-worker");

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, message: "Backend service unavailable. Please try again later." }),
      { status: 502, headers: { "content-type": "application/json" } }
    );
  }
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
export const OPTIONS = proxyRequest;