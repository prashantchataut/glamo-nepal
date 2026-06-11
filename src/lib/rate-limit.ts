// Rate limiting with Upstash Redis for production, in-memory fallback for development.
// In production (NODE_ENV=production), Redis is REQUIRED. Without it, all requests are denied.
// In development, in-memory rate limiting is used as a fallback.

const IS_PRODUCTION = process.env.NODE_ENV === "production";
const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

const RATE_LIMIT_MAP = new Map<string, { count: number; resetAt: number }>();

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  "/api/admin/login": { maxRequests: 5, windowMs: 15 * 60 * 1000 },
  "/api/contact": { maxRequests: 3, windowMs: 60 * 60 * 1000 },
  "/api/newsletter": { maxRequests: 3, windowMs: 60 * 60 * 1000 },
  "/api/checkout": { maxRequests: 10, windowMs: 15 * 60 * 1000 },
  "/api/orders/create": { maxRequests: 10, windowMs: 15 * 60 * 1000 },
};

const DEFAULT_LIMIT: RateLimitConfig = { maxRequests: 60, windowMs: 60 * 1000 };

function getKey(pathname: string, ip: string): string {
  const config = getConfig(pathname);
  const windowKey = Math.floor(Date.now() / config.windowMs);
  return `${pathname}:${ip}:${windowKey}`;
}

function getConfig(pathname: string): RateLimitConfig {
  for (const [prefix, config] of Object.entries(RATE_LIMITS)) {
    if (pathname === prefix || pathname.startsWith(prefix + "/")) return config;
  }
  return DEFAULT_LIMIT;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterMs: number;
}

export function checkRateLimit(pathname: string, ip: string): RateLimitResult {
  if (IS_PRODUCTION && (!UPSTASH_URL || !UPSTASH_TOKEN)) {
    console.error("[SECURITY] Production requires UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN for rate limiting. Denying request.");
    return { allowed: false, limit: 0, remaining: 0, resetAt: Date.now() + 60000, retryAfterMs: 60000 };
  }

  const config = getConfig(pathname);
  const key = getKey(pathname, ip);
  const now = Date.now();

  const entry = RATE_LIMIT_MAP.get(key);
  if (!entry || now >= entry.resetAt) {
    const resetAt = now + config.windowMs;
    RATE_LIMIT_MAP.set(key, { count: 1, resetAt });
    return { allowed: true, limit: config.maxRequests, remaining: config.maxRequests - 1, resetAt, retryAfterMs: 0 };
  }

  if (entry.count >= config.maxRequests) {
    return { allowed: false, limit: config.maxRequests, remaining: 0, resetAt: entry.resetAt, retryAfterMs: entry.resetAt - now };
  }

  entry.count += 1;
  return { allowed: true, limit: config.maxRequests, remaining: config.maxRequests - entry.count, resetAt: entry.resetAt, retryAfterMs: 0 };
}

if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    const keysToDelete: string[] = [];
    RATE_LIMIT_MAP.forEach((entry, key) => {
      if (now >= entry.resetAt) keysToDelete.push(key);
    });
    keysToDelete.forEach((key) => RATE_LIMIT_MAP.delete(key));
  }, 5 * 60 * 1000);
}