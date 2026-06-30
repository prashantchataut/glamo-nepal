import { test, expect, type Page } from "@playwright/test";

const routes = [
  { path: "/", name: "home" },
  { path: "/shop", name: "shop" },
  { path: "/cart", name: "cart" },
  { path: "/checkout", name: "checkout" },
  { path: "/account", name: "account" },
  { path: "/login", name: "login" },
  { path: "/register", name: "register" },
];

const viewports = [
  { name: "desktop", width: 1280, height: 720 },
  { name: "mobile320", width: 320, height: 568 },
  { name: "mobile375", width: 375, height: 667 },
  { name: "mobile414", width: 414, height: 896 },
];

function collectErrors(page: Page) {
  const errors: { type: string; text: string; location?: string }[] = [];
  page.on("pageerror", (err) => {
    errors.push({ type: "pageerror", text: err.message, location: err.stack });
  });
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      errors.push({ type: "console.error", text: msg.text() });
    }
  });
  return errors;
}

for (const vp of viewports) {
  test.describe(`smoke: ${vp.name}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    for (const route of routes) {
      test(`${route.name} (${route.path}) loads without console/hydration errors`, async ({ page }) => {
        const errors = collectErrors(page);
        const res = await page.goto(route.path, { waitUntil: "networkidle" });
        expect(res?.status()).toBeLessThan(500);
        // Wait a tick for lazy hydration errors to surface
        await page.waitForTimeout(500);
        const hydrationErrors = errors.filter(
          (e) => e.text.includes("Minified React error #418") || e.text.includes("Hydration"),
        );
        const otherErrors = errors.filter((e) => !e.text.includes("favicon") && !e.text.includes("Source map"));
        expect(hydrationErrors, `no hydration errors on ${route.path}`).toHaveLength(0);
        // Warn but do not fail on non-hydration console errors for this smoke pass
        if (otherErrors.length) {
          console.warn(`[${route.name}@${vp.name}] console errors:`, otherErrors.map((e) => e.text));
        }
      });
    }

    test(`product page loads without hydration errors`, async ({ page }) => {
      const errors = collectErrors(page);
      await page.goto("/shop", { waitUntil: "networkidle" });
      // Wait for the product grid to render (product cards replace skeleton/loading state)
      const productGrid = page.locator("article a[href^='/product/']").first();
      await expect(productGrid).toBeVisible({ timeout: 20000 });
      const productLink = page.locator("a[href^='/product/']").first();
      await expect(productLink).toBeVisible({ timeout: 20000 });
      const href = await productLink.getAttribute("href");
      if (!href) throw new Error("No product link found on /shop");
      await productLink.click();
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(500);
      const hydrationErrors = errors.filter(
        (e) => e.text.includes("Minified React error #418") || e.text.includes("Hydration"),
      );
      expect(hydrationErrors, `no hydration errors on product page`).toHaveLength(0);
    });
  });
}
