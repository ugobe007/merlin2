/**
 * WIZARD STEP 2 → STEP 3 NAVIGATION SMOKE TEST
 * ============================================
 * 
 * Tests the critical navigation flow from Step 2 (Industry Selection) to Step 3 (Facility Details)
 * 
 * Critical Test: Verifies that clicking continue on Step 2 navigates to Step 3,
 * NOT to AdvancedConfigModal
 */

import { test, expect } from '@playwright/test';

test.describe('Wizard Step 2 → Step 3 Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate directly to wizard
    await page.goto('http://localhost:5177/wizard');
    
    // Wait for app to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Skip intro if present
    const skipButton = page.locator('button:has-text("Start Building")').or(page.locator('button:has-text("Skip")'));
    if (await skipButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await skipButton.click();
      await page.waitForTimeout(500);
    }
  });

  test('Step 2: Component renders correctly', async ({ page }) => {
    // Navigate to Step 2 (Industry Selection)
    // First complete Step 1 if needed
    await completeStep1(page);
    
    // Wait for Step 2 to be visible - try multiple selectors
    await page.waitForSelector('text=Industry Selection', { timeout: 5000 }).catch(async () => {
      // Try alternative selectors
      await page.waitForSelector('text=Step 2 of 5', { timeout: 5000 });
    });
    
    // Verify MerlinGreeting panel is visible
    const merlinGreeting = page.locator('text=Hi! I\'m Merlin, your energy advisor');
    await expect(merlinGreeting).toBeVisible();
    
    // Verify step number
    const stepBadge = page.locator('text=Step 2 of 5');
    await expect(stepBadge).toBeVisible();
    
    // Verify industry selection is visible
    const industrySection = page.locator('text=Industry').or(page.locator('[data-testid="industry-selection"]'));
    await expect(industrySection.first()).toBeVisible();
  });

  test('Step 2: Industry selection enables continue button', async ({ page }) => {
    await completeStep1(page);
    
    // Wait for Step 2
    await page.waitForSelector('text=Industry Selection', { timeout: 5000 });
    
    // Select an industry (try to find a clickable industry card)
    const industryCard = page.locator('text=Hotel').or(page.locator('text=Car Wash')).or(page.locator('[data-testid="industry-card"]')).first();
    
    if (await industryCard.isVisible({ timeout: 3000 }).catch(() => false)) {
      await industryCard.click();
      await page.waitForTimeout(500);
      
      // Verify size slider appears
      const sizeSlider = page.locator('input[type="range"]').first();
      await expect(sizeSlider).toBeVisible({ timeout: 3000 });
      
      // Verify right arrow button becomes enabled
      const rightArrow = page.locator('button[aria-label*="Continue"]').or(page.locator('button:has-text("Continue")')).or(page.locator('[data-testid="next-button"]'));
      await expect(rightArrow).toBeEnabled({ timeout: 2000 });
    }
  });

  test('Step 2 → Step 3: Navigation works correctly (CRITICAL)', async ({ page }) => {
    // Set up console log monitoring
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      const text = msg.text();
      consoleLogs.push(text);
      if (text.includes('🎯') || text.includes('🔥')) {
        console.log(`[Browser Console] ${text}`);
      }
    });
    
    await completeStep1(page);
    
    // Wait for Step 2
    await page.waitForSelector('text=Industry Selection', { timeout: 5000 });
    
    // Select industry
    const industryCard = page.locator('text=Hotel').or(page.locator('text=Car Wash')).or(page.locator('[data-testid="industry-card"]')).first();
    
    if (await industryCard.isVisible({ timeout: 3000 }).catch(() => false)) {
      await industryCard.click();
      await page.waitForTimeout(1000);
      
      // Adjust size slider if visible
      const sizeSlider = page.locator('input[type="range"]').first();
      if (await sizeSlider.isVisible({ timeout: 2000 }).catch(() => false)) {
        await sizeSlider.fill('100');
        await page.waitForTimeout(500);
      }
    }
    
    // Click right arrow to continue
    const rightArrow = page.locator('button[aria-label*="Continue"]').or(
      page.locator('button:has-text("Continue")')
    ).or(
      page.locator('button[aria-label*="Continue to"]')
    ).or(
      page.locator('button:right-of(text="Continue to Configuration")')
    );
    
    // Try multiple selectors for the right arrow
    let arrowFound = false;
    const arrowSelectors = [
      'button[aria-label*="Continue"]',
      'button:has-text("Continue")',
      'button[aria-label*="Continue to"]',
      '[data-testid="next-button"]',
      'button:right-of(text="Continue to Configuration")',
    ];
    
    for (const selector of arrowSelectors) {
      const arrow = page.locator(selector).last();
      if (await arrow.isVisible({ timeout: 1000 }).catch(() => false)) {
        await arrow.click();
        arrowFound = true;
        break;
      }
    }
    
    if (!arrowFound) {
      // Fallback: try clicking anywhere in the right side of the screen
      await page.mouse.click(page.viewportSize()!.width - 100, page.viewportSize()!.height / 2);
    }
    
    await page.waitForTimeout(3000); // Wait for navigation and transitions
    
    // Check console logs first
    const hasNavigationLogs = consoleLogs.some(log => 
      log.includes('🎯 [Step2IndustrySize] handleContinue') ||
      log.includes('🎯 [StreamlinedWizard] Step 2 onContinue') ||
      log.includes('🎯 [FACILITY] Continue clicked')
    );
    
    const hasAdvancedModalLogs = consoleLogs.some(log => 
      log.includes('🔥 ModalManager: onOpenAdvanced') ||
      log.includes('🔥 Setting showAdvancedQuoteBuilderModal')
    );
    
    // CRITICAL CHECK: Verify AdvancedConfigModal did NOT open
    if (hasAdvancedModalLogs) {
      test.fail('❌ FAIL: AdvancedConfigModal opened instead of Step 3! Check console logs.');
    }
    
    // Verify console logs show correct navigation
    expect(hasNavigationLogs).toBe(true);
    
    // Wait for any transition animations to complete
    await page.waitForTimeout(1000);
    
    // CRITICAL: Verify Step 3 displays (NOT AdvancedConfigModal)
    // Try multiple ways to detect Step 3
    const step3Indicators = [
      page.locator('text=Step 3 of 5'),
      page.locator('text=Facility Details'),
      page.locator('text=You just finished selecting your industry and size'),
      page.locator('text=Tell Us About Your Facility'),
    ];
    
    let step3Found = false;
    for (const indicator of step3Indicators) {
      try {
        await expect(indicator.first()).toBeVisible({ timeout: 3000 });
        step3Found = true;
        break;
      } catch {
        // Try next indicator
      }
    }
    
    // Verify AdvancedConfigModal is NOT visible
    const advancedModal = page.locator('text=Advanced Quote Configuration').or(
      page.locator('text=Pro Mode')
    ).or(
      page.locator('text=System Configuration')
    );
    
    const modalVisible = await advancedModal.first().isVisible({ timeout: 1000 }).catch(() => false);
    
    // Final assertions
    if (!step3Found && !modalVisible) {
      // Take screenshot for debugging
      await page.screenshot({ path: 'test-results/step3-not-found.png', fullPage: true });
      test.fail('❌ Step 3 not found and AdvancedConfigModal not visible. Check screenshot.');
    }
    
    if (modalVisible) {
      test.fail('❌ FAIL: AdvancedConfigModal is visible instead of Step 3!');
    }
    
    expect(step3Found).toBe(true);
    
    // Verify Step 3 has MerlinGreeting
    const step3Merlin = page.locator('text=Hi! I\'m Merlin, your energy advisor');
    await expect(step3Merlin.first()).toBeVisible({ timeout: 3000 });
    
    console.log('✅ PASS: Step 2 → Step 3 navigation successful');
  });

  test('Step 3: Component renders correctly', async ({ page }) => {
    await completeStep1(page);
    await completeStep2(page);
    
    // Wait for Step 3
    await page.waitForSelector('text=Facility Details', { timeout: 5000 });
    
    // Verify MerlinGreeting
    const merlinGreeting = page.locator('text=Hi! I\'m Merlin, your energy advisor');
    await expect(merlinGreeting).toBeVisible();
    
    // Verify step number
    const stepBadge = page.locator('text=Step 3 of 5');
    await expect(stepBadge).toBeVisible();
    
    // Verify facility questions/form is visible
    const facilityForm = page.locator('form').or(page.locator('[data-testid="facility-form"]'));
    await expect(facilityForm.first()).toBeVisible({ timeout: 3000 });
    
    // Verify collapsible bottom bar is visible (minimized)
    const bottomBar = page.locator('text=Expand Live Estimate').or(page.locator('text=Minimize'));
    await expect(bottomBar.first()).toBeVisible({ timeout: 3000 });
  });
});

// Helper function to complete Step 1
async function completeStep1(page: any) {
  // Wait for Step 1 - try multiple selectors
  try {
    await page.waitForSelector('text=Location & Goals', { timeout: 5000 });
  } catch {
    // Try alternative selectors
    await page.waitForSelector('text=Step 1 of 5', { timeout: 5000 });
    await page.waitForTimeout(1000);
  }
  
  // Select a state - try multiple approaches
  const stateSelect = page.locator('select').first();
  if (await stateSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
    const options = await stateSelect.locator('option').count();
    if (options > 1) {
      await stateSelect.selectOption({ index: 1 }); // Select first non-empty option
      await page.waitForTimeout(500);
    }
  } else {
    // Try clicking a state button if it's a button-based selector
    const stateButton = page.locator('button:has-text("California")').or(page.locator('button:has-text("Nevada")')).or(page.locator('button:has-text("Texas")')).first();
    if (await stateButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await stateButton.click();
      await page.waitForTimeout(500);
    }
  }
  
  // Select a goal
  const goalCard = page.locator('text=Save Money').or(page.locator('text=Save Money First')).or(page.locator('[data-testid="goal-card"]')).first();
  if (await goalCard.isVisible({ timeout: 3000 }).catch(() => false)) {
    await goalCard.click();
    await page.waitForTimeout(500);
  }
  
  // Click continue - try right arrow or continue button
  const rightArrow = page.locator('button[aria-label*="Continue"]').or(
    page.locator('button:has-text("Continue")')
  ).or(
    page.locator('button[aria-label*="Continue to"]')
  );
  
  // Try clicking right arrow (floating navigation)
  const floatingArrow = page.locator('button').filter({ has: page.locator('svg') }).last();
  if (await floatingArrow.isVisible({ timeout: 2000 }).catch(() => false)) {
    const isEnabled = await floatingArrow.isEnabled();
    if (isEnabled) {
      await floatingArrow.click();
      await page.waitForTimeout(1500);
      return;
    }
  }
  
  // Fallback to regular continue button
  if (await rightArrow.isVisible({ timeout: 2000 }).catch(() => false)) {
    await rightArrow.first().click();
    await page.waitForTimeout(1500);
  }
}

// Helper function to complete Step 2
async function completeStep2(page: any) {
  // Wait for Step 2
  await page.waitForSelector('text=Industry Selection', { timeout: 5000 });
  
  // Select an industry
  const industryCard = page.locator('text=Hotel').or(page.locator('text=Car Wash')).or(page.locator('[data-testid="industry-card"]')).first();
  if (await industryCard.isVisible({ timeout: 3000 }).catch(() => false)) {
    await industryCard.click();
    await page.waitForTimeout(1000);
    
    // Adjust size slider if visible
    const sizeSlider = page.locator('input[type="range"]').first();
    if (await sizeSlider.isVisible({ timeout: 2000 }).catch(() => false)) {
      await sizeSlider.fill('100');
      await page.waitForTimeout(500);
    }
  }
  
  // Click continue
  const continueButton = page.locator('button[aria-label*="Continue"]').or(page.locator('button:has-text("Continue")')).last();
  if (await continueButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await continueButton.click();
    await page.waitForTimeout(2000);
  }
}

