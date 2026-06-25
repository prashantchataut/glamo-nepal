import { test, expect } from "@playwright/test";

/**
 * End-to-end coverage for the forgot-password response branching.
 *
 * Environment requirements:
 * - E2E_FORGOT_PASSWORD_ENABLED=1 must be set so the spec runs against a
 *   backend that exposes the accountExists flag on /auth/forgot-password.
 * - E2E_KNOWN_EMAIL should be set to a registered account for the success-path
 *   test; otherwise that test is skipped.
 */
test.skip(
  process.env.E2E_FORGOT_PASSWORD_ENABLED !== "1",
  "Requires E2E_FORGOT_PASSWORD_ENABLED=1 (backend must expose accountExists)"
);

test.describe("Forgot password branching", () => {
  test.use({ baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000" });

  test.beforeEach(async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(page.locator("#forgot-email")).toBeVisible({ timeout: 15000 });
  });

  test("registered email shows a check-your-inbox message", async ({ page }) => {
    const knownEmail = process.env.E2E_KNOWN_EMAIL;
    test.skip(!knownEmail, "Requires E2E_KNOWN_EMAIL env var");

    await page.locator("#forgot-email").fill(knownEmail!);
    await page.getByRole("button", { name: /send reset link/i }).click();

    const status = page.getByRole("status");
    await expect(status).toBeVisible({ timeout: 15000 });
    await expect(status).toHaveAttribute("aria-live", "polite");
    await expect(status).toContainText(/check your inbox/i);
  });

  test("unregistered email shows a no-account-found message", async ({ page }) => {
    await page.locator("#forgot-email").fill("not-a-real-user-12345@example.com");
    await page.getByRole("button", { name: /send reset link/i }).click();

    const status = page.getByRole("status");
    await expect(status).toBeVisible({ timeout: 15000 });
    await expect(status).toHaveAttribute("aria-live", "polite");
    await expect(status).toContainText(/no account found/i);
  });
});
