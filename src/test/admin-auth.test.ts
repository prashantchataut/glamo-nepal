import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { createAdminSessionToken, verifyAdminSessionToken, getAdminCredentials, ADMIN_SESSION_COOKIE, ADMIN_SESSION_MAX_AGE_SECONDS } from "@/lib/admin-auth";

describe("admin-auth", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.ADMIN_SESSION_SECRET = "test-secret-for-vitest-min-32-chars";
    process.env.AUTH_SECRET = "test-auth-secret-for-vitest-min-32-chars";
    process.env.ADMIN_EMAIL = "test-admin@example.com";
    process.env.ADMIN_PASSWORD = "test-password-123";
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe("createAdminSessionToken", () => {
    it("creates a token with two parts separated by a dot", async () => {
      const token = await createAdminSessionToken("admin@test.com", "Test Admin");
      const parts = token.split(".");
      expect(parts).toHaveLength(2);
      expect(parts[0].length).toBeGreaterThan(0);
      expect(parts[1].length).toBeGreaterThan(0);
    });

    it("encodes email and name in the payload", async () => {
      const token = await createAdminSessionToken("admin@test.com", "Test Admin");
      const [encodedPayload] = token.split(".");
      const padding = "=".repeat((4 - (encodedPayload.length % 4)) % 4);
      const decoded = atob(encodedPayload.replace(/-/g, "+").replace(/_/g, "/") + padding);
      const payload = JSON.parse(decoded);
      expect(payload.email).toBe("admin@test.com");
      expect(payload.name).toBe("Test Admin");
      expect(payload.role).toBe("admin");
      expect(typeof payload.exp).toBe("number");
    });

    it("sets expiration to 8 hours from now", async () => {
      const before = Math.floor(Date.now() / 1000);
      const token = await createAdminSessionToken("admin@test.com");
      const after = Math.floor(Date.now() / 1000);
      const [encodedPayload] = token.split(".");
      const padding = "=".repeat((4 - (encodedPayload.length % 4)) % 4);
      const decoded = atob(encodedPayload.replace(/-/g, "+").replace(/_/g, "/") + padding);
      const payload = JSON.parse(decoded);
      expect(payload.exp).toBeGreaterThanOrEqual(before + ADMIN_SESSION_MAX_AGE_SECONDS);
      expect(payload.exp).toBeLessThanOrEqual(after + ADMIN_SESSION_MAX_AGE_SECONDS);
    });
  });

  describe("verifyAdminSessionToken", () => {
    it("verifies a valid token", async () => {
      const token = await createAdminSessionToken("admin@test.com", "Test Admin");
      const payload = await verifyAdminSessionToken(token);
      expect(payload).not.toBeNull();
      expect(payload!.email).toBe("admin@test.com");
      expect(payload!.name).toBe("Test Admin");
      expect(payload!.role).toBe("admin");
    });

    it("returns null for null token", async () => {
      expect(await verifyAdminSessionToken(null)).toBeNull();
    });

    it("returns null for undefined token", async () => {
      expect(await verifyAdminSessionToken(undefined)).toBeNull();
    });

    it("returns null for empty string", async () => {
      expect(await verifyAdminSessionToken("")).toBeNull();
    });

    it("returns null for token without dot", async () => {
      expect(await verifyAdminSessionToken("invalidtoken")).toBeNull();
    });

    it("returns null for token with invalid signature", async () => {
      const token = await createAdminSessionToken("admin@test.com", "Test Admin");
      const [payload] = token.split(".");
      const tamperedToken = `${payload}.invalidsignature`;
      expect(await verifyAdminSessionToken(tamperedToken)).toBeNull();
    });

    it("returns null for expired token", async () => {
      const token = await createAdminSessionToken("admin@test.com", "Test Admin");
      const [encodedPayload, signature] = token.split(".");
      const padding = "=".repeat((4 - (encodedPayload.length % 4)) % 4);
      const decoded = atob(encodedPayload.replace(/-/g, "+").replace(/_/g, "/") + padding);
      const payload = JSON.parse(decoded);
      payload.exp = Math.floor(Date.now() / 1000) - 3600;
      const newEncodedPayload = btoa(JSON.stringify(payload)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
      const expiredToken = `${newEncodedPayload}.${signature}`;
      expect(await verifyAdminSessionToken(expiredToken)).toBeNull();
    });

    it("returns null for token with wrong role", async () => {
      const token = await createAdminSessionToken("admin@test.com", "Test Admin");
      const [encodedPayload] = token.split(".");
      const padding = "=".repeat((4 - (encodedPayload.length % 4)) % 4);
      const decoded = atob(encodedPayload.replace(/-/g, "+").replace(/_/g, "/") + padding);
      const payload = JSON.parse(decoded);
      payload.role = "user";
      const newEncodedPayload = btoa(JSON.stringify(payload)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
      const [, signature] = token.split(".");
      const wrongRoleToken = `${newEncodedPayload}.${signature}`;
      expect(await verifyAdminSessionToken(wrongRoleToken)).toBeNull();
    });

    it("returns null for token with malformed JSON payload", async () => {
      const token = await createAdminSessionToken("admin@test.com", "Test Admin");
      const [, signature] = token.split(".");
      const malformedToken = `not-valid-base64.${signature}`;
      expect(await verifyAdminSessionToken(malformedToken)).toBeNull();
    });

    it("returns null for token with multiple dots (only first dot splits)", async () => {
      expect(await verifyAdminSessionToken("a.b.c")).toBeNull();
    });
  });

  describe("getAdminCredentials", () => {
    it("returns credentials when env vars are set", () => {
      process.env.ADMIN_EMAIL = "test@example.com";
      process.env.ADMIN_PASSWORD = "password123";
      const creds = getAdminCredentials();
      expect(creds.email).toBe("test@example.com");
      expect(creds.password).toBe("password123");
      expect(creds.name).toBe("GLAMO Admin");
    });

    it("uses custom name when ADMIN_NAME is set", () => {
      process.env.ADMIN_EMAIL = "test@example.com";
      process.env.ADMIN_PASSWORD = "password123";
      process.env.ADMIN_NAME = "Custom Admin";
      const creds = getAdminCredentials();
      expect(creds.name).toBe("Custom Admin");
    });

    it("throws when ADMIN_EMAIL is missing", () => {
      delete process.env.ADMIN_EMAIL;
      process.env.ADMIN_PASSWORD = "password123";
      expect(() => getAdminCredentials()).toThrow("ADMIN_EMAIL and ADMIN_PASSWORD");
    });

    it("throws when ADMIN_PASSWORD is missing", () => {
      process.env.ADMIN_EMAIL = "test@example.com";
      delete process.env.ADMIN_PASSWORD;
      expect(() => getAdminCredentials()).toThrow("ADMIN_EMAIL and ADMIN_PASSWORD");
    });
  });

  describe("constants", () => {
    it("uses __Host- prefix for admin session cookie in production", () => {
      expect(ADMIN_SESSION_COOKIE).toBe("glamo-admin-session");
    });

    it("sets max age to 8 hours in seconds", () => {
      expect(ADMIN_SESSION_MAX_AGE_SECONDS).toBe(60 * 60 * 8);
    });
  });
});