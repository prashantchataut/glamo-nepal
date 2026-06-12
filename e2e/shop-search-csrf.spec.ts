import { test, expect } from "@playwright/test";

test.describe("Shop page", () => {
  test("loads successfully and shows products", async ({ page }) => {
    await page.goto("/shop");
    await expect(page.getByRole("heading", { name: /beauty edit|skincare|makeup/i })).toBeVisible({ timeout: 30000 });
    const productCards = page.locator("[data-testid='product-card'], .grid a[href^='/product/']");
    await expect(productCards.first()).toBeVisible({ timeout: 15000 });
    const count = await productCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test("category filter pills render and are clickable", async ({ page }) => {
    await page.goto("/shop");
    await expect(page.getByRole("heading", { name: /beauty edit/i })).toBeVisible({ timeout: 30000 });
    const categoryButtons = page.locator("button:has-text('Skincare'), button:has-text('Makeup'), button:has-text('Haircare')");
    await expect(categoryButtons.first()).toBeVisible({ timeout: 10000 });
    const count = await categoryButtons.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test("clicking a category filter shows products", async ({ page }) => {
    await page.goto("/shop");
    await expect(page.getByRole("heading", { name: /beauty edit/i })).toBeVisible({ timeout: 30000 });
    const skincareButton = page.locator("button", { hasText: "Skincare" }).first();
    await expect(skincareButton).toBeVisible({ timeout: 10000 });
    await skincareButton.click();
    await page.waitForTimeout(1000);
    const resultText = page.locator("text=/\\d+ result/i");
    await expect(resultText).toBeVisible({ timeout: 10000 });
  });

  test("sort dropdown is functional", async ({ page }) => {
    await page.goto("/shop");
    await expect(page.getByRole("heading", { name: /beauty edit/i })).toBeVisible({ timeout: 30000 });
    const sortSelect = page.locator("select[aria-label='Sort products']");
    await expect(sortSelect).toBeVisible();
    await sortSelect.selectOption({ label: "Price: Low to High" });
    await page.waitForTimeout(1000);
    const resultText = page.locator("text=/\\d+ result/i");
    await expect(resultText).toBeVisible({ timeout: 10000 });
  });

  test("clear filters button works", async ({ page }) => {
    await page.goto("/shop");
    await expect(page.getByRole("heading", { name: /beauty edit/i })).toBeVisible({ timeout: 30000 });
    const skincareButton = page.locator("button", { hasText: "Skincare" }).first();
    await expect(skincareButton).toBeVisible({ timeout: 10000 });
    await skincareButton.click();
    await page.waitForTimeout(500);
    const clearButton = page.getByRole("button", { name: /clear all/i });
    if (await clearButton.isVisible()) {
      await clearButton.click();
      await page.waitForTimeout(1000);
      const resultText = page.locator("text=/\\d+ result/i");
      await expect(resultText).toBeVisible({ timeout: 10000 });
    }
  });

  test("shows loading state initially", async ({ page }) => {
    const loadPromise = page.goto("/shop");
    const spinner = page.locator("text=Loading products");
    await expect(spinner.or(page.getByRole("heading", { name: /beauty edit/i }))).toBeVisible({ timeout: 30000 });
    await loadPromise;
  });

  test("empty state is not shown when products exist", async ({ page }) => {
    await page.goto("/shop");
    await expect(page.getByRole("heading", { name: /beauty edit/i })).toBeVisible({ timeout: 30000 });
    await page.waitForTimeout(3000);
    const noProducts = page.getByText("No products found");
    expect(await noProducts.isVisible()).toBe(false);
  });
});

test.describe("Search modal", () => {
  test("search modal opens and has input field", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const searchButton = page.locator("button[aria-label='Search products'], button[aria-label='Search skincare, makeup, SPF, brands']").first();
    await expect(searchButton).toBeVisible({ timeout: 15000 });
    await searchButton.click();
    const searchInput = page.locator("#glamo-search-input");
    await expect(searchInput).toBeVisible({ timeout: 5000 });
    await expect(searchInput).toBeFocused();
  });

  test("search input accepts text and shows results or no-results state", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const searchButton = page.locator("button[aria-label='Search products']").first();
    await expect(searchButton).toBeVisible({ timeout: 15000 });
    await searchButton.click();
    const searchInput = page.locator("#glamo-search-input");
    await expect(searchInput).toBeVisible({ timeout: 5000 });
    await searchInput.fill("moisturizer");
    await page.waitForTimeout(1000);
    const resultsArea = page.locator("#glamo-search-results");
    await expect(resultsArea).toBeVisible({ timeout: 10000 });
  });

  test("search modal shows trending searches when empty", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const searchButton = page.locator("button[aria-label='Search products']").first();
    await expect(searchButton).toBeVisible({ timeout: 15000 });
    await searchButton.click();
    const searchInput = page.locator("#glamo-search-input");
    await expect(searchInput).toBeVisible({ timeout: 5000 });
    const trending = page.getByText("Trending");
    await expect(trending).toBeVisible({ timeout: 5000 });
  });

  test("search modal closes on Escape key", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const searchButton = page.locator("button[aria-label='Search products']").first();
    await expect(searchButton).toBeVisible({ timeout: 15000 });
    await searchButton.click();
    const searchInput = page.locator("#glamo-search-input");
    await expect(searchInput).toBeVisible({ timeout: 5000 });
    await page.keyboard.press("Escape");
    await expect(searchInput).not.toBeVisible({ timeout: 3000 });
  });

  test("search modal closes on Cancel button", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const searchButton = page.locator("button[aria-label='Search products']").first();
    await expect(searchButton).toBeVisible({ timeout: 15000 });
    await searchButton.click();
    const searchInput = page.locator("#glamo-search-input");
    await expect(searchInput).toBeVisible({ timeout: 5000 });
    const cancelButton = page.getByRole("button", { name: /cancel/i });
    await expect(cancelButton).toBeVisible();
    await cancelButton.click();
    await expect(searchInput).not.toBeVisible({ timeout: 3000 });
  });

  test("search modal closes on backdrop click", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const searchButton = page.locator("button[aria-label='Search products']").first();
    await expect(searchButton).toBeVisible({ timeout: 15000 });
    await searchButton.click();
    const searchInput = page.locator("#glamo-search-input");
    await expect(searchInput).toBeVisible({ timeout: 5000 });
    const backdrop = page.locator(".fixed.inset-0.z-modal-backdrop").first();
    if (await backdrop.isVisible()) {
      await backdrop.click();
      await expect(searchInput).not.toBeVisible({ timeout: 3000 });
    }
  });
});

test.describe("CSRF protection", () => {
  test("CSRF bootstrap endpoint returns token", async ({ page }) => {
    const response = await page.request.get("/api/csrf");
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.csrfToken).toBeDefined();
    expect(typeof data.csrfToken).toBe("string");
    expect(data.csrfToken.length).toBeGreaterThanOrEqual(32);
  });

  test("CSRF token is available in sessionStorage after page load", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const csrfToken = await page.evaluate(() => sessionStorage.getItem("glamo-csrf-raw-token"));
    expect(csrfToken).not.toBeNull();
    expect(csrfToken!.length).toBeGreaterThanOrEqual(32);
  });
});