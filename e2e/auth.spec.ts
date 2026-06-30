import { test, expect } from "@playwright/test";

// Next.js always injects a live-region `<div role="alert" id="__next-route-announcer__">`
// for client-side route changes. Any page that renders its own `role="alert"` (e.g. form
// validation / Firebase error banners) therefore resolves to 2 elements and trips
// Playwright's strict mode. Scope to the app-owned alert only.
const appAlert = (page: import("@playwright/test").Page) =>
  page.getByRole("alert").exclude({ id: "__next-route-announcer__" });

test.describe("Login page", () => {
  test("loads without error boundary crash", async ({ page }) => {
    const response = await page.goto("/login");
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible({ timeout: 30000 });
    await expect(page.locator("#auth-email")).toBeVisible();
    await expect(page.locator("#auth-password")).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  test("shows validation errors for empty submission", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible({ timeout: 30000 });

    const submitButton = page.getByRole("button", { name: /sign in/i });
    await expect(submitButton).toBeDisabled();

    await page.locator("#auth-email").fill("test@example.com");
    await page.locator("#auth-password").fill("short");
    await expect(submitButton).toBeEnabled();
  });

  test("shows error for invalid credentials", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible({ timeout: 30000 });

    await page.locator("#auth-email").fill("nonexistent@test.com");
    await page.locator("#auth-password").fill("wrongpassword123");
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(appAlert(page)).toBeVisible({ timeout: 10000 });
  });

  test("has Google sign-in button", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible({ timeout: 30000 });

    await expect(page.getByRole("button", { name: /google/i })).toBeVisible();
  });

  test("has link to register page", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible({ timeout: 30000 });

    await expect(page.getByRole("link", { name: /create account/i })).toBeVisible();
  });

  test("has forgot password link", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible({ timeout: 30000 });

    await expect(page.getByRole("link", { name: /forgot password/i })).toBeVisible();
  });

  test("redirects to /account after successful login", async ({ page }) => {
    test.skip(!process.env.E2E_TEST_EMAIL, "Requires E2E_TEST_EMAIL and E2E_TEST_PASSWORD env vars");
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible({ timeout: 30000 });

    const email = process.env.E2E_TEST_EMAIL!;
    const password = process.env.E2E_TEST_PASSWORD!;

    await page.locator("#auth-email").fill(email);
    await page.locator("#auth-password").fill(password);
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page).toHaveURL(/\/account/, { timeout: 15000 });
  });

  test("redirects to ?redirect URL after login", async ({ page }) => {
    test.skip(!process.env.E2E_TEST_EMAIL, "Requires E2E_TEST_EMAIL and E2E_TEST_PASSWORD env vars");
    await page.goto("/login?redirect=/wishlist");
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible({ timeout: 30000 });

    const email = process.env.E2E_TEST_EMAIL!;
    const password = process.env.E2E_TEST_PASSWORD!;

    await page.locator("#auth-email").fill(email);
    await page.locator("#auth-password").fill(password);
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page).toHaveURL(/\/wishlist/, { timeout: 15000 });
  });
});

test.describe("Register page", () => {
  test("loads without error boundary crash", async ({ page }) => {
    const response = await page.goto("/register");
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { name: /create/i })).toBeVisible({ timeout: 30000 });
    await expect(page.locator("#auth-name")).toBeVisible();
    await expect(page.locator("#auth-email")).toBeVisible();
    await expect(page.locator("#auth-password")).toBeVisible();
  });

  test("has link to login page", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByRole("heading", { name: /create/i })).toBeVisible({ timeout: 30000 });

    await expect(page.getByText("Sign in instead")).toBeVisible();
  });

  test("shows name field on register form", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByRole("heading", { name: /create/i })).toBeVisible({ timeout: 30000 });

    const nameInput = page.locator("#auth-name");
    await expect(nameInput).toBeVisible();
  });

  test("shows error for duplicate email registration", async ({ page }) => {
    test.skip(!process.env.E2E_TEST_EMAIL, "Requires E2E_TEST_EMAIL and E2E_TEST_PASSWORD env vars");
    await page.goto("/register");
    await expect(page.getByRole("heading", { name: /create/i })).toBeVisible({ timeout: 30000 });

    const email = process.env.E2E_TEST_EMAIL!;

    await page.locator("#auth-name").fill("Test User");
    await page.locator("#auth-email").fill(email);
    await page.locator("#auth-password").fill("testpass123");
    await page.getByRole("button", { name: /create account/i }).click();

    await expect(appAlert(page)).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Auth SSR safety", () => {
  test("login page does not crash during server-side rendering", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible({ timeout: 30000 });

    const firebaseErrors = consoleErrors.filter(
      (e) => e.includes("firebase") || e.includes("Firebase") || e.includes("auth/")
    );
    expect(firebaseErrors).toHaveLength(0);
  });

  test("register page does not crash during server-side rendering", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    await page.goto("/register");
    await expect(page.getByRole("heading", { name: /create/i })).toBeVisible({ timeout: 30000 });

    const firebaseErrors = consoleErrors.filter(
      (e) => e.includes("firebase") || e.includes("Firebase") || e.includes("auth/")
    );
    expect(firebaseErrors).toHaveLength(0);
  });

  test("no error boundary visible on login page", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible({ timeout: 30000 });

    await expect(page.getByText(/this section needs a refresh/i)).not.toBeVisible();
    await expect(page.getByText(/something interrupted/i)).not.toBeVisible();
  });

  test("no error boundary visible on register page", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByRole("heading", { name: /create/i })).toBeVisible({ timeout: 30000 });

    await expect(page.getByText(/this section needs a refresh/i)).not.toBeVisible();
    await expect(page.getByText(/something interrupted/i)).not.toBeVisible();
  });
});