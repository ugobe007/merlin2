/**
 * V7 Wizard Smoke Tests — Playwright
 * 
 * Run with: npx playwright test tests/smoke/wizard-v7-smoke.spec.ts --headed
 * 
 * Prerequisites:
 * 1. Dev server running on localhost:5184
 * 2. Debug panel auto-shows via ?debug=1 (no keyboard dependency)
 * 
 * Mock Control (query params):
 * - ?mockPricing=ok (default): Normal behavior
 * - ?mockPricing=fail: Force immediate error
 * - ?mockPricing=slow: 3s delay (test race conditions)
 * - ?mockPricing=slow_timeout: 20s delay (force timeout)
 * 
 * These tests validate:
 * - Stale-write guards (requestKey)
 * - Deterministic snapshots (snapshotId)
 * - Monotonic merge (pricingComplete)
 * - Timeout handling
 * - Non-blocking navigation
 * 
 * GUARDRAILS:
 * - A: Debug panel auto-shows via ?debug=1 (no keyboard flakiness in CI)
 * - B: Each test verifies mock mode is active before assertions
 */

import { test, expect, type Page } from "@playwright/test";

const BASE_URL = "http://localhost:5184";

// ============================================================================
// SELECTORS (data-testid)
// ============================================================================
const SEL = {
  // Debug panel
  debugPanel: '[data-testid="v7-debug-panel"]',
  pricingStatus: '[data-testid="debug-pricing-status"]',
  requestKey: '[data-testid="debug-request-key"]',
  snapshotId: '[data-testid="debug-snapshot-id"]',
  pricingComplete: '[data-testid="debug-pricing-complete"]',
  fallbacks: '[data-testid="debug-fallbacks"]',
  mockMode: '[data-testid="debug-mock-mode"]', // GUARDRAIL B
  
  // Industry cards (Step 2)
  industryCarWash: '[data-testid="industry-card-car-wash"]',
  industryHotel: '[data-testid="industry-card-hotel"]',
  industryEvCharging: '[data-testid="industry-card-ev-charging"]',
  industryRetail: '[data-testid="industry-card-retail"]',
  industryOther: '[data-testid="industry-card-other"]',
};

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Build URL with debug=1 and optional mock mode
 * GUARDRAIL A: Always include debug=1 for auto-visible panel
 */
function wizardUrl(mockPricing?: "ok" | "fail" | "slow" | "slow_timeout"): string {
  const params = new URLSearchParams({ debug: "1" });
  if (mockPricing && mockPricing !== "ok") {
    params.set("mockPricing", mockPricing);
  }
  return `${BASE_URL}/wizard?${params.toString()}`;
}

/** Wait for debug panel to be visible (should auto-show with ?debug=1) */
async function waitForDebugPanel(page: Page) {
  await page.waitForSelector(SEL.debugPanel, { state: "visible", timeout: 5000 });
}

/**
 * GUARDRAIL B: Verify mock mode is active
 * Call this early in each test to ensure mock routing didn't break
 */
async function assertMockMode(page: Page, expectedMode: "ok" | "fail" | "slow" | "slow_timeout") {
  await waitForDebugPanel(page);
  const el = page.locator(SEL.mockMode);
  const actualMode = await el.getAttribute("data-mode");
  expect(actualMode, `Expected mock mode "${expectedMode}" but got "${actualMode}"`).toBe(expectedMode);
}

/** Get text from a debug panel field */
async function getText(page: Page, testId: string): Promise<string> {
  const el = page.locator(`[data-testid="${testId}"]`);
  return (await el.textContent())?.trim() ?? "";
}

/** Get pricing status from debug panel */
async function getPricingStatus(page: Page): Promise<string> {
  await waitForDebugPanel(page);
  const el = page.locator(SEL.pricingStatus);
  return (await el.getAttribute("data-status")) ?? "unknown";
}

/** Wait for pricing status to match */
async function expectPricingStatus(page: Page, status: string | string[], timeout = 15000) {
  const statuses = Array.isArray(status) ? status : [status];
  await waitForDebugPanel(page);
  
  await expect(async () => {
    const current = await getPricingStatus(page);
    expect(statuses).toContain(current);
  }).toPass({ timeout });
}

/** Get requestKey from debug panel */
async function getRequestKey(page: Page): Promise<string> {
  await waitForDebugPanel(page);
  return getText(page, "debug-request-key");
}

/** Get snapshotId from debug panel */
async function getSnapshotId(page: Page): Promise<string> {
  await waitForDebugPanel(page);
  return getText(page, "debug-snapshot-id");
}

// ============================================================================
// STEP COMPLETION HELPERS
// ============================================================================

/**
 * Complete Step 1 (Location)
 * 
 * V7 Step 1 flow:
 * 1. Enter ZIP code
 * 2. Enter business name (required to enable "Find My Location")
 * 3. Click "Find My Location" button
 * 4. Wait for business card / location resolution
 * 5. Skip business confirmation → auto-navigates to Step 2 (NO Next button needed)
 */
async function completeStep1(page: Page, zip = "90210", businessName = "Test Business") {
  console.log("[Test Step1] Starting...");
  
  // Step 1a: Enter ZIP code
  const zipInput = page.locator('input[placeholder*="ZIP"], input[placeholder*="zip"], input.merlin-zip-input').first();
  await zipInput.waitFor({ state: "visible", timeout: 10000 });
  await zipInput.fill(zip);
  console.log("[Test Step1] ZIP filled:", zip);
  await page.waitForTimeout(500);
  
  // Step 1b: Enter business name
  const businessInput = page.locator('input[placeholder*="Hilton"], input[placeholder*="Garden"]').first();
  await businessInput.waitFor({ state: "visible", timeout: 5000 });
  await businessInput.fill(businessName);
  console.log("[Test Step1] Business name filled:", businessName);
  await page.waitForTimeout(300);
  
  // Step 1c: Click "Find My Location" button
  const findButton = page.locator('button:has-text("Find My Location")');
  await findButton.waitFor({ state: "visible", timeout: 5000 });
  await expect(findButton).toBeEnabled({ timeout: 3000 });
  await findButton.click();
  console.log("[Test Step1] Find My Location clicked");
  
  // Step 1d: Wait for location resolution
  await page.waitForTimeout(4000); // Allow API call
  
  // Step 1e: Look for Skip button OR check if we navigated to Step 2
  const skipButton = page.locator('button:has-text("Skip"), button:has-text("manually")').first();
  const industryCard = page.locator('[data-testid^="industry-card-"]').first();
  
  // Race: either skip button appears OR we auto-navigated to Step 2
  try {
    const result = await Promise.race([
      skipButton.waitFor({ state: "visible", timeout: 6000 }).then(() => "skip"),
      industryCard.waitFor({ state: "visible", timeout: 6000 }).then(() => "industry"),
    ]);
    
    if (result === "skip") {
      console.log("[Test Step1] Skip button found, clicking...");
      await skipButton.click();
      await page.waitForTimeout(500);
    } else {
      console.log("[Test Step1] Already on Step 2 (industry cards visible)");
    }
  } catch {
    console.log("[Test Step1] Neither skip button nor industry cards visible - screenshot:");
    // Try clicking Next Step as last resort
    const nextButton = page.locator('button:has-text("Next Step")');
    const isNextVisible = await nextButton.isVisible().catch(() => false);
    const isNextEnabled = await nextButton.isEnabled().catch(() => false);
    console.log("[Test Step1] Next button visible:", isNextVisible, "enabled:", isNextEnabled);
    
    if (isNextVisible && isNextEnabled) {
      await nextButton.click();
      await page.waitForTimeout(500);
    } else {
      throw new Error("Step 1 failed: no skip button, no industry cards, Next button not available");
    }
  }
  
  console.log("[Test Step1] Complete");
}

/** Wait for Step 2 (Industry) and select an industry */
async function completeStep2(page: Page, industry: "car-wash" | "hotel" | "ev-charging" | "retail" | "other" = "hotel") {
  console.log("[Test Step2] Starting, selecting:", industry);
  
  // Wait for industry cards to be visible
  const cardSelector = `[data-testid="industry-card-${industry}"]`;
  await page.waitForSelector(cardSelector, { timeout: 8000 });
  console.log("[Test Step2] Industry card found:", industry);
  
  await page.click(cardSelector);
  console.log("[Test Step2] Industry card clicked");
  
  // Wait for navigation to Step 3
  await page.waitForTimeout(2000);
  console.log("[Test Step2] Complete");
}

/** Complete Step 3 (Profile) - fill required fields and click Generate Quote */
async function completeStep3(page: Page) {
  console.log("[Test Step3] Starting...");
  
  // Wait for Step 3 content to load
  await page.waitForTimeout(2000);
  
  // Helper to fill all visible inputs
  async function fillVisibleInputs(pass: number) {
    console.log(`[Test Step3] Pass ${pass}: Filling inputs...`);
    
    // Fill number inputs with reasonable defaults
    const numberInputs = page.locator('input[type="number"]:visible');
    const numCount = await numberInputs.count();
    console.log(`[Test Step3] Pass ${pass}: Number inputs found:`, numCount);
    
    for (let i = 0; i < Math.min(numCount, 10); i++) {
      const input = numberInputs.nth(i);
      const value = await input.inputValue();
      if (!value || value === "" || value === "0") {
        await input.fill("100");
        console.log(`[Test Step3] Pass ${pass}: Filled number input`, i, "with 100");
      }
    }
    
    // Fill text inputs (for kwhRate etc)
    const textInputs = page.locator('input[type="text"]:visible');
    const textCount = await textInputs.count();
    if (textCount > 0) {
      console.log(`[Test Step3] Pass ${pass}: Text inputs found:`, textCount);
      for (let i = 0; i < Math.min(textCount, 5); i++) {
        const input = textInputs.nth(i);
        const value = await input.inputValue();
        if (!value || value === "") {
          await input.fill("0.12");
          console.log(`[Test Step3] Pass ${pass}: Filled text input`, i);
        }
      }
    }
    
    // Click checkboxes (for amenities multi-select)
    const checkboxes = page.locator('input[type="checkbox"]:visible:not(:checked)');
    const checkCount = await checkboxes.count();
    if (checkCount > 0) {
      console.log(`[Test Step3] Pass ${pass}: Unchecked checkboxes found:`, checkCount);
      // Check first checkbox in each group
      await checkboxes.first().click();
      console.log(`[Test Step3] Pass ${pass}: Clicked first checkbox`);
    }
    
    // Click option buttons (for single-select questions)
    const optionGroups = page.locator('.grid.grid-cols-2:visible');
    const groupCount = await optionGroups.count();
    console.log(`[Test Step3] Pass ${pass}: Option button groups found:`, groupCount);
    
    for (let i = 0; i < Math.min(groupCount, 10); i++) {
      const group = optionGroups.nth(i);
      const selectedBtn = group.locator('button.border-violet-500');
      const hasSelection = await selectedBtn.count() > 0;
      
      if (!hasSelection) {
        const firstBtn = group.locator('button:not([disabled])').first();
        if (await firstBtn.count() > 0) {
          const btnText = await firstBtn.textContent();
          await firstBtn.click();
          console.log(`[Test Step3] Pass ${pass}: Clicked option button:`, btnText?.trim().substring(0, 30));
          await page.waitForTimeout(100);
        }
      }
    }
    
    // Select from dropdowns
    const selects = page.locator('select:visible');
    const selectCount = await selects.count();
    console.log(`[Test Step3] Pass ${pass}: Select dropdowns found:`, selectCount);
    
    for (let i = 0; i < Math.min(selectCount, 5); i++) {
      const select = selects.nth(i);
      const value = await select.inputValue();
      if (!value || value === "") {
        const options = select.locator('option');
        const optCount = await options.count();
        for (let j = 1; j < optCount; j++) {
          const optValue = await options.nth(j).getAttribute('value');
          if (optValue && optValue !== "") {
            await select.selectOption(optValue);
            console.log(`[Test Step3] Pass ${pass}: Selected dropdown option`, optValue);
            break;
          }
        }
      }
    }
  }
  
  // Pass 1: Fill initial visible fields
  await fillVisibleInputs(1);
  await page.waitForTimeout(500);
  
  // Pass 2: Fill any newly-revealed conditional fields
  await fillVisibleInputs(2);
  await page.waitForTimeout(500);
  
  // Pass 3: One more pass for deeply nested conditionals
  await fillVisibleInputs(3);
  await page.waitForTimeout(300);
  
  // Capture any DEV debug info showing missing fields
  const devDebug = page.locator('text=/Missing:/i');
  if (await devDebug.count() > 0) {
    const missingText = await devDebug.textContent();
    console.log("[Test Step3] DEV Debug -", missingText);
  }
  
  // Also log Complete status from DEV debug
  const completeDebug = page.locator('text=/Complete:.*true|Complete:.*false/i');
  if (await completeDebug.count() > 0) {
    const completeText = await completeDebug.textContent();
    console.log("[Test Step3] DEV Debug -", completeText);
  }
  
  // Scroll to bottom to ensure button is visible
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(300);
  
  // Look for Continue button (Step 3 navigates to results, pricing runs async)
  const generateBtn = page.locator('[data-testid="step3-continue"]').first();
  const exists = await generateBtn.count();
  console.log("[Test Step3] Continue button count in DOM:", exists);
  
  if (exists > 0) {
    await generateBtn.scrollIntoViewIfNeeded();
    await generateBtn.waitFor({ state: "visible", timeout: 5000 });
    
    const isEnabled = await generateBtn.isEnabled();
    console.log("[Test Step3] Continue button enabled:", isEnabled);
    
    if (isEnabled) {
      await generateBtn.click();
      console.log("[Test Step3] Continue clicked (enabled) - navigating to results");
    } else {
      // Force click even if disabled - this will test the validation path
      console.log("[Test Step3] Button disabled - clicking anyway to test validation...");
      await generateBtn.click({ force: true });
    }
    
    await page.waitForTimeout(500);
    console.log("[Test Step3] Complete");
    return;
  }
  
  // Fallback: try Next Step button
  const nextBtn = page.locator('button:has-text("Next Step")').first();
  if (await nextBtn.isVisible()) {
    console.log("[Test Step3] Using Next Step button as fallback");
    await nextBtn.click({ force: true });
    await page.waitForTimeout(500);
  } else {
    throw new Error("No Generate Quote or Next Step button found");
  }
  
  console.log("[Test Step3] Complete");
}


/** Navigate back to previous step */
async function goBack(page: Page) {
  await page.locator('button:has-text("Back"), button:has-text("Edit")').first().click();
  await page.waitForTimeout(300);
}

// ============================================================================
// SMOKE TEST 1: Happy path (baseline)
// ============================================================================
test.describe("Smoke 1 — Happy path (baseline)", () => {
  test("Step 3 → immediate results → pricing fills in → badge flips green", async ({ page }) => {
    // GUARDRAIL A: ?debug=1 for auto-visible panel
    await page.goto(wizardUrl("ok"));
    
    // GUARDRAIL B: Verify mock mode is active
    await assertMockMode(page, "ok");
    
    // Complete wizard flow
    await completeStep1(page);
    await completeStep2(page, "hotel");
    await completeStep3(page);
    
    // Should be on Step 4 Results
    await expect(page.locator('text=/Results|Quote|Step 4/i').first()).toBeVisible({ timeout: 5000 });
    
    // Debug panel should already be visible (via ?debug=1)
    await waitForDebugPanel(page);
    
    // Load profile should render immediately (not blocked)
    await expect(page.locator('text=/Load Profile|Peak Load/i').first()).toBeVisible({ timeout: 3000 });
    
    // Wait for pricing completion (max 15s)
    await expectPricingStatus(page, "ok", 15000);
    
    // Verify pricingComplete = true
    await expect(page.locator(SEL.pricingComplete)).toContainText("true");
    
    // Verify snapshotId is present and stable
    const snapshotId = await getSnapshotId(page);
    expect(snapshotId).not.toBe("null");
    expect(snapshotId.length).toBeGreaterThan(5);
    
    // Verify financial fields appear (all at once, not partial)
    await expect(page.locator('text=/Investment|CAPEX/i').first()).toBeVisible({ timeout: 2000 });
    await expect(page.locator('text=/Annual Savings|Savings/i').first()).toBeVisible();
    await expect(page.locator('text=/Payback|ROI/i').first()).toBeVisible();
  });
});

// ============================================================================
// SMOKE TEST 2: Pricing failure is non-blocking
// ============================================================================
test.describe("Smoke 2 — Pricing failure is non-blocking", () => {
  test("UI continues to function when pricing errors", async ({ page }) => {
    // GUARDRAIL A: ?debug=1 for auto-visible panel
    await page.goto(wizardUrl("fail"));
    
    // GUARDRAIL B: Verify mock mode is active
    await assertMockMode(page, "fail");
    
    // Complete wizard flow
    await completeStep1(page);
    await completeStep2(page, "hotel");
    await completeStep3(page);
    
    // Should still reach Step 4 (non-blocking)
    await expect(page.locator('text=/Results|Quote|Step 4/i').first()).toBeVisible({ timeout: 5000 });
    
    // Debug panel should already be visible (via ?debug=1)
    await waitForDebugPanel(page);
    
    // Wait for pricing to fail
    await expectPricingStatus(page, "error", 10000);
    
    // Load profile should still be visible
    await expect(page.locator('text=/Load Profile|Peak Load/i').first()).toBeVisible();
    
    // pricingComplete should be false (monotonic merge)
    await expect(page.locator(SEL.pricingComplete)).toContainText("false");
    
    // Financial fields should remain null (ALL or NONE)
    const debugPanel = page.locator(SEL.debugPanel);
    await expect(debugPanel.locator('text=capexUSD')).toContainText("null");
    
    // Error message should be visible
    await expect(page.locator('text=/Pricing.*error|Pricing failed/i').first()).toBeVisible();
    
    // Retry button should be available
    await expect(page.locator('button:has-text("Retry")').first()).toBeVisible();
    
    // Navigation should still work (non-blocking)
    await goBack(page);
    await expect(page.locator('text=/Profile|Step 3/i').first()).toBeVisible({ timeout: 3000 });
  });
});

// ============================================================================
// SMOKE TEST 3: Race condition (stale-write guard)
// ============================================================================
test.describe("Smoke 3 — Rapid edits (stale-write guard)", () => {
  test("Old pricing results never overwrite new inputs", async ({ page }) => {
    // GUARDRAIL A: ?debug=1 for auto-visible panel + slow mock
    await page.goto(wizardUrl("slow"));
    
    // GUARDRAIL B: Verify mock mode is active
    await assertMockMode(page, "slow");
    
    // Complete wizard flow
    await completeStep1(page);
    await completeStep2(page, "hotel");
    await completeStep3(page);
    
    // Debug panel should already be visible (via ?debug=1)
    await waitForDebugPanel(page);
    
    // Should be loading
    await expectPricingStatus(page, "pending", 3000);
    
    // Capture initial requestKey
    const key1 = await getRequestKey(page);
    expect(key1).not.toBe("null");
    
    // Before pricing completes, go back and change input
    await goBack(page);
    
    // Change a value that affects load (find any number input)
    const numberInput = page.locator('input[type="number"]').first();
    if (await numberInput.isVisible()) {
      await numberInput.fill("250");
    }
    
    // Submit again
    await completeStep3(page);
    
    // Debug panel should remain visible
    await waitForDebugPanel(page);
    
    // Should be loading again with new requestKey
    await expectPricingStatus(page, "pending", 3000);
    const key2 = await getRequestKey(page);
    
    // CRITICAL: requestKey must have changed
    expect(key2).not.toBe(key1);
    
    // Wait for new pricing to complete
    await expectPricingStatus(page, "ok", 10000);
    
    // Verify snapshotId reflects final inputs (not stale)
    const finalSnapshot = await getSnapshotId(page);
    expect(finalSnapshot.length).toBeGreaterThan(5);
  });
});

// ============================================================================
// SMOKE TEST 4: Industry switch (hard reset scenario)
// ============================================================================
test.describe("Smoke 4 — Industry switch (hard reset)", () => {
  test("Schema switch invalidates pricing, no cross-industry contamination", async ({ page }) => {
    // GUARDRAIL A: ?debug=1 for auto-visible panel + slow mock
    await page.goto(wizardUrl("slow"));
    
    // GUARDRAIL B: Verify mock mode is active
    await assertMockMode(page, "slow");
    
    // Complete with Industry A (car wash)
    await completeStep1(page);
    await completeStep2(page, "car-wash");
    await completeStep3(page);
    
    // Debug panel should already be visible (via ?debug=1)
    await waitForDebugPanel(page);
    
    // Capture snapshot from Industry A (may be loading or ready)
    await page.waitForTimeout(500);
    const snap1 = await getSnapshotId(page);
    
    // Go back to Step 2 and switch to Industry B (hotel)
    await goBack(page); // Back to Step 3
    await goBack(page); // Back to Step 2
    
    // Select different industry
    await completeStep2(page, "hotel");
    await completeStep3(page);
    
    // Debug panel should remain visible
    await waitForDebugPanel(page);
    
    // Wait for new pricing
    await expectPricingStatus(page, ["pending", "ok"], 5000);
    
    // Capture snapshot from Industry B
    const snap2 = await getSnapshotId(page);
    
    // CRITICAL: snapshotId must differ (industry is part of hash)
    // Note: If snap1 was "null" (still loading), snap2 must not be null
    if (snap1 !== "null") {
      expect(snap2).not.toBe(snap1);
    }
    expect(snap2).not.toBe("null");
    expect(snap2.length).toBeGreaterThan(5);
  });
});

// ============================================================================
// SMOKE TEST 5: Timeout behavior (watchdog truthfulness)
// ============================================================================
test.describe("Smoke 5 — Timeout behavior (watchdog)", () => {
  test("Timeouts resolve to stable state, late returns ignored", async ({ page }) => {
    // GUARDRAIL A: ?debug=1 for auto-visible panel + slow_timeout mock
    await page.goto(wizardUrl("slow_timeout"));
    
    // GUARDRAIL B: Verify mock mode is active
    await assertMockMode(page, "slow_timeout");
    
    // Complete wizard flow
    await completeStep1(page);
    await completeStep2(page, "hotel");
    await completeStep3(page);
    
    // Debug panel should already be visible (via ?debug=1)
    await waitForDebugPanel(page);
    
    // Should enter loading state
    await expectPricingStatus(page, "pending", 3000);
    
    // Wait for timeout (watchdog at ~7.5s, wait up to 12s)
    await expectPricingStatus(page, "timed_out", 12000);
    
    // Financial fields should remain null (monotonic merge)
    await expect(page.locator(SEL.pricingComplete)).toContainText("false");
    
    // Timeout message should be visible
    await expect(page.locator('text=/timed out|timeout/i').first()).toBeVisible();
    
    // Retry button should be available
    await expect(page.locator('button:has-text("Retry")').first()).toBeVisible();
    
    // If late success arrives (after ~20s), it should be ignored
    // The status should remain "timed_out", not flip to "ready"
    // (This is enforced by requestKey guard, not timeout flag)
  });
});

// ============================================================================
// SMOKE TEST 6: Snapshot freeze & reprice semantics
// ============================================================================
test.describe("Smoke 6 — Snapshot freeze & reprice semantics", () => {
  test("Pricing snapshot does not silently change", async ({ page }) => {
    // GUARDRAIL A: ?debug=1 for auto-visible panel
    await page.goto(wizardUrl("ok"));
    
    // GUARDRAIL B: Verify mock mode is active
    await assertMockMode(page, "ok");
    
    // Complete wizard flow
    await completeStep1(page);
    await completeStep2(page, "hotel");
    await completeStep3(page);
    
    // Wait for pricing to complete
    await waitForDebugPanel(page);
    await expectPricingStatus(page, "ok", 15000);
    
    // Record the snapshotId
    const snap1 = await getSnapshotId(page);
    expect(snap1).not.toBe("null");
    
    // Simulate page navigation away and back (re-render)
    await page.goto(wizardUrl("ok"));
    await page.goBack();
    
    // Wait for page to settle
    await page.waitForTimeout(1000);
    
    // Debug panel should auto-show again
    await waitForDebugPanel(page);
    
    // snapshotId should still be the same (freeze doctrine)
    const snap2 = await getSnapshotId(page);
    expect(snap2).toBe(snap1);
  });

  test("Explicit reprice generates new snapshotId", async ({ page }) => {
    // GUARDRAIL A: ?debug=1 for auto-visible panel
    await page.goto(wizardUrl("ok"));
    
    // GUARDRAIL B: Verify mock mode is active
    await assertMockMode(page, "ok");
    
    // Complete wizard flow
    await completeStep1(page);
    await completeStep2(page, "hotel");
    await completeStep3(page);
    
    // Wait for pricing to complete
    await waitForDebugPanel(page);
    await expectPricingStatus(page, "ok", 15000);
    
    // Record initial snapshotId
    const snap1 = await getSnapshotId(page);
    
    // Go back and change an input (triggers reprice)
    await goBack(page);
    
    // Change something that affects the snapshot
    const numberInput = page.locator('input[type="number"]').first();
    if (await numberInput.isVisible()) {
      const currentVal = await numberInput.inputValue();
      const newVal = String(Number(currentVal) + 50 || 150);
      await numberInput.fill(newVal);
    }
    
    // Submit again
    await completeStep3(page);
    
    // Wait for new pricing
    await waitForDebugPanel(page);
    await expectPricingStatus(page, "ok", 15000);
    
    // New snapshotId should be different (deterministic: different inputs → different ID)
    const snap2 = await getSnapshotId(page);
    expect(snap2).not.toBe(snap1);
    expect(snap2.length).toBeGreaterThan(5);
  });
});
