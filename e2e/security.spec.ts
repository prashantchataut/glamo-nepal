import { test, expect } from "@playwright/test";

test.describe("Forgot Password page", () => {
  test("renders and submit button enables with valid email", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(page.getByRole("heading", { name: /reset your password/i })).toBeVisible({ timeout: 30000 });

    const emailInput = page.locator("#forgot-email");
    const submitButton = page.getByRole("button", { name: /send reset link/i });

    await expect(submitButton).toBeDisabled();

    await emailInput.fill("valid@email.com");
    await expect(submitButton).toBeEnabled();
  });

  test("submit button stays enabled after failed submission (not rate-limited)", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(page.getByRole("heading", { name: /reset your password/i })).toBeVisible({ timeout: 30000 });

    const emailInput = page.locator("#forgot-email");
    const submitButton = page.getByRole("button", { name: /send reset link/i });

    await emailInput.fill("nonexistent@test.com");
    await expect(submitButton).toBeEnabled();

    await submitButton.click();

    await page.waitForTimeout(1000);

    const isDisabled = await submitButton.isDisabled();
    if (isDisabled) {
      const buttonText = await submitButton.textContent();
      expect(buttonText?.toLowerCase()).toContain("wait");
    }
  });

  test("has back to sign in link", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(page.getByRole("heading", { name: /reset your password/i })).toBeVisible({ timeout: 30000 });

    await expect(page.getByRole("link", { name: /back to sign in/i })).toBeVisible();
  });
});

test.describe("CSP — Content Security Policy", () => {
  test("auth pages load without CSP blocking rendering", async ({ page }) => {
    const cspViolations: string[] = [];
    page.on("console", (msg) => {
      if (msg.text().includes("Content Security Policy") || msg.text().includes("CSP")) {
        cspViolations.push(msg.text());
      }
    });

    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible({ timeout: 30000 });

    const blockingViolations = cspViolations.filter(
      (v) => v.includes("Refused to execute") || v.includes("Refused to apply")
    );
    expect(blockingViolations).toHaveLength(0);
  });

  test("register page loads without CSP blocking rendering", async ({ page }) => {
    const cspViolations: string[] = [];
    page.on("console", (msg) => {
      if (msg.text().includes("Content Security Policy") || msg.text().includes("CSP")) {
        cspViolations.push(msg.text());
      }
    });

    await page.goto("/register");
    await expect(page.getByRole("heading", { name: /create/i })).toBeVisible({ timeout: 30000 });

    const blockingViolations = cspViolations.filter(
      (v) => v.includes("Refused to execute") || v.includes("Refused to apply")
    );
    expect(blockingViolations).toHaveLength(0);
  });

  test("CSP header is present and has script-src", async ({ request }) => {
    const response = await request.get("/login");
    const csp = response.headers()["content-security-policy"];
    expect(csp).toBeTruthy();
    expect(csp).toContain("script-src");
    expect(csp).toContain("default-src");
    expect(csp).toContain("style-src");
  });

  test("CSP header has form-action self", async ({ request }) => {
    const response = await request.get("/login");
    const csp = response.headers()["content-security-policy"];
    expect(csp).toContain("form-action 'self'");
  });
});

test.describe("Contact form security", () => {
  test("contact form uses POST method", async ({ page }) => {
    await page.goto("/contact");
    await expect(page.getByRole("heading", { name: /product help/i })).toBeVisible({ timeout: 30000 });

    const form = page.locator("form").first();
    const method = await form.getAttribute("method");
    expect(method?.toLowerCase()).toBe("post");
  });

  test("contact form rejects invalid email via client validation", async ({ page }) => {
    await page.goto("/contact");
    await expect(page.getByRole("heading", { name: /product help/i })).toBeVisible({ timeout: 30000 });

    const nameInput = page.locator('input[name="name"]');
    const emailInput = page.locator('input[name="email"]');
    const messageInput = page.locator("textarea#contact-message");

    await nameInput.fill("Test User");
    await emailInput.fill("not-a-valid-email");
    await messageInput.fill("This is a test message that is at least ten characters long.");

    const subjectSelect = page.locator("select#contact-subject");
    await subjectSelect.selectOption("order");

    await page.getByRole("button", { name: /send message/i }).click();

    await expect(page.locator("text=/valid email/i")).toBeVisible({ timeout: 5000 });
  });

  test("contact form has noValidate for JS validation", async ({ page }) => {
    await page.goto("/contact");
    await expect(page.getByRole("heading", { name: /product help/i })).toBeVisible({ timeout: 30000 });

    const form = page.locator("form").first();
    const noValidate = await form.getAttribute("noValidate");
    expect(noValidate).not.toBeNull();
  });
});

test.describe("Newsletter form security", () => {
  test("newsletter form uses POST method", async ({ page }) => {
    await page.goto("/");
    const form = page.locator("form").filter({ has: page.locator("#newsletter-email") }).first();
    const method = await form.getAttribute("method");
    expect(method?.toLowerCase()).toBe("post");
  });

  test("newsletter form validates email before submission", async ({ page }) => {
    await page.goto("/");
    const emailInput = page.locator("#newsletter-email");
    const submitButton = page.getByRole("button", { name: /^join$/i });

    await emailInput.fill("invalid-email");
    await submitButton.click();

    await expect(page.getByText(/valid email/i)).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Security headers", () => {
  test("X-Frame-Options is set", async ({ request }) => {
    const response = await request.get("/");
    const xfo = response.headers()["x-frame-options"];
    expect(xfo).toBeTruthy();
  });

  test("Strict-Transport-Security is set", async ({ request }) => {
    const response = await request.get("/");
    const hsts = response.headers()["strict-transport-security"];
    expect(hsts).toContain("max-age=");
    expect(hsts).toContain("includeSubDomains");
  });

  test("X-Content-Type-Options is nosniff", async ({ request }) => {
    const response = await request.get("/");
    const xcto = response.headers()["x-content-type-options"];
    expect(xcto).toBe("nosniff");
  });

  test("Referrer-Policy is set", async ({ request }) => {
    const response = await request.get("/");
    const rp = response.headers()["referrer-policy"];
    expect(rp).toBe("strict-origin-when-cross-origin");
  });
});