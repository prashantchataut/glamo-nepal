const CSRF_COOKIE_NAME = "glamo-csrf-token";

export function getCsrfToken(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.split("; ").find((row) => row.startsWith(`${CSRF_COOKIE_NAME}=`));
  return match ? decodeURIComponent(match.split("=").slice(1).join("=")) : "";
}

export function csrfHeaders(): Record<string, string> {
  return { "x-csrf-token": getCsrfToken() };
}