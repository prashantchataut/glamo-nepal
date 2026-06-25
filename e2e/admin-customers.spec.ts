import { test, expect } from "@playwright/test";

/**
 * End-to-end coverage for the admin customers table.
 *
 * Asserts that every customer row visibly renders BOTH the customer name
 * (derived from first/last name or email handle as fallback) AND the email
 * address. The CustomersView component already structures this as a "Customer"
 * column with the name on top and email below, both with data-testids.
 *
 * Environment requirements:
 * - ADMIN_EMAIL and ADMIN_PASSWORD must be set in the test environment.
 */
test.describe("Admin customers table", () => {
  test.use({ baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000" });

  test("every customer row renders both name and email", async ({ page }) => {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    test.skip(!adminEmail || !adminPassword, "Requires ADMIN_EMAIL and ADMIN_PASSWORD env vars");

    // 1. Sign in.
    await page.goto("/admin/login");
    await expect(page.locator("#admin-email")).toBeVisible({ timeout: 15000 });
    await page.locator("#admin-email").fill(adminEmail!);
    await page.locator("#admin-password").fill(adminPassword!);
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/admin(\/.*)?$/, { timeout: 15000 });

    // 2. Navigate to the customers page.
    await page.goto("/admin/customers");

    // 3. Wait for the customers heading or empty state.
    await expect(
      page.getByRole("heading", { name: /^Customers$/i }).first(),
    ).toBeVisible({ timeout: 15000 });

    // 4. Wait for the table to render (caption is "Customer list").
    const table = page.getByRole("table", { name: "Customer list" });
    await expect(table).toBeVisible({ timeout: 15000 });

    // 5. Find all rows. Each row must contain BOTH a customer-name and
    //    customer-email testid with non-empty text matching an email format.
    const rows = table.locator("tbody tr");
    const rowCount = await rows.count();

    if (rowCount === 0) {
      await expect(page.getByText(/no customers found/i)).toBeVisible();
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    for (let i = 0; i < rowCount; i++) {
      const row = rows.nth(i);
      const nameCell = row.locator('[data-testid="customer-name"]');
      const emailCell = row.locator('[data-testid="customer-email"]');

      await expect(nameCell, `row ${i} customer-name should be visible`).toBeVisible();
      await expect(emailCell, `row ${i} customer-email should be visible`).toBeVisible();

      const nameText = (await nameCell.textContent())?.trim() ?? "";
      const emailText = (await emailCell.textContent())?.trim() ?? "";

      expect(nameText.length, `row ${i} customer-name should be non-empty`).toBeGreaterThan(0);
      expect(emailRegex.test(emailText), `row ${i} email should match email format (got "${emailText}")`).toBe(true);
    }
  });
});
