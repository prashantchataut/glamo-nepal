import { test, expect } from "@playwright/test";

/**
 * End-to-end coverage for the admin login flow and product list.
 *
 * Environment requirements:
 * - ADMIN_EMAIL and ADMIN_PASSWORD must be set in the test environment
 *   (e.g. in .env.local or exported before running Playwright). The local
 *   dev server also needs these values to authenticate the login request.
 */
test.describe("Admin login and products", () => {
  test.use({ baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000" });

  test("logs in via /admin/login and renders the product list", async ({ page }) => {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    test.skip(!adminEmail || !adminPassword, "Requires ADMIN_EMAIL and ADMIN_PASSWORD env vars");

    // 1. Load the admin login page.
    await page.goto("/admin/login");

    // 2. Fill credentials and submit.
    await expect(page.locator("#admin-email")).toBeVisible({ timeout: 15000 });
    await page.locator("#admin-email").fill(adminEmail!);
    await page.locator("#admin-password").fill(adminPassword!);
    await page.getByRole("button", { name: /sign in/i }).click();

    // 3. Wait for navigation to the admin area.
    await expect(page).toHaveURL(/\/admin(\/products)?/, { timeout: 15000 });

    // 4. Ensure /admin/products is loaded.
    if (!page.url().includes("/admin/products")) {
      await page.goto("/admin/products");
    }

    // 5. Assert the login error boundary did not render.
    await expect(page.getByText("Unable to load login form")).not.toBeVisible();

    // 6. Assert the generic error boundary did not render on the products page.
    await expect(page.getByText("Something went wrong")).not.toBeVisible();

    // 7. Assert the product catalog loaded with at least one product card.
    //    ProductsView renders each product with aria-label="Edit product" buttons;
    //    counting those is a reliable per-product cardinality signal without
    //    coupling to the underlying grid/table markup.
    await expect(page.getByRole("heading", { name: "Product management" })).toBeVisible({ timeout: 15000 });
    const editProductButtons = page.getByRole("button", { name: "Edit product" });
    await expect(editProductButtons.first()).toBeVisible({ timeout: 15000 });
    expect(await editProductButtons.count()).toBeGreaterThan(0);
  });
});
