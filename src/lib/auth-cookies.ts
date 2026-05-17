const AUTH_TOKEN_KEY = "glamo-auth-token";
const AUTH_ROLE_KEY = "glamo-user-role";
const AUTH_MAX_AGE = 604800;

export function setAuthCookies(email: string, role: string) {
  document.cookie = `${AUTH_TOKEN_KEY}=authenticated; path=/; max-age=${AUTH_MAX_AGE}; SameSite=Lax; Secure`;
  document.cookie = `${AUTH_ROLE_KEY}=${encodeURIComponent(role)}; path=/; max-age=${AUTH_MAX_AGE}; SameSite=Lax; Secure`;
}

export function clearAuthCookies() {
  document.cookie = `${AUTH_TOKEN_KEY}=; path=/; max-age=0; SameSite=Lax; Secure`;
  document.cookie = `${AUTH_ROLE_KEY}=; path=/; max-age=0; SameSite=Lax; Secure`;
}

export function sanitizeRedirect(redirect: string | null): string {
  if (!redirect) return "/account";
  if (!redirect.startsWith("/")) return "/account";
  if (redirect.startsWith("//")) return "/account";
  return redirect;
}