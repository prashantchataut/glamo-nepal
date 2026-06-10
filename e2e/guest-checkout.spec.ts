import { test, expect } from "@playwright/test";

test.describe("Guest Checkout Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Go to shop page first
    await page.goto("/shop");
    // Wait for products to load
    await page.waitForLoadState("networkidle");
  });

  test("shows auth choice when not logged in", async ({ page }) => {
    await page.goto("/checkout");
    await expect(page.getByRole("heading", { name: "Almost there" })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("button", { name: "Log in" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Continue as guest" })).toBeVisible();
  });

  test("guest checkout flow — add product, continue as guest, fill form", async ({ page }) => {
    // Step 1: Add a product to cart from shop page
    const addToCartButtons = page.getByRole("button", { name: /add to bag/i });
    const firstAddButton = addToCartButtons.first();
    await firstAddButton.waitFor({ state: "visible", timeout: 10000 });
    await firstAddButton.click();

    // Wait for cart to update
    await page.waitForTimeout(1000);

    // Step 2: Go to cart
    await page.getByRole("link", { name: /cart/i }).first().click();
    await expect(page).toHaveURL(/\/cart/);

    // Step 3: Proceed to checkout
    await page.getByRole("link", { name: /secure checkout/i }).click();
    await expect(page).toHaveURL(/\/checkout/);

    // Step 4: Should see auth choice screen
    await expect(page.getByRole("heading", { name: "Almost there" })).toBeVisible({ timeout: 10000 });

    // Step 5: Click "Continue as guest"
    await page.getByRole("button", { name: "Continue as guest" }).click();

    // Step 6: Should now see the checkout form
    await expect(page.getByRole("heading", { name: /contact & shipping/i })).toBeVisible({ timeout: 10000 });

    // Step 7: Fill out the form
    await page.getByLabel("Full name").fill("Guest User");
    await page.getByLabel("Phone number").fill("9800000000");
    await page.getByLabel("Email").fill("guest@example.com");

    // Select province (default is Bagmati which is fine)
    await page.getByLabel("Street address").fill("House 123, Thamel");

    // Ward
    await page.getByLabel("Ward").fill("3");

    // Step 8: Validate the address step — click "Continue to delivery"
    await page.getByRole("button", { name: /continue to delivery/i }).click();

    // Step 9: Should be on delivery step
    await expect(page.getByRole("button", { name: /continue to payment/i })).toBeVisible({ timeout: 5000 });

    // Step 10: Continue to payment
    await page.getByRole("button", { name: /continue to payment/i }).click();

    // Step 11: Should be on payment step
    await expect(page.getByText("Payment method")).toBeVisible({ timeout: 5000 });

    // Step 12: Continue to review
    await page.getByRole("button", { name: /review order/i }).click();

    // Step 13: Should be on review step
    await expect(page.getByText("Review order")).toBeVisible({ timeout: 5000 });

    // Step 14: Verify form data is displayed in review
    await expect(page.getByText("Guest User")).toBeVisible();
    await expect(page.getByText("9800000000")).toBeVisible();
  });

  test("redirects to login when clicking Log in on auth choice", async ({ page }) => {
    await page.goto("/checkout");
    await expect(page.getByRole("heading", { name: "Almost there" })).toBeVisible({ timeout: 10000 });

    await page.getByRole("link", { name: "Log in" }).click();
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });

  test("cart page remains accessible without auth", async ({ page }) => {
    await page.goto("/cart");
    await expect(page).toHaveURL(/\/cart/);
    // Cart page should show empty state or items
    await expect(
      page.getByRole("heading", { name: /your bag is empty|shopping bag/i })
    ).toBeVisible({ timeout: 10000 });
  });

  test("checkout form validates required fields", async ({ page }) => {
    // Add product to cart
    await page.goto("/shop");
    await page.waitForLoadState("networkidle");
    const addToCartButtons = page.getByRole("button", { name: /add to bag/i });
    await addToCartButtons.first().click();
    await page.waitForTimeout(1000);

    // Go to checkout
    await page.getByRole("link", { name: /cart/i }).first().click();
    await page.getByRole("link", { name: /secure checkout/i }).click();
    await expect(page.getByRole("heading", { name: "Almost there" })).toBeVisible({ timeout: 10000 });
    await page.getByRole("button", { name: "Continue as guest" }).click();

    // Try to proceed without filling any fields
    await page.getByRole("button", { name: /continue to delivery/i }).click();

    // Should see validation errors
    await expect(page.getByText(/full name is required/i)).toBeVisible({ timeout: 5000 });
  });

  test("order tracking page works for guest orders", async ({ page }) => {
    await page.goto("/track-order");
    await expect(page.getByLabel(/order number/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("button", { name: /track/i })).toBeVisible();
  });
});