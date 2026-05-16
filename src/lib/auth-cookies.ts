export const CUSTOMER_SESSION_COOKIE = "glamo-customer-session";
const AUTH_TOKEN_KEY = CUSTOMER_SESSION_COOKIE;
const AUTH_ROLE_KEY = "glamo-user-role";
const AUTH_MAX_AGE = 604800;

export function setAuthCookies(email: string, role: string) {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${AUTH_TOKEN_KEY}=${encodeURIComponent(email)}; path=/; max-age=${AUTH_MAX_AGE}; SameSite=Lax${secure}`;
  document.cookie = `${AUTH_ROLE_KEY}=${encodeURIComponent(role)}; path=/; max-age=${AUTH_MAX_AGE}; SameSite=Lax${secure}`;
}

export function clearAuthCookies() {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${AUTH_TOKEN_KEY}=; path=/; max-age=0; SameSite=Lax${secure}`;
  document.cookie = `${AUTH_ROLE_KEY}=; path=/; max-age=0; SameSite=Lax${secure}`;
}

export function sanitizeRedirect(redirect: string | null): string {
  if (!redirect) return "/account";
  if (!redirect.startsWith("/")) return "/account";
  if (redirect.startsWith("//")) return "/account";
  return redirect;
}