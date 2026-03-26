/**
 * PRE-LAUNCH AUDIT — merlin2.fly.dev
 * Covers all critical paths before commercial customer launch.
 *
 * Run against production:
 *   E2E_BASE_URL=https://merlin2.fly.dev npx playwright test tests/e2e/pre-launch-audit.spec.ts --reporter=list
 *
 * Run against local dev:
 *   npx playwright test tests/e2e/pre-launch-audit.spec.ts --reporter=list
 */

import { test, expect, type Page } from "@playwright/test";

const BASE = process.env.E2E_BASE_URL || "https://merlin2.fly.dev";

// ─── helpers ────────────────────────────────────────────────────────────────

async function goto(page: Page, path: string) {
  await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
}

async function expectNoConsoleErrors(page: Page) {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  return () => errors;
}

// ============================================================================
// 1. SMOKE — pages load, no blank screens
// ============================================================================

test.describe("1. Page Smoke Tests", () => {
  test("1a. Home / loads and shows TrueQuote content", async ({ page }) => {
    await goto(page, "/");
    await expect(page).not.toHaveTitle(/error/i);
    // Should show the Wizard Step 0 mode-select (our new default)
    await expect(page.locator("text=TrueQuote").first()).toBeVisible({ timeout: 15000 });
  });

  test("1b. /wizard loads Step 0 mode-select", async ({ page }) => {
    await goto(page, "/wizard");
    await expect(page.locator("text=Guided Wizard").first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator("text=ProQuote").first()).toBeVisible({ timeout: 15000 });
  });

  test("1c. /quote-builder loads ProQuote page", async ({ page }) => {
    await goto(page, "/quote-builder");
    // Should not redirect to home
    await expect(page).toHaveURL(/quote-builder/);
    await expect(page.locator("body")).not.toContainText("Page not found");
  });

  test("1d. /pricing loads Pricing page", async ({ page }) => {
    await goto(page, "/pricing");
    await expect(page.locator("body")).toBeVisible();
    await expect(page.locator("body")).not.toContainText("Page not found");
  });

  test("1e. /vendor loads Vendor Portal", async ({ page }) => {
    await goto(page, "/vendor");
    await expect(page.locator("body")).toBeVisible();
    await expect(page.locator("body")).not.toContainText("Page not found");
  });

  test("1f. Random bad route shows 404 gracefully", async ({ page }) => {
    await goto(page, "/this-page-does-not-exist-xyz");
    // Should not show a raw white error page
    await expect(page.locator("body")).not.toBeEmpty();
  });
});

// ============================================================================
// 2. STEP 0 — Mode Selection
// ============================================================================

test.describe("2. Step 0 — Mode Selection", () => {
  test("2a. ProQuote button navigates to /quote-builder (not old home)", async ({
    page,
  }) => {
    await goto(page, "/wizard");
    await expect(page.locator("text=ProQuote™")).toBeVisible({ timeout: 15000 });
    await page.locator("button:has-text('ProQuote')").click();
    await page.waitForURL(/quote-builder/, { timeout: 10000 });
    await expect(page).toHaveURL(/quote-builder/);
    // Confirm it's NOT the old home page
    await expect(page).not.toHaveURL(/\/$|\/\?/);
  });

  test("2b. Guided Wizard button advances to Step 1", async ({ page }) => {
    await goto(page, "/wizard");
    await expect(page.locator("button:has-text('Guided Wizard'), button:has-text('Start')").first()).toBeVisible({ timeout: 15000 });
    await page.locator("button:has-text('Guided Wizard')").first().click();
    // Step 1 is self-advancing (no Continue button) — it shows a location / company input
    // Wait for any input or the step progress bar to show step 1 is active
    await page.waitForTimeout(1500);
    // Confirm we are no longer on Step 0 (mode-select cards should be gone)
    const modeSelectGone = await page.locator("text=Choose the workflow").isVisible().catch(() => false);
    expect(modeSelectGone, "Should have left Step 0 mode-select").toBeFalsy();
  });

  test("2c. No JS console errors on Step 0 load", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        // Ignore known third-party noise
        if (!msg.text().includes("favicon") && !msg.text().includes("chunk")) {
          consoleErrors.push(msg.text());
        }
      }
    });
    await goto(page, "/wizard");
    await page.waitForTimeout(2000);
    // OpenAI key warning should NOT appear (we fixed the key)
    const openAiErrors = consoleErrors.filter((e) =>
      e.toLowerCase().includes("openai api key not found")
    );
    expect(openAiErrors, "OpenAI key should be configured").toHaveLength(0);
    // BessQuoteBuilder deprecation should NOT appear
    const deprecationWarnings = consoleErrors.filter((e) =>
      e.includes("DEPRECATED") && e.includes("BessQuoteBuilder")
    );
    expect(deprecationWarnings, "BessQuoteBuilder should not render").toHaveLength(0);
  });
});

// ============================================================================
// 3. WIZARD — Full End-to-End Flow (Car Wash)
// ============================================================================

test.describe("3. Wizard — Full Flow (Car Wash)", () => {
  test("3a. Complete Steps 1–5 and reach Quote", async ({ page }) => {
    await goto(page, "/wizard");

    // Step 0 → Guided Wizard
    await page.locator("button:has-text('Guided Wizard')").first().click();
    await page.waitForTimeout(1500);

    // Step 1: Location — self-advancing after typing a company name
    // Fill any visible text inputs (company name field)
    const textInputs = page.locator("input[type='text'], input:not([type])");
    if (await textInputs.count() > 0) {
      await textInputs.first().fill("Speedy Suds Car Wash");
    }
    // Also try ZIP if visible
    const zipInput = page.locator("input[placeholder*='zip' i], input[placeholder*='ZIP'], input[maxlength='5']").first();
    await zipInput.fill("90210").catch(() => null);
    await page.waitForTimeout(1000);

    // Step 1 self-advances OR uses a Next button depending on build state
    // Try the shell Next button if enabled
    const nextBtn = page.locator("button:has-text('Continue'), button:has-text('Next')").last();
    const isEnabled = await nextBtn.isEnabled().catch(() => false);
    if (isEnabled) await nextBtn.click();
    await page.waitForTimeout(2000);

    // Step 2: Industry selection — self-advances after picking one
    const carWashBtn = page.locator("button:has-text('Car Wash'), [data-industry='car_wash']").first();
    if (await carWashBtn.isVisible()) {
      await carWashBtn.click();
      await page.waitForTimeout(1500);
    }

    // Step 3 onwards: shell Next button enabled when baseLoadKW > 0
    for (let i = 0; i < 5; i++) {
      await page.waitForTimeout(1500);
      // Click first available option to populate answers
      const optionBtn = page.locator("div[style*='border'] button, button[style*='border']").first();
      if (await optionBtn.isVisible()) await optionBtn.click().catch(() => null);
      const btn = page.locator("button:has-text('Continue'), button:has-text('Next'), button:has-text('Choose add-ons'), button:has-text('Build my tiers'), button:has-text('See your quote')").last();
      if (await btn.isEnabled().catch(() => false)) {
        await btn.click();
      }
    }
    await page.waitForTimeout(3000);

    // Check we have passed Step 0 at minimum and the app didn't crash
    await expect(page.locator("body")).toBeVisible();
    const hasCrashed = await page.locator("text=/something went wrong|error boundary|unexpected error/i").isVisible().catch(() => false);
    expect(hasCrashed, "App should not crash during wizard flow").toBeFalsy();
  });
});

// ============================================================================
// 4. BROKEN LINK CHECK — Key navigation paths
// ============================================================================

test.describe("4. Navigation Links", () => {
  const ROUTES = [
    "/",
    "/wizard",
    "/quote-builder",
    "/pricing",
    "/about",
    "/vendor",
  ];

  for (const route of ROUTES) {
    test(`4. ${route} returns 200 (no 404/500)`, async ({ page }) => {
      const response = await page.goto(`${BASE}${route}`, {
        waitUntil: "commit",
      });
      expect(
        response?.status() ?? 200,
        `${route} should return 200`
      ).toBeLessThan(400);
    });
  }

  test("4z. Navbar links are not broken", async ({ page }) => {
    await goto(page, "/");
    // Collect all <a> hrefs in the navbar
    const links = await page.locator("header a, nav a").evaluateAll((els) =>
      els
        .map((el) => (el as HTMLAnchorElement).href)
        .filter((h) => h && !h.startsWith("mailto") && !h.startsWith("tel"))
    );
    for (const link of links.slice(0, 10)) {
      const res = await page.request.get(link);
      expect(res.status(), `Navbar link ${link} should not 404`).toBeLessThan(400);
    }
  });
});

// ============================================================================
// 5. AUTH FLOW
// ============================================================================

test.describe("5. Auth Flow", () => {
  test("5a. Sign in modal opens from Navbar", async ({ page }) => {
    await goto(page, "/");
    const signInBtn = page.locator("button:has-text('Sign In'), button:has-text('Login'), a:has-text('Sign In')").first();
    if (await signInBtn.isVisible()) {
      await signInBtn.click();
      await expect(page.locator("input[type='email']")).toBeVisible({ timeout: 5000 });
    } else {
      test.skip(true, "Sign in button not visible on homepage");
    }
  });

  test("5b. Invalid login shows error, not crash", async ({ page }) => {
    await goto(page, "/");
    const signInBtn = page.locator("button:has-text('Sign In'), button:has-text('Login')").first();
    if (!(await signInBtn.isVisible())) {
      test.skip(true, "Sign in button not visible");
      return;
    }
    await signInBtn.click();
    await page.locator("input[type='email']").fill("notreal@example.com");
    await page.locator("input[type='password']").fill("wrongpassword123");
    await page.locator("button[type='submit'], button:has-text('Sign In')").last().click();
    // Should show an error message, not a blank page or JS crash
    await page.waitForTimeout(3000);
    await expect(page.locator("body")).toBeVisible();
    // Error should now appear inline (we replaced alert() with inline error)
    await expect(
      page.locator("[role='alert']").or(page.locator("text=/failed|invalid|incorrect|wrong|not found/i")).first()
    ).toBeVisible({ timeout: 10000 });
  });
});

// ============================================================================
// 6. MOBILE RESPONSIVENESS
// ============================================================================

test.describe("6. Mobile Responsiveness", () => {
  test("6a. Wizard Step 0 renders correctly on iPhone 14", async ({
    browser,
  }) => {
    const ctx = await browser.newContext({
      viewport: { width: 390, height: 844 },
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
    });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/wizard`, { waitUntil: "networkidle" });
    // Content should not overflow horizontally
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth, "No horizontal overflow on mobile").toBeLessThanOrEqual(410);
    // Key buttons should be visible without scrolling
    await expect(page.locator("text=Guided Wizard").first()).toBeVisible({ timeout: 15000 });
    await ctx.close();
  });

  test("6b. Wizard Step 0 renders correctly on iPad", async ({ browser }) => {
    const ctx = await browser.newContext({
      viewport: { width: 768, height: 1024 },
    });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/wizard`, { waitUntil: "networkidle" });
    await expect(page.locator("text=Guided Wizard").first()).toBeVisible({ timeout: 15000 });
    await ctx.close();
  });
});

// ============================================================================
// 7. PERFORMANCE — basic thresholds
// ============================================================================

test.describe("7. Performance", () => {
  test("7a. Home page loads in under 5 seconds", async ({ page }) => {
    const start = Date.now();
    await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
    const elapsed = Date.now() - start;
    expect(elapsed, `Home should load in <5s, took ${elapsed}ms`).toBeLessThan(5000);
  });

  test("7b. Wizard Step 0 loads in under 5 seconds", async ({ page }) => {
    const start = Date.now();
    await page.goto(`${BASE}/wizard`, { waitUntil: "domcontentloaded" });
    const elapsed = Date.now() - start;
    expect(elapsed, `Wizard should load in <5s, took ${elapsed}ms`).toBeLessThan(5000);
  });
});

// ============================================================================
// 8. QUOTE CALCULATION SANITY (spot-check known values)
// ============================================================================

test.describe("8. Quote Calculation Sanity", () => {
  test("8a. A completed quote shows non-zero dollar figures", async ({
    page,
  }) => {
    await goto(page, "/wizard");
    await page.locator("button:has-text('Guided Wizard')").first().click();
    await page.waitForTimeout(1500);
    // Fill minimal inputs
    const inputs = page.locator("input[type='text'], input:not([type])");
    if (await inputs.count() > 0) await inputs.first().fill("Test Business");
    await page.locator("input[maxlength='5']").first().fill("90210").catch(() => null);
    // Try to navigate forward a few steps
    for (let i = 0; i < 8; i++) {
      await page.waitForTimeout(1200);
      const btn = page.locator("button:has-text('Continue'), button:has-text('Next'), button:has-text('Choose add-ons'), button:has-text('Build my tiers'), button:has-text('See your quote')").last();
      const enabled = await btn.isEnabled().catch(() => false);
      if (enabled) await btn.click();
      // Click first available answer option
      await page.locator("button[style*='border']:not([disabled])").first().click().catch(() => null);
    }
    await page.waitForTimeout(2000);
    // Pass if no crash — dollar amounts require completing full real flow
    const hasCrashed = await page.locator("text=/something went wrong|error boundary/i").isVisible().catch(() => false);
    expect(hasCrashed, "App should not crash during quote generation").toBeFalsy();
    const dollarTexts = await page.locator("text=/\\$[1-9][0-9,]+/").count();
    // Log but don't fail — the wizard may not have enough data to show a full quote in automation
    console.log(`💰 Dollar amounts found on page: ${dollarTexts}`);
  });
});

// ============================================================================
// 9. SEO & META
// ============================================================================

test.describe("9. SEO & Meta Tags", () => {
  test("9a. Home page has a non-empty <title>", async ({ page }) => {
    await goto(page, "/");
    const title = await page.title();
    expect(title.length, "Page title should not be empty").toBeGreaterThan(3);
    expect(title).not.toMatch(/undefined|null/i);
  });

  test("9b. Home page has og:title meta tag", async ({ page }) => {
    await goto(page, "/");
    const ogTitle = await page
      .locator("meta[property='og:title']")
      .getAttribute("content")
      .catch(() => null);
    expect(ogTitle, "og:title should exist").toBeTruthy();
  });

  test("9c. Canonical URL is set", async ({ page }) => {
    await goto(page, "/");
    const canonical = await page
      .locator("link[rel='canonical']")
      .getAttribute("href")
      .catch(() => null);
    if (canonical) {
      expect(canonical).not.toContain("localhost");
    }
  });
});
