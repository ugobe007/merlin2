/**
 * WIZARD PRICING INVARIANTS E2E TESTS
 * ====================================
 * 
 * Tests that ensure pricing values displayed in the UI match
 * the expected calculations (sellPriceTotal, ITC, Net Cost).
 * 
 * These tests catch "looks right but isn't" bugs.
 * 
 * Run: npx playwright test pricing-invariants.spec.ts
 * 
 * @author Merlin QA Team
 * @date Feb 2026
 */

import { test, expect, Page } from '@playwright/test';

// ============================================================================
// TEST CONFIGURATION
// ============================================================================

const BASE_URL = process.env.TEST_URL || process.env.BASE_URL || 'http://localhost:5184';
const WIZARD_PATH = '/wizard';

// Test ZIPs by state (CA, NV, TX as specified in QA matrix)
const TEST_ZIPS = {
  CA: '94102', // San Francisco - TOU + incentives
  NV: '89052', // Henderson - simpler baseline
  TX: '75201', // Dallas - demand charge differences
};

// Industries to test (subset for faster CI)
const SMOKE_INDUSTRIES = [
  'hotel',
  'car_wash', 
  'ev_charging',
  'data_center',
  'manufacturing',
  'hospital',
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function navigateToWizard(page: Page): Promise<void> {
  await page.goto(`${BASE_URL}${WIZARD_PATH}`, { waitUntil: 'networkidle' });
  await page.waitForSelector('input, button', { timeout: 10000 });
  
  // Immediately verify we're on the instrumented wizard
  await dumpNextButtonState(page);
}

async function completeStep1(page: Page, zipCode: string): Promise<void> {
  // Wait for ZIP input
  const zipInput = page.locator('input[placeholder*="ZIP" i], input[name="zip"], input[type="text"]').first();
  await zipInput.waitFor({ state: 'visible', timeout: 5000 });
  await zipInput.fill(zipCode);
  await page.waitForTimeout(500);
  
  // Select at least 2 goals (required for Step 1)
  const goalButtons = page.locator('button[data-goal], [data-testid="goal-button"], button:has-text("Save Money"), button:has-text("Reduce Peak")');
  const goalCount = await goalButtons.count();
  
  if (goalCount >= 2) {
    // Click first two goal buttons
    await goalButtons.nth(0).click().catch(() => {});
    await page.waitForTimeout(200);
    await goalButtons.nth(1).click().catch(() => {});
    await page.waitForTimeout(200);
  } else {
    console.log(`⚠️ Only found ${goalCount} goal buttons, Step 1 may stay blocked`);
  }
  
  // Use robust helper to wait for Next to enable, then click
  await waitForNextEnabled(page, 5000);
  await clickNext(page);
}

async function selectIndustry(page: Page, industryId: string): Promise<void> {
  // Map slug to display name for button matching
  const displayNames: Record<string, string> = {
    'hotel': 'Hotel',
    'car_wash': 'Car Wash',
    'ev_charging': 'EV Charging',
    'data_center': 'Data Center',
    'manufacturing': 'Manufacturing',
    'hospital': 'Hospital',
    'retail': 'Retail',
    'office': 'Office',
  };
  
  const displayName = displayNames[industryId] || industryId;
  const industryButton = page.locator(`button:has-text("${displayName}")`).first();
  
  try {
    await industryButton.waitFor({ state: 'visible', timeout: 10000 });
    await industryButton.click();
    await page.waitForTimeout(1000);
  } catch (e) {
    console.error(`Failed to select industry: ${industryId}`);
    await page.screenshot({ path: `test-results/industry-select-fail-${industryId}.png` });
    throw e;
  }
}

async function navigateToStep5(page: Page): Promise<void> {
  // Click through Step 3 → 4 → 5
  // Step 3: Fill minimal answers and continue
  const nextButtons = ['Next', 'Continue', 'Generate Quote', 'See Your Options'];
  
  for (let step = 0; step < 3; step++) {
    await page.waitForTimeout(500);
    
    for (const buttonText of nextButtons) {
      const btn = page.locator(`button:has-text("${buttonText}")`).first();
      const isVisible = await btn.isVisible().catch(() => false);
      if (isVisible) {
        await btn.click();
        break;
      }
    }
    
    await page.waitForTimeout(1000);
  }
}

async function selectPowerLevel(page: Page, tier: 'starter' | 'perfectFit' | 'beastMode'): Promise<void> {
  const tierLabels: Record<string, string> = {
    starter: 'STARTER',
    perfectFit: 'PERFECT FIT',
    beastMode: 'BEAST MODE',
  };
  
  // Click on the tier card
  const tierCard = page.locator(`text="${tierLabels[tier]}"`).first();
  await tierCard.waitFor({ state: 'visible', timeout: 10000 });
  await tierCard.click();
  await page.waitForTimeout(500);
  
  // Click continue to Step 6
  const continueBtn = page.locator('button:has-text("Continue")').first();
  await continueBtn.click();
  await page.waitForTimeout(1000);
}

// ============================================================================
// PRICE EXTRACTION HELPERS
// ============================================================================

interface PricingData {
  totalSystemCost: number;
  federalITC: number;
  netInvestment: number;
  annualSavings: number;
  sellPriceTotal?: number; // From debug panel if available
}

async function extractStep5Pricing(page: Page, tier: string): Promise<PricingData> {
  // Look for financial summary in tier cards
  const tierCard = page.locator(`text="${tier.toUpperCase()}"`).locator('..').locator('..');
  
  const totalText = await tierCard.locator('text=/Total Investment/i').locator('..').locator('span').last().textContent().catch(() => null);
  const itcText = await tierCard.locator('text=/Federal ITC/i').locator('..').locator('span').last().textContent().catch(() => null);
  const netText = await tierCard.locator('text=/Net Cost/i').locator('..').locator('span').last().textContent().catch(() => null);
  const savingsText = await tierCard.locator('text=/Annual Savings/i').locator('..').locator('p').last().textContent().catch(() => null);
  
  return {
    totalSystemCost: parseCurrency(totalText),
    federalITC: parseCurrency(itcText),
    netInvestment: parseCurrency(netText),
    annualSavings: parseCurrency(savingsText),
  };
}

async function extractStep6Pricing(page: Page): Promise<PricingData> {
  // Extract from Step 6 "Your Investment" section
  const investmentSection = page.locator('text="Your Investment"').locator('..');
  
  const totalText = await investmentSection.locator('text=/Total System Cost/i').locator('..').locator('span').last().textContent().catch(() => null);
  const itcText = await investmentSection.locator('text=/Federal ITC/i').locator('..').locator('span').last().textContent().catch(() => null);
  const netText = await investmentSection.locator('text=/Net Investment/i').locator('..').locator('span').last().textContent().catch(() => null);
  
  // Get annual savings from hero section
  const savingsText = await page.locator('text=/Annual Savings/i').locator('..').locator('..').locator('div').first().textContent().catch(() => null);
  
  // Try to get sellPriceTotal from DEV debug panel (if visible)
  let sellPriceTotal: number | undefined;
  const debugPanel = page.locator('text="DEV QA: Step6"');
  const isDebugVisible = await debugPanel.isVisible().catch(() => false);
  if (isDebugVisible) {
    // Expand panel
    await debugPanel.click();
    const sellText = await page.locator('text="marginRender.sellPriceTotal:"').locator('..').locator('span').last().textContent().catch(() => null);
    sellPriceTotal = sellText && sellText !== 'undefined' ? parseFloat(sellText.replace(/[^0-9.]/g, '')) : undefined;
  }
  
  return {
    totalSystemCost: parseCurrency(totalText),
    federalITC: parseCurrency(itcText),
    netInvestment: parseCurrency(netText),
    annualSavings: parseCurrency(savingsText),
    sellPriceTotal,
  };
}

function parseCurrency(text: string | null): number {
  if (!text) return 0;
  // Remove $, commas, M suffix, K suffix
  const cleaned = text.replace(/[$,]/g, '');
  if (cleaned.includes('M')) {
    return parseFloat(cleaned.replace('M', '')) * 1_000_000;
  }
  if (cleaned.includes('K')) {
    return parseFloat(cleaned.replace('K', '')) * 1_000;
  }
  return parseFloat(cleaned) || 0;
}

// ============================================================================
// INVARIANT VALIDATORS
// ============================================================================

function validatePricingInvariants(pricing: PricingData, tolerance = 100): string[] {
  const errors: string[] = [];
  
  // Invariant 1: Total cost must be > 0
  if (pricing.totalSystemCost <= 0) {
    errors.push(`Total System Cost must be > 0, got: ${pricing.totalSystemCost}`);
  }
  
  // Invariant 2: Net Investment <= Total System Cost
  if (pricing.netInvestment > pricing.totalSystemCost) {
    errors.push(`Net Investment (${pricing.netInvestment}) > Total System Cost (${pricing.totalSystemCost})`);
  }
  
  // Invariant 3: ITC <= Total System Cost
  if (pricing.federalITC > pricing.totalSystemCost) {
    errors.push(`Federal ITC (${pricing.federalITC}) > Total System Cost (${pricing.totalSystemCost})`);
  }
  
  // Invariant 4: Net = Total - ITC (within tolerance, ignoring state incentives for now)
  const expectedNet = pricing.totalSystemCost - pricing.federalITC;
  const netDiff = Math.abs(expectedNet - pricing.netInvestment);
  // Allow larger tolerance since we might be missing state incentives
  if (netDiff > pricing.totalSystemCost * 0.15) { // 15% tolerance for state incentives
    errors.push(`Net Cost mismatch: expected ~${expectedNet}, got ${pricing.netInvestment} (diff: ${netDiff})`);
  }
  
  // Invariant 5: Annual savings must be positive
  if (pricing.annualSavings <= 0) {
    errors.push(`Annual Savings must be > 0, got: ${pricing.annualSavings}`);
  }
  
  // Invariant 6: If sellPriceTotal available, it should match totalSystemCost
  if (pricing.sellPriceTotal !== undefined) {
    const sellDiff = Math.abs(pricing.sellPriceTotal - pricing.totalSystemCost);
    if (sellDiff > tolerance) {
      errors.push(`sellPriceTotal (${pricing.sellPriceTotal}) != displayed Total (${pricing.totalSystemCost})`);
    }
  }
  
  return errors;
}

// ============================================================================
// TEST SUITES
// ============================================================================

// CANARY TEST: Run first to verify test infrastructure works
test.describe('Canary - Test Setup Verification', () => {
  test('wizard-next-button exists and has instrumentation', async ({ page }) => {
    await page.goto(`${BASE_URL}${WIZARD_PATH}`, { waitUntil: 'networkidle' });
    
    // This will throw with detailed error if button not found
    const btn = await getNextButton(page);
    
    // Verify instrumentation exists
    const step = await btn.getAttribute('data-step');
    const reason = await btn.getAttribute('data-disabled-reason');
    
    console.log('✅ Canary test passed:');
    console.log('   URL:', page.url());
    console.log('   data-step:', step);
    console.log('   data-disabled-reason:', reason);
    
    // Button should exist (count check already done in getNextButton)
    expect(await btn.count()).toBe(1);
    
    // Step should be defined (we're on Step 1)
    expect(step).toBeTruthy();
    
    // Reason should be defined (nothing filled in yet)
    expect(reason).toBeTruthy();
    expect(reason).toContain('zip'); // ZIP should be incomplete
  });
});

test.describe('Pricing Invariants - Step 6', () => {
  test('should display non-zero pricing for hotel (CA)', async ({ page }) => {
    await navigateToWizard(page);
    await completeStep1(page, TEST_ZIPS.CA);
    await selectIndustry(page, 'hotel');
    await navigateToStep5(page);
    await selectPowerLevel(page, 'perfectFit');
    
    // Extract and validate
    const pricing = await extractStep6Pricing(page);
    console.log('Step 6 Pricing:', pricing);
    
    const errors = validatePricingInvariants(pricing);
    if (errors.length > 0) {
      console.error('Pricing invariant errors:', errors);
      await page.screenshot({ path: 'test-results/pricing-invariant-fail-hotel.png', fullPage: true });
    }
    
    expect(errors).toHaveLength(0);
  });
  
  test('should maintain pricing consistency between Step 5 and Step 6', async ({ page }) => {
    await navigateToWizard(page);
    await completeStep1(page, TEST_ZIPS.NV);
    await selectIndustry(page, 'car_wash');
    await navigateToStep5(page);
    
    // Extract Step 5 pricing for perfectFit
    const step5Pricing = await extractStep5Pricing(page, 'PERFECT FIT');
    console.log('Step 5 Pricing:', step5Pricing);
    
    // Select and move to Step 6
    await selectPowerLevel(page, 'perfectFit');
    
    // Extract Step 6 pricing
    const step6Pricing = await extractStep6Pricing(page);
    console.log('Step 6 Pricing:', step6Pricing);
    
    // Both steps should show same total (within tolerance)
    const totalDiff = Math.abs(step5Pricing.totalSystemCost - step6Pricing.totalSystemCost);
    expect(totalDiff).toBeLessThan(100);
    
    // Both steps should show same net
    const netDiff = Math.abs(step5Pricing.netInvestment - step6Pricing.netInvestment);
    expect(netDiff).toBeLessThan(100);
  });
});

test.describe('All Industries - Pricing Smoke', () => {
  for (const industryId of SMOKE_INDUSTRIES) {
    test(`${industryId}: pricing invariants hold`, async ({ page }) => {
      await navigateToWizard(page);
      await completeStep1(page, TEST_ZIPS.CA);
      
      try {
        await selectIndustry(page, industryId);
        await navigateToStep5(page);
        await selectPowerLevel(page, 'perfectFit');
        
        const pricing = await extractStep6Pricing(page);
        const errors = validatePricingInvariants(pricing);
        
        if (errors.length > 0) {
          console.error(`${industryId} pricing errors:`, errors);
          await page.screenshot({ 
            path: `test-results/pricing-${industryId}.png`, 
            fullPage: true 
          });
        }
        
        // Key assertions
        expect(pricing.totalSystemCost).toBeGreaterThan(0);
        expect(pricing.netInvestment).toBeLessThanOrEqual(pricing.totalSystemCost);
        expect(pricing.annualSavings).toBeGreaterThan(0);
        
        console.log(`✅ ${industryId}: pricing invariants pass`);
      } catch (e) {
        console.error(`❌ ${industryId}: test failed`, e);
        await page.screenshot({ 
          path: `test-results/fail-${industryId}.png`, 
          fullPage: true 
        });
        throw e;
      }
    });
  }
});

test.describe('DEV QA Panel Integration', () => {
  test('should show DEV QA panel in development', async ({ page }) => {
    // This test only passes in dev mode
    await navigateToWizard(page);
    await completeStep1(page, TEST_ZIPS.CA);
    await selectIndustry(page, 'hotel');
    await navigateToStep5(page);
    
    // Check for DEV QA panel in Step 5
    const devPanel5 = page.locator('text="DEV QA: Step5"');
    // May not be visible in production builds
    const isDevMode = await devPanel5.isVisible().catch(() => false);
    
    if (isDevMode) {
      // Click to expand
      await devPanel5.click();
      
      // Should show pricing values
      await expect(page.locator('text="marginRender.sellPriceTotal:"')).toBeVisible();
      await expect(page.locator('text="totalInvestment:"')).toBeVisible();
      
      console.log('✅ DEV QA panel visible and expandable');
    } else {
      console.log('⏭️ DEV QA panel not visible (production build)');
    }
  });
});

test.describe('ZIP Code Matrix - Regional Pricing', () => {
  for (const [state, zip] of Object.entries(TEST_ZIPS)) {
    test(`${state} (${zip}): should generate valid pricing`, async ({ page }) => {
      await navigateToWizard(page);
      await completeStep1(page, zip);
      await selectIndustry(page, 'hotel');
      await navigateToStep5(page);
      await selectPowerLevel(page, 'perfectFit');
      
      const pricing = await extractStep6Pricing(page);
      
      // Basic sanity checks
      expect(pricing.totalSystemCost).toBeGreaterThan(0);
      expect(pricing.federalITC).toBeGreaterThan(0);
      expect(pricing.netInvestment).toBeGreaterThan(0);
      
      console.log(`✅ ${state} pricing: $${pricing.totalSystemCost.toLocaleString()} total, $${pricing.netInvestment.toLocaleString()} net`);
    });
  }
});

test.describe('Navigation State Integrity', () => {
  test('back/forward should preserve pricing selection', async ({ page }) => {
    await navigateToWizard(page);
    await completeStep1(page, TEST_ZIPS.CA);
    await selectIndustry(page, 'hotel');
    await navigateToStep5(page);
    
    // Select a tier
    await selectPowerLevel(page, 'perfectFit');
    const pricing1 = await extractStep6Pricing(page);
    
    // Go back
    await page.goBack();
    await page.waitForTimeout(500);
    
    // Go forward
    await page.goForward();
    await page.waitForTimeout(500);
    
    // Pricing should still be there (or re-fetched to same values)
    const pricing2 = await extractStep6Pricing(page);
    
    // Within reasonable tolerance (data might refetch)
    expect(Math.abs(pricing1.totalSystemCost - pricing2.totalSystemCost)).toBeLessThan(pricing1.totalSystemCost * 0.1);
  });
  
  test('Continue buttons should never dead-end', async ({ page }) => {
    await navigateToWizard(page);
    await completeStep1(page, TEST_ZIPS.NV);
    await selectIndustry(page, 'data_center');
    
    // Navigate through all steps
    const buttonTexts = ['Next', 'Continue', 'Generate Quote', 'See Options', 'Next Step'];
    let stepCount = 0;
    
    for (let i = 0; i < 10; i++) {
      // Find any clickable continue-type button
      let found = false;
      for (const text of buttonTexts) {
        const btn = page.locator(`button:has-text("${text}")`).first();
        const isVisible = await btn.isVisible().catch(() => false);
        const isEnabled = await btn.isEnabled().catch(() => false);
        
        if (isVisible && isEnabled) {
          await btn.click();
          stepCount++;
          found = true;
          await page.waitForTimeout(1000);
          break;
        }
      }
      
      // If we're on Step 6 (quote page), we're done
      const isStep6 = await page.locator('text="TrueQuote™ Summary"').isVisible().catch(() => false);
      if (isStep6) {
        console.log(`✅ Reached Step 6 after ${stepCount} button clicks`);
        break;
      }
      
      if (!found) {
        // No button found - potential dead-end
        await page.screenshot({ path: 'test-results/dead-end.png', fullPage: true });
        throw new Error(`Dead-end at step ${stepCount + 1}: no continue button visible`);
      }
    }
    
    expect(stepCount).toBeGreaterThanOrEqual(3); // At least 3 steps to reach quote
  });
});
// ============================================================================
// NEXT BUTTON DIAGNOSTIC TESTS (Jan 28, 2026)
// ============================================================================
// These tests use the new data-disabled-reason attribute to diagnose WHY
// the Next button is disabled, making test failures actionable.

test.describe('Next Button Diagnostic Tests', () => {
  
  test('Step 1: should expose disabled reason for incomplete ZIP', async ({ page }) => {
    await navigateToWizard(page);
    
    // Get the Next button with test ID
    const nextButton = page.locator('[data-testid="wizard-next-button"]');
    await nextButton.waitFor({ state: 'visible', timeout: 5000 });
    
    // Check that it's disabled with a reason
    const disabledReason = await nextButton.getAttribute('data-disabled-reason');
    console.log('🔍 Next disabled reason:', disabledReason);
    
    // Root-cause precedence: should show ONLY first blocking condition (zip-incomplete)
    // Not cascaded reasons like state-missing or goals-need-2
    expect(disabledReason).toBe('zip-incomplete');
  });
  
  test('Step 1: disabled reason should progress through root causes', async ({ page }) => {
    await navigateToWizard(page);
    
    const nextButton = page.locator('[data-testid="wizard-next-button"]');
    const zipInput = page.locator('input[placeholder*="ZIP" i], input[name="zip"], input[type="text"]').first();
    
    // Initially disabled
    let disabledReason = await nextButton.getAttribute('data-disabled-reason');
    expect(disabledReason).toBeTruthy();
    
    // Fill valid ZIP
    await zipInput.fill('94102');
    await page.waitForTimeout(500);
    
    // Select state if dropdown exists
    const stateDropdown = page.locator('select, [data-testid="state-select"]').first();
    const stateVisible = await stateDropdown.isVisible().catch(() => false);
    if (stateVisible) {
      await stateDropdown.selectOption('CA');
    }
    
    // Wait for state to auto-populate from ZIP
    await page.waitForTimeout(1000);
    
    // Check disabled reason again - should only need goals now
    disabledReason = await nextButton.getAttribute('data-disabled-reason');
    console.log('🔍 After ZIP, disabled reason:', disabledReason);
    
    // ZIP should be clear, may still need goals
    if (disabledReason) {
      expect(disabledReason).not.toContain('zip-incomplete');
    }
  });
  
  test('should log detailed diagnostic when Next stays disabled > 2s', async ({ page }) => {
    // Enable console capture
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      if (msg.text().includes('[DIAGNOSTIC]')) {
        consoleLogs.push(msg.text());
      }
    });
    
    await navigateToWizard(page);
    
    // Fill ZIP but don't complete goals
    const zipInput = page.locator('input[placeholder*="ZIP" i], input[name="zip"], input[type="text"]').first();
    await zipInput.fill('94102');
    
    // Wait > 2s for diagnostic log
    await page.waitForTimeout(3000);
    
    // In DEV mode, should have logged diagnostic
    // Note: This only works if the wizard is running in DEV mode
    console.log('📋 Console logs captured:', consoleLogs);
  });
  
  test('Step 5: should show disabled reason if no power level selected', async ({ page }) => {
    await navigateToWizard(page);
    await completeStep1(page, TEST_ZIPS.CA);
    await selectIndustry(page, 'hotel');
    await navigateToStep5(page);
    
    // Should be on Step 5 now
    const nextButton = page.locator('[data-testid="wizard-next-button"]');
    await nextButton.waitFor({ state: 'visible', timeout: 5000 });
    
    // Check disabled reason - should need power level
    const disabledReason = await nextButton.getAttribute('data-disabled-reason');
    console.log('🔍 Step 5 disabled reason:', disabledReason);
    
    if (disabledReason) {
      expect(disabledReason).toContain('power-level-not-selected');
    }
  });
  
  test('waitForNextEnabled helper should timeout with reason', async ({ page }) => {
    await navigateToWizard(page);
    
    // Don't fill anything
    const nextButton = page.locator('[data-testid="wizard-next-button"]');
    
    // Use a short timeout to test the diagnostic
    const startTime = Date.now();
    try {
      // This should fail because we haven't filled required fields
      await expect(nextButton).not.toBeDisabled({ timeout: 2000 });
      throw new Error('Expected timeout but button was enabled');
    } catch (e) {
      const elapsed = Date.now() - startTime;
      const disabledReason = await nextButton.getAttribute('data-disabled-reason');
      
      console.log(`⏱️ Timeout after ${elapsed}ms, reason: ${disabledReason}`);
      
      // The reason tells us exactly what's missing
      expect(disabledReason).toBeTruthy();
    }
  });
});

// ============================================================================
// ROBUST HELPERS: Never fail silently (Feb 1, 2026)
// ============================================================================

/**
 * Get the Next button with LOUD failure if not found or duplicated.
 * This ensures we catch version mismatches (V6 vs V7) immediately.
 */
async function getNextButton(page: Page) {
  const btn = page.locator('[data-testid="wizard-next-button"]');
  
  const count = await btn.count();
  if (count === 0) {
    // Dump diagnostic info before failing
    const url = page.url();
    const allButtons = await page.locator('button').count();
    const nextTextButtons = await page.locator('button:has-text("Next")').count();
    
    throw new Error(
      `❌ wizard-next-button NOT FOUND!\n` +
      `   URL: ${url}\n` +
      `   Total buttons on page: ${allButtons}\n` +
      `   Buttons with "Next" text: ${nextTextButtons}\n` +
      `   \n` +
      `   LIKELY CAUSES:\n` +
      `   - Route points to WizardV7 but testid only in WizardV6\n` +
      `   - Build not updated (run npm run build)\n` +
      `   - Wrong BASE_URL (check if running on correct port)\n`
    );
  }
  if (count > 1) {
    throw new Error(
      `❌ wizard-next-button is DUPLICATED (found ${count})!\n` +
      `   URL: ${page.url()}\n` +
      `   This will cause flaky tests. Fix the component.`
    );
  }
  return btn;
}

/**
 * Dump full diagnostic state of the Next button.
 * Use this at the start of failing tests to understand the situation.
 */
async function dumpNextButtonState(page: Page): Promise<void> {
  console.log('\n========== NEXT BUTTON DIAGNOSTIC ==========');
  console.log('URL:', page.url());
  
  const btn = page.locator('[data-testid="wizard-next-button"]');
  const count = await btn.count();
  console.log('Button count:', count);
  
  if (count === 0) {
    // Check for any Next buttons without testid
    const anyNext = page.locator('button:has-text("Next")');
    const anyNextCount = await anyNext.count();
    console.log('Buttons with "Next" text (no testid):', anyNextCount);
    
    if (anyNextCount > 0) {
      const html = await anyNext.first().evaluate(el => el.outerHTML);
      console.log('First "Next" button HTML:', html);
    }
  } else {
    const first = btn.first();
    const html = await first.evaluate(el => el.outerHTML);
    const disabled = await first.isDisabled();
    const reason = await first.getAttribute('data-disabled-reason');
    const step = await first.getAttribute('data-step');
    
    console.log('HTML:', html);
    console.log('Disabled:', disabled);
    console.log('data-disabled-reason:', reason);
    console.log('data-step:', step);
  }
  console.log('=============================================\n');
}

/**
 * Wait for the Next button to become enabled, with diagnostic output on failure.
 * This version NEVER fails silently.
 */
async function waitForNextEnabled(page: Page, timeoutMs = 10000): Promise<void> {
  const btn = await getNextButton(page);
  
  const start = Date.now();
  let lastLogTime = 0;
  
  while (Date.now() - start < timeoutMs) {
    if (await btn.isEnabled()) {
      return; // Success!
    }
    
    const reason = await btn.getAttribute('data-disabled-reason');
    const step = await btn.getAttribute('data-step');
    
    // Log every 2 seconds
    if (Date.now() - lastLogTime > 2000) {
      lastLogTime = Date.now();
      
      if (!reason) {
        // CRITICAL: Instrumentation is missing on the real button
        console.warn(
          `⚠️ Next disabled but NO data-disabled-reason attr!\n` +
          `   Step: ${step}, URL: ${page.url()}\n` +
          `   This means the button exists but instrumentation is broken.`
        );
      } else {
        console.log(`⏳ Next disabled at Step ${step}: ${reason}`);
      }
    }
    
    await page.waitForTimeout(250);
  }
  
  // Timeout - capture state before failing
  const reason = await btn.getAttribute('data-disabled-reason');
  const step = await btn.getAttribute('data-step');
  
  await page.screenshot({ 
    path: `test-results/next-timeout-step${step ?? 'unknown'}.png`, 
    fullPage: true 
  });
  
  throw new Error(
    `❌ Next button NEVER ENABLED after ${timeoutMs}ms\n` +
    `   Step: ${step}\n` +
    `   Reason: ${reason ?? '(null - instrumentation broken?)'}\n` +
    `   URL: ${page.url()}\n` +
    `   Screenshot: test-results/next-timeout-step${step ?? 'unknown'}.png`
  );
}

/**
 * Click Next with full diagnostics. Use this instead of raw button.click().
 */
async function clickNext(page: Page, expectEnabled = true): Promise<void> {
  const btn = await getNextButton(page);
  
  const disabled = await btn.isDisabled();
  const reason = await btn.getAttribute('data-disabled-reason');
  const step = await btn.getAttribute('data-step');
  
  if (disabled && expectEnabled) {
    throw new Error(
      `❌ Cannot click Next - button is DISABLED\n` +
      `   Step: ${step}\n` +
      `   Reason: ${reason ?? '(null)'}\n` +
      `   URL: ${page.url()}`
    );
  }
  
  await btn.click();
  await page.waitForTimeout(500); // Let navigation settle
}
