import { test, expect } from "@playwright/test";

test.describe("Account page", () => {
  test("redirects to login when not authenticated", async ({ page }) => {
    await page.goto("/account");
    await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
  });

  test("shows account page after login", async ({ page }) => {
    test.skip(!process.env.E2E_TEST_EMAIL, "Requires E2E_TEST_EMAIL and E2E_TEST_PASSWORD env vars");

    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible({ timeout: 30000 });

    await page.locator("#auth-email").fill(process.env.E2E_TEST_EMAIL!);
    await page.locator("#auth-password").fill(process.env.E2E_TEST_PASSWORD!);
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page).toHaveURL(/\/account/, { timeout: 15000 });
    await expect(page.getByRole("heading", { name: /account|profile|welcome/i })).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Forgot password page", () => {
  test("loads without error boundary crash", async ({ page }) => {
    const response = await page.goto("/forgot-password");
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { name: /reset your password/i })).toBeVisible({ timeout: 30000 });
  });

  test("has email input and submit button", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(page.getByRole("heading", { name: /reset your password/i })).toBeVisible({ timeout: 30000 });
    await expect(page.locator("#forgot-email")).toBeVisible();
    await expect(page.getByRole("button", { name: /send reset link/i })).toBeVisible();
  });

  test("has link back to login", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(page.getByRole("heading", { name: /reset your password/i })).toBeVisible({ timeout: 30000 });
    await expect(page.getByRole("link", { name: /back to sign in/i })).toBeVisible();
  });
});

test.describe("Reset password page", () => {
  test("shows password reset form without oobCode", async ({ page }) => {
    await page.goto("/reset-password");
    await expect(page.getByRole("heading", { name: /set new password/i })).toBeVisible({ timeout: 30000 });
  });
});

test.describe("Auth page rendering", () => {
  test("login page renders all form elements", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible({ timeout: 30000 });

    await expect(page.locator("#auth-email")).toBeVisible();
    await expect(page.locator("#auth-password")).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /google/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /forgot password/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /create account/i })).toBeVisible();
  });

  test("register page renders all form elements", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByRole("heading", { name: /create/i })).toBeVisible({ timeout: 30000 });

    await expect(page.locator("#auth-name")).toBeVisible();
    await expect(page.locator("#auth-email")).toBeVisible();
    await expect(page.locator("#auth-password")).toBeVisible();
    await expect(page.getByRole("button", { name: /create account/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /google/i })).toBeVisible();
    await expect(page.getByText(/sign in instead/i)).toBeVisible();
  });

  test("password visibility toggle works", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible({ timeout: 30000 });

    const passwordInput = page.locator("#auth-password");
    await expect(passwordInput).toHaveAttribute("type", "password");

    const toggleButton = page.locator("#auth-password").locator("..").locator("button");
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute("type", "text");

    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute("type", "password");
  });

  test("sign in button is disabled with empty fields", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible({ timeout: 30000 });

    await expect(page.getByRole("button", { name: /sign in/i })).toBeDisabled();

    await page.locator("#auth-email").fill("test@example.com");
    await expect(page.getByRole("button", { name: /sign in/i })).toBeDisabled();

    await page.locator("#auth-password").fill("123456");
    await expect(page.getByRole("button", { name: /sign in/i })).toBeEnabled();
  });
});