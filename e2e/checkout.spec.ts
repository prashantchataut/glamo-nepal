import { test, expect } from "@playwright/test";

const PRODUCT_SLUG = "cosrx-advanced-snail-96-mucin-power-essence";

test.describe("Guest checkout", () => {
  test.skip(
    !process.env.E2E_CHECKOUT_ENABLED,
    "Skipping live checkout spec. Set E2E_CHECKOUT_ENABLED=1 to run (creates a real test order).",
  );

  test("completes a COD guest order and clears the cart", async ({ page }) => {
    // 1. Product page
    const response = await page.goto(`/product/${PRODUCT_SLUG}`);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { name: /cosrx advanced snail/i })).toBeVisible({ timeout: 30000 });

    // 2. Add to cart
    const addButton = page.getByRole("button", { name: /add to bag/i });
    await expect(addButton).toBeVisible();
    await addButton.click();

    // 3. Cart drawer opens
    const cartDrawer = page.locator("[aria-label='Shopping cart']");
    await expect(cartDrawer).toBeVisible({ timeout: 10000 });
    const checkoutLink = page.getByRole("link", { name: /checkout securely/i });
    await expect(checkoutLink).toBeVisible();
    await checkoutLink.click();

    // 4. Checkout page
    await expect(page).toHaveURL(/\/checkout/, { timeout: 15000 });
    await expect(page.getByRole("heading", { name: /confirm your beauty bag/i })).toBeVisible();

    // 4a. Guest mode
    const guestButton = page.getByRole("button", { name: /continue as guest/i });
    if (await guestButton.isVisible().catch(() => false)) {
      await guestButton.click();
    }

    // 4b. Shipping details
    await page.locator("#name").fill("Test User");
    await page.locator("#phone").fill("9818212188");
    await page.locator("#email").fill("test-user@glamonepal.local");
    await page.locator("#ward").fill("12");
    await page.locator("#address").fill("Test Street, Kathmandu");
    // Province / district / city default to Bagmati / Kathmandu / Kathmandu.

    await page.getByRole("button", { name: /continue to delivery/i }).click();

    // 4c. Delivery method
    await expect(page.getByRole("heading", { name: /delivery method/i })).toBeVisible();
    await page.getByRole("button", { name: /continue to payment/i }).click();

    // 4d. Payment method
    await expect(page.getByRole("heading", { name: /payment method/i })).toBeVisible();
    const codRadio = page.locator("input[type='radio'][value='Cash on Delivery']");
    await expect(codRadio).toBeChecked();
    await page.getByRole("button", { name: /review order/i }).click();

    // 5. Review and place order
    await expect(page.getByRole("heading", { name: /review order/i })).toBeVisible();
    await page.getByRole("button", { name: /place order/i }).click();

    // 6. Order confirmation
    await expect(page).toHaveURL(/\/order-confirmation\//, { timeout: 30000 });
    await expect(page.getByRole("heading", { name: /thank you for your order/i })).toBeVisible({ timeout: 30000 });
    await expect(page.getByText(/order number/i)).toBeVisible();

    // 7. No error banner
    await expect(page.getByRole("alert")).not.toBeVisible();

    // 8. Cart count is back to 0
    const cartCount = page.locator("header a[href='/cart'] .sr-only");
    await expect(cartCount).toHaveText(/0 items in cart/);
  });
});
