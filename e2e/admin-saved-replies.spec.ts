import { test, expect } from "@playwright/test";

/**
 * End-to-end coverage for the saved-reply editor on /admin/support.
 *
 * Flow:
 *   1. Sign in as admin.
 *   2. Navigate to /admin/support.
 *   3. Find the first saved reply, click "Edit".
 *   4. Change the body text, click "Save".
 *   5. Reload the page.
 *   6. Assert the new body text is rendered (persisted via API).
 *
 * Environment requirements:
 *   - ADMIN_EMAIL and ADMIN_PASSWORD must be set in the test environment.
 *   - The backend must expose at least one saved reply under the
 *     `support_response_templates` setting (created via /admin/settings).
 *
 * Gate: gated by ADMIN_EMAIL + ADMIN_PASSWORD; skipped if no saved replies exist.
 */
test.describe("Admin saved replies editing", () => {
  test.use({ baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000" });

  test("edit a saved reply, save, reload, see persisted change", async ({ page }) => {
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

    // 2. Navigate to support desk.
    await page.goto("/admin/support");
    await expect(page.getByRole("heading", { name: /customer support desk/i })).toBeVisible({ timeout: 15000 });

    // 3. Find the saved replies list and at least one item.
    const list = page.getByTestId("saved-replies-list");
    await expect(list).toBeVisible({ timeout: 15000 });

    const items = list.getByTestId("saved-reply-item");
    const itemCount = await items.count();

    test.skip(itemCount === 0, "No saved replies configured; create at least one in /admin/settings to run this spec.");

    const firstItem = items.first();
    const originalTitle = (await firstItem.getByTestId("saved-reply-title").textContent())?.trim() ?? "";
    const originalBody = (await firstItem.getByTestId("saved-reply-body").textContent())?.trim() ?? "";

    // 4. Click Edit on the first item.
    await firstItem.getByTestId("saved-reply-edit").click();

    // 5. Modify the body text.
    const titleInput = firstItem.getByTestId("saved-reply-title-input");
    const bodyInput = firstItem.getByTestId("saved-reply-body-input");
    await expect(titleInput).toBeVisible();
    await expect(bodyInput).toBeVisible();

    const uniqueMarker = `[edited ${Date.now()}]`;
    const newBody = originalBody
      ? `${originalBody}\n\nUpdated via support desk editor — ${uniqueMarker}`
      : `Reply created via support desk editor — ${uniqueMarker}`;
    await bodyInput.fill(newBody);

    // 6. Save and wait for the success state.
    await firstItem.getByTestId("saved-reply-save").click();

    // Wait until the read-only view returns with the new body text.
    const updatedBodyLocator = firstItem.getByTestId("saved-reply-body");
    await expect(updatedBodyLocator).toContainText(uniqueMarker, { timeout: 15000 });
    await expect(updatedBodyLocator).toContainText(uniqueMarker);

    // 7. Reload the page and confirm persistence.
    await page.reload();
    await expect(page.getByRole("heading", { name: /customer support desk/i })).toBeVisible({ timeout: 15000 });

    const listAfterReload = page.getByTestId("saved-replies-list");
    await expect(listAfterReload).toBeVisible({ timeout: 15000 });

    // Match by original title to find the same saved reply after reload.
    const reloadedItems = listAfterReload.getByTestId("saved-reply-item");
    const reloadedCount = await reloadedItems.count();
    expect(reloadedCount).toBe(itemCount);

    const reloadedItem = reloadedItems.filter({
      has: page.getByTestId("saved-reply-title").filter({ hasText: originalTitle }),
    }).first();

    await expect(reloadedItem).toBeVisible({ timeout: 15000 });
    await expect(reloadedItem.getByTestId("saved-reply-body")).toContainText(uniqueMarker, { timeout: 15000 });
  });
});
