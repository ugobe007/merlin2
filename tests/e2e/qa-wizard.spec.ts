import { test, expect, Page } from "@playwright/test";

const WIZARD_NEXT_TESTID = '[data-testid="wizard-next-button"]';

// ---------- Helpers ----------
async function attachFailureDiagnostics(page: Page, label: string) {
  await page.screenshot({ path: `test-results/${label}.png`, fullPage: true }).catch(() => {});
}

function startGlobalGuards(page: Page) {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const httpErrors: string[] = [];
  const requestFailures: string[] = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });

  page.on("pageerror", (err) => {
    pageErrors.push(String(err?.message ?? err));
  });

  page.on("requestfailed", (req) => {
    requestFailures.push(`${req.url()} :: ${req.failure()?.errorText ?? "requestfailed"}`);
  });

  page.on("response", (res) => {
    const status = res.status();
    const url = res.url();
    if (status >= 400 && status !== 404) httpErrors.push(`${status} ${url}`);
    // keep 404s separate: they matter for UI polish but sometimes benign (favicon)
    if (status === 404) httpErrors.push(`404 ${url}`);
  });

  return {
    getConsoleErrors: () => consoleErrors.slice(),
    getPageErrors: () => pageErrors.slice(),
    getHttpErrors: () => httpErrors.slice(),
    getRequestFailures: () => requestFailures.slice(),
  };
}

async function gotoHome(page: Page) {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle").catch(() => {});
}

async function gotoWizard(page: Page) {
  // Go directly to wizard route (V6 is at /wizard)
  await page.goto("/wizard", { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle").catch(() => {});
}

async function clickSmartWizardIfPresent(page: Page) {
  const candidates = [
    page.locator('button:has-text("Smart Wizard")'),
    page.locator('a:has-text("Smart Wizard")'),
    page.locator('button:has-text("Wizard")'),
    page.locator('a:has-text("Wizard")'),
    page.locator('text=Start saving').first(),
  ];

  for (const loc of candidates) {
    if (await loc.first().isVisible().catch(() => false)) {
      await loc.first().click({ timeout: 10_000 }).catch(() => {});
      return;
    }
  }
}

async function findNextButton(page: Page) {
  const testIdBtn = page.locator(WIZARD_NEXT_TESTID);
  if ((await testIdBtn.count()) === 1) return testIdBtn;

  // Fallbacks (V6/V7)
  const textBtns = [
    page.locator('button:has-text("Next Step")').first(),
    page.locator('button:has-text("Next")').first(),
    page.locator('button:has-text("Continue")').first(),
    page.locator('button:has-text("Continue →")').first(),
  ];

  for (const b of textBtns) {
    if (await b.isVisible().catch(() => false)) return b;
  }

  return null;
}

async function getDisabledReason(btn: any) {
  if (!btn) return null;
  const reason = await btn.getAttribute("data-disabled-reason").catch(() => null);
  const step = await btn.getAttribute("data-step").catch(() => null);
  return { reason, step };
}

async function waitForNextEnabled(page: Page, timeoutMs = 15_000) {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    const btn = await findNextButton(page);
    if (!btn) {
      throw new Error(`Dead-end: Next/Continue button not found. url=${page.url()}`);
    }

    const enabled = await btn.isEnabled().catch(() => false);
    if (enabled) return btn;

    const diag = await getDisabledReason(btn);
    if (diag?.reason) {
      // actionable
      // eslint-disable-next-line no-console
      console.log(`[QA] Next disabled (step=${diag.step ?? "?"}): ${diag.reason}`);
    }

    await page.waitForTimeout(250);
  }

  const btn = await findNextButton(page);
  const diag = btn ? await getDisabledReason(btn) : null;
  throw new Error(
    `Next never enabled within ${timeoutMs}ms. url=${page.url()} reason=${diag?.reason ?? "(none)"} step=${diag?.step ?? "(none)"}`
  );
}

async function clickNext(page: Page) {
  const btn = await waitForNextEnabled(page, 20_000);
  await btn.click();
}

async function fillZipIfPresent(page: Page, zip: string) {
  // try common patterns
  const zipInput = page.locator('input[placeholder*="ZIP"], input[name*="zip" i], input[id*="zip" i]').first();
  if (await zipInput.isVisible().catch(() => false)) {
    await zipInput.fill(zip);
    await zipInput.blur();
  }
}

async function selectStateIfPresent(page: Page, state: string) {
  // Try to select a state from dropdown
  const stateSelect = page.locator('select[name*="state" i], select[id*="state" i]').first();
  if (await stateSelect.isVisible().catch(() => false)) {
    await stateSelect.selectOption({ label: state }).catch(() => {});
  }
}

async function selectIndustryIfPresent(page: Page) {
  // Click first industry card if visible
  const industryCards = page.locator('[data-testid^="industry-card-"], button:has-text("Hotel"), button:has-text("Car Wash")');
  const firstCard = industryCards.first();
  if (await firstCard.isVisible().catch(() => false)) {
    await firstCard.click().catch(() => {});
  }
}

async function selectGoalsIfPresent(page: Page) {
  // Select at least 2 goals if goal checkboxes are visible
  const goalCheckboxes = page.locator('input[type="checkbox"][name*="goal" i], [data-testid^="goal-"]');
  const count = await goalCheckboxes.count().catch(() => 0);
  for (let i = 0; i < Math.min(count, 2); i++) {
    await goalCheckboxes.nth(i).click().catch(() => {});
  }
}

async function assertNoMathPoison(page: Page) {
  // Look for common poison strings in rendered text
  const bodyText = await page.locator("body").innerText().catch(() => "");
  const poison = ["NaN", "Infinity", "-Infinity", "$NaN", "undefined"];
  for (const p of poison) {
    expect(bodyText).not.toContain(p);
  }
}

// If you have known selectors for pricing totals, add them here.
// This will still work if they don't exist (it becomes "soft").
async function assertPricingLooksReal(page: Page) {
  // try to find anything that looks like currency totals
  const candidates = [
    page.locator('[data-testid="pricing-total"]'),
    page.locator('text=/\\$\\s?\\d{1,3}(,\\d{3})*(\\.\\d{2})?/').first(),
    page.locator('text=/Annual\\s+Savings/i').first(),
  ];

  for (const c of candidates) {
    if (await c.isVisible().catch(() => false)) {
      const txt = await c.innerText().catch(() => "");
      // If it's a currency value, ensure it's not $0 for the final step
      if (/\$\s?0(\.00)?\b/.test(txt)) {
        throw new Error(`Pricing appears zero: "${txt}" at url=${page.url()}`);
      }
      return;
    }
  }

  // Not found — don't hard fail (wizard UI might differ), but at least ensure no math poison.
  await assertNoMathPoison(page);
}

// ---------- Tests ----------
test.describe("Merlin Wizard QA - links, logic, math, and crashes", () => {
  test("Homepage loads clean + internal navigation is sane", async ({ page }) => {
    const guards = startGlobalGuards(page);

    await gotoHome(page);

    // Basic presence check
    await expect(page.locator("body")).toBeVisible();

    // Click around a bit if links exist
    const internalLinks = await page.locator('a[href^="/"]').all().catch(() => []);
    for (const link of internalLinks.slice(0, 10)) {
      const href = await link.getAttribute("href");
      if (!href || href === "#") continue;
      await link.click().catch(() => {});
      await page.waitForTimeout(300);
    }

    // Assertions: no hard crashes
    expect(guards.getPageErrors(), "Page errors detected").toEqual([]);
    // Console errors are meaningful—keep strict.
    expect(guards.getConsoleErrors(), "Console errors detected").toEqual([]);
  });

  test("Wizard run-through: ZIP → advance steps → pricing sanity", async ({ page }) => {
    const guards = startGlobalGuards(page);

    // Go directly to wizard
    await gotoWizard(page);

    // Step 1: enter ZIP if asked (use one deterministic ZIP)
    await fillZipIfPresent(page, "94102");
    await selectStateIfPresent(page, "California");
    await page.waitForTimeout(500);

    // Try to select goals if present
    await selectGoalsIfPresent(page);
    await page.waitForTimeout(300);

    // Proceed through steps
    for (let i = 0; i < 6; i++) {
      await assertNoMathPoison(page);
      
      try {
        await clickNext(page);
      } catch (e) {
        // If we can't proceed, try selecting an industry first
        await selectIndustryIfPresent(page);
        await page.waitForTimeout(500);
        await clickNext(page);
      }
      
      await page.waitForLoadState("networkidle").catch(() => {});
    }

    // On later steps, pricing should exist and not be poisoned/zero.
    await assertNoMathPoison(page);
    await assertPricingLooksReal(page);

    // Hard fail on page errors
    const pageErrors = guards.getPageErrors();
    const consoleErrors = guards.getConsoleErrors();
    const requestFailures = guards.getRequestFailures();

    // If you want to allow a known-benign 404 (favicon), filter here:
    const httpErrors = guards.getHttpErrors().filter((x) => !/favicon/i.test(x));

    expect(pageErrors, "React/runtime page errors").toEqual([]);
    expect(consoleErrors, "Console errors").toEqual([]);

    // Request failures usually indicate broken APIs/assets
    expect(requestFailures, "Network request failures").toEqual([]);

    // 404s will fail this unless whitelisted above
    expect(httpErrors, "HTTP errors (including 404s)").toEqual([]);
  });

  test("Link integrity inside wizard surfaces (no bad localhost URLs)", async ({ page }) => {
    await gotoWizard(page);

    // Collect all links and ensure none are hardcoded to localhost
    const links = await page.locator("a[href]").all();
    for (const a of links) {
      const href = await a.getAttribute("href");
      if (!href) continue;
      expect(href).not.toMatch(/^http:\/\/localhost/i);
      expect(href).not.toMatch(/^https?:\/\/127\.0\.0\.1/i);
    }
  });
});
