const CSRF_COOKIE_NAME = "glamo-csrf-token";
const CSRF_HEADER_NAME = "x-csrf-token";

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
  return token ? { [CSRF_HEADER_NAME]: token } : {};
}

export function validateCsrf(request: Request): { valid: boolean; reason?: string } {
  if (request.method !== "POST" && request.method !== "PUT" && request.method !== "PATCH" && request.method !== "DELETE") {
    return { valid: true };
  }

  const cookieHeader = request.headers.get("cookie") || "";
  let cookieToken = "";
  for (const pair of cookieHeader.split(";")) {
    const trimmed = pair.trim();
    if (trimmed.startsWith(`${CSRF_COOKIE_NAME}=`)) {
      cookieToken = decodeURIComponent(trimmed.slice(CSRF_COOKIE_NAME.length + 1));
      break;
    }
  }

  const headerToken = request.headers.get(CSRF_HEADER_NAME);

  if (!cookieToken && !headerToken) {
    return { valid: false, reason: "CSRF token missing. Please refresh the page and try again." };
  }

  if (!cookieToken) {
    return { valid: false, reason: "Missing CSRF cookie. Please refresh the page and try again." };
  }

  if (!headerToken) {
    return { valid: false, reason: "Missing CSRF token header. Please refresh the page and try again." };
  }

  if (cookieToken !== headerToken) {
    return { valid: false, reason: "CSRF token mismatch. Please refresh the page and try again." };
  }

  if (cookieToken.length < 32) {
    return { valid: false, reason: "Invalid CSRF token." };
  }

  return { valid: true };
}