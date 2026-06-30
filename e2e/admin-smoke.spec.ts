import { test, expect, type Page } from "@playwright/test";

const routes = [
  { path: "/admin/login", name: "admin-login" },
  { path: "/admin", name: "admin-dashboard" },
  { path: "/admin/orders", name: "admin-orders" },
  { path: "/admin/products", name: "admin-products" },
  { path: "/admin/settings", name: "admin-settings" },
  { path: "/admin/analytics", name: "admin-analytics" },
  { path: "/admin/audit", name: "admin-audit" },
  { path: "/admin/customers", name: "admin-customers" },
];

const ignoredPatterns = [
  /favicon/i,
  /Source map/i,
  /google-analytics/i,
  /googletagmanager/i,
  /React DevTools/i,
];

function isIgnored(text: string) {
  return ignoredPatterns.some((p) => p.test(text));
}

function collectErrors(page: Page) {
  const errors: { type: string; text: string }[] = [];
  page.on("pageerror", (err) => errors.push({ type: "pageerror", text: err.message }));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push({ type: "console.error", text: msg.text() });
    if (msg.type() === "warning") errors.push({ type: "console.warn", text: msg.text() });
  });
  return errors;
}

test.describe("admin smoke", () => {
  for (const route of routes) {
    test(`${route.name} (${route.path}) renders without hydration/console errors`, async ({ page }) => {
      const errors = collectErrors(page);
      const res = await page.goto(route.path, { waitUntil: "load" });
      expect(res?.status()).toBeLessThan(500);
      await page.waitForTimeout(800);
      const hydrationErrors = errors.filter((e) =>
        e.text.includes("Minified React error #418") || e.text.includes("Hydration"),
      );
      expect(hydrationErrors, `no hydration errors on ${route.path}`).toHaveLength(0);
      const serious = errors.filter((e) => !isIgnored(e.text));
      expect(serious, `no serious console errors on ${route.path}`).toHaveLength(0);
    });
  }
});
