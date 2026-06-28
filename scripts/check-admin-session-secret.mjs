#!/usr/bin/env node
/**
 * Deploy-time smoke test for the admin session secret bridge.
 *
 * Root cause this guards against: the Next.js (Vercel) frontend signs the
 * `glamo-admin-session` cookie with ADMIN_SESSION_SECRET, and the Cloudflare
 * Worker backend verifies it with its own ADMIN_SESSION_SECRET. If those two
 * secrets drift (one unset, rotated on only one side, typo), every admin
 * endpoint returns 401 and the entire admin panel shows "Failed to load X"
 * — with zero indication that the cause is a secret mismatch, not a code bug.
 *
 * This script signs a probe cookie with the local ADMIN_SESSION_SECRET and
 * hits the backend's /api/v1/admin/me through the configured frontend origin.
 * A 200 means the secret matches end-to-end. A 401 means the Worker's secret
 * differs — fail the deploy loudly.
 *
 * Usage:
 *   node scripts/check-admin-session-secret.mjs
 *
 * Env:
 *   ADMIN_SESSION_SECRET  (or AUTH_SECRET) — local signing secret, required
 *   ADMIN_SMOKE_ORIGIN    — frontend origin to probe, e.g. https://www.glamonepal.com
 *                           (defaults to NEXT_PUBLIC_SITE_URL)
 *
 * Exit codes: 0 = secrets aligned, 1 = mismatch or misconfigured.
 */
import crypto from "node:crypto";
import process from "node:process";

function bytesToBase64Url(bytes) {
  return Buffer.from(bytes).toString("base64").replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

async function hmacSha256(value, secret) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return bytesToBase64Url(new Uint8Array(sig));
}

async function createAdminSessionToken(email, name, secret) {
  const payload = {
    email,
    name,
    role: "admin",
    exp: Math.floor(Date.now() / 1000) + 60,
    jti: crypto.randomUUID(),
  };
  const encoded = bytesToBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const signature = await hmacSha256(encoded, secret);
  return `${encoded}.${signature}`;
}

async function main() {
  const secret = process.env.ADMIN_SESSION_SECRET || process.env.AUTH_SECRET;
  if (!secret) {
    console.error("✗ ADMIN_SESSION_SECRET (or AUTH_SECRET) is not set in this environment.");
    console.error("  The frontend cannot sign admin cookies without it. Set it in Vercel production env.");
    process.exit(1);
  }

  const origin = process.env.ADMIN_SMOKE_ORIGIN || process.env.NEXT_PUBLIC_SITE_URL;
  if (!origin) {
    console.error("✗ ADMIN_SMOKE_ORIGIN (or NEXT_PUBLIC_SITE_URL) is not set.");
    console.error("  Provide the deployed frontend origin, e.g. https://www.glamonepal.com");
    process.exit(1);
  }

  const probeEmail = "admin-smoke-test@glamonepal.com";
  const token = await createAdminSessionToken(probeEmail, "Smoke Test", secret);
  const url = `${origin.replace(/\/$/, "")}/api/v1/admin/me`;

  let res;
  try {
    res = await fetch(url, {
      headers: { cookie: `glamo-admin-session=${token}` },
      redirect: "manual",
    });
  } catch (err) {
    console.error(`✗ Could not reach ${url}: ${err instanceof Error ? err.message : String(err)}`);
    console.error("  Is the frontend deployed and the proxy healthy?");
    process.exit(1);
  }

  // Accept any 2xx as success — /admin/me returns 200 with the admin profile.
  if (res.status >= 200 && res.status < 300) {
    console.log(`✓ Admin session secret is aligned end-to-end (${origin} → backend verified the probe cookie).`);
    process.exit(0);
  }

  // 401 from this probe is the smoking gun: the cookie was signed correctly
  // with OUR secret, but the backend rejected it → the backend's secret differs.
  if (res.status === 401) {
    console.error("✗ ADMIN SESSION SECRET MISMATCH DETECTED.");
    console.error("");
    console.error("  The frontend signed a valid probe cookie, but the backend rejected it (401).");
    console.error("  This is why the admin panel shows 'Failed to load X' on every section.");
    console.error("");
    console.error("  Fix: set the SAME ADMIN_SESSION_SECRET on BOTH sides:");
    console.error("    cd backend && npx wrangler secret put ADMIN_SESSION_SECRET");
    console.error("    npx wrangler secret put ADMIN_SESSION_SECRET");
    console.error("  Then redeploy both and re-login at /admin/login.");
    process.exit(1);
  }

  console.error(`✗ Unexpected status ${res.status} from ${url}.`);
  try {
    const body = await res.text();
    console.error(`  Body: ${body.slice(0, 300)}`);
  } catch {}
  process.exit(1);
}

main().catch((err) => {
  console.error("Smoke test crashed:", err);
  process.exit(1);
});
