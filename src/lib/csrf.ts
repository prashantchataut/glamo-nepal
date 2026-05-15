const CSRF_COOKIE_NAME = "glamo-csrf-token";

export function getCsrfToken(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.split("; ").find((row) => row.startsWith(`${CSRF_COOKIE_NAME}=`));
  return match ? decodeURIComponent(match.split("=").slice(1).join("=")) : "";
}

export function csrfHeaders(): Record<string, string> {
  return { "x-csrf-token": getCsrfToken() };
}

export function ensureCsrfToken(): string {
  let token = getCsrfToken();
  if (!token) {
    token = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    document.cookie = `${CSRF_COOKIE_NAME}=${encodeURIComponent(token)}; path=/; max-age=${60 * 60 * 24}; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
  }
  return token;
}