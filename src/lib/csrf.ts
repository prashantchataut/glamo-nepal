const CSRF_COOKIE_NAME = "glamo-csrf-token";

export function getCsrfToken(): string {
  if (typeof document === "undefined") return "";
  const cookies = document.cookie.split("; ");
  for (const row of cookies) {
    if (row.startsWith(`${CSRF_COOKIE_NAME}=`)) {
      return decodeURIComponent(row.split("=").slice(1).join("="));
    }
  }
  return "";
}

export function csrfHeaders(): Record<string, string> {
  const token = getCsrfToken();
  return token ? { "x-csrf-token": token } : {};
}