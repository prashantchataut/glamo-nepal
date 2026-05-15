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

const LOGIN_ATTEMPTS_KEY = "glamo-login-attempts";
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

interface LoginAttempt {
  count: number;
  lockedUntil: number | null;
}

export function checkLoginRateLimit(): { allowed: boolean; remainingAttempts: number; lockedUntil: number | null } {
  if (typeof window === "undefined") return { allowed: true, remainingAttempts: MAX_LOGIN_ATTEMPTS, lockedUntil: null };
  try {
    const stored = localStorage.getItem(LOGIN_ATTEMPTS_KEY);
    if (!stored) return { allowed: true, remainingAttempts: MAX_LOGIN_ATTEMPTS, lockedUntil: null };
    const attempt: LoginAttempt = JSON.parse(stored);
    if (attempt.lockedUntil && Date.now() < attempt.lockedUntil) {
      return { allowed: false, remainingAttempts: 0, lockedUntil: attempt.lockedUntil };
    }
    if (attempt.lockedUntil && Date.now() >= attempt.lockedUntil) {
      localStorage.removeItem(LOGIN_ATTEMPTS_KEY);
      return { allowed: true, remainingAttempts: MAX_LOGIN_ATTEMPTS, lockedUntil: null };
    }
    return { allowed: true, remainingAttempts: MAX_LOGIN_ATTEMPTS - attempt.count, lockedUntil: null };
  } catch {
    return { allowed: true, remainingAttempts: MAX_LOGIN_ATTEMPTS, lockedUntil: null };
  }
}

export function recordLoginAttempt(success: boolean) {
  if (typeof window === "undefined") return;
  try {
    const stored = localStorage.getItem(LOGIN_ATTEMPTS_KEY);
    const current: LoginAttempt = stored ? JSON.parse(stored) : { count: 0, lockedUntil: null };
    if (success) {
      localStorage.removeItem(LOGIN_ATTEMPTS_KEY);
      return;
    }
    current.count += 1;
    if (current.count >= MAX_LOGIN_ATTEMPTS) {
      current.lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
    }
    localStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify(current));
  } catch {
    // Silently fail if localStorage is unavailable
  }
}