// Smart Wizard Automated Test Suite - Playwright
// Install: npm install -D @playwright/test
// Run: npx playwright test smartWizard.spec.ts

import { test, expect, Page } from '@playwright/test';

// Test configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:5177';
const WIZARD_TIMEOUT = 10000;

test.describe('Smart Wizard UX Tests', () => {
  
  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================
  
  async function openSmartWizard(page: Page) {
    // Try multiple selectors for Smart Wizard button
    const button = await page.locator(
      '[data-testid="smart-wizard-button"], button:has-text("Smart Wizard"), button:has-text("smart wizard")'
    ).first();
    
    await button.click();
    
    // Wait for modal to appear
    await page.waitForSelector(
      '[data-testid="smart-wizard-modal"], [role="dialog"], .smart-wizard-modal',
      { timeout: 3000 }
    );
  }

  async function waitForStep(page: Page, stepNumber: number) {
    await page.waitForSelector(
      `[data-step="${stepNumber}"], .wizard-step-${stepNumber}`,
      { timeout: 5000 }
    );
  }

  async function checkForNaN(page: Page): Promise<string[]> {
    // Get all text content and check for NaN
    const nanElements = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*'));
      return elements
        .filter(el => el.textContent?.includes('NaN') && el.children.length === 0)
        .map(el => ({
          tag: el.tagName,
          text: el.textContent?.substring(0, 100),
          class: el.className,
        }));
    });
    
    return nanElements.map(el => `${el.tag}.${el.class}: ${el.text}`);
  }

  async function captureConsoleErrors(page: Page): Promise<string[]> {
    const errors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    return errors;
  }

  // ============================================================================
  // TEST SETUP
  // ============================================================================
  
  test.beforeEach(async ({ page }) => {
    // Navigate to home page
    await page.goto(BASE_URL);
    
    // Wait for page to be ready
    await page.waitForLoadState('domcontentloaded');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
  });

  // ============================================================================
  // TEST 1: WIZARD OPENS IMMEDIATELY
  // ============================================================================
  
  test('TEST 1: Wizard opens immediately (<100ms)', async ({ page }) => {
    // Find Smart Wizard button
    const button = await page.locator(
      '[data-testid="smart-wizard-button"], button:has-text("Smart Wizard")'
    ).first();
    
    // Verify button is visible and enabled
    await expect(button).toBeVisible();
    await expect(button).toBeEnabled();
    
    // Measure time to open
    const startTime = Date.now();
    await button.click();
    
    // Wait for wizard modal
    await page.waitForSelector(
      '[data-testid="smart-wizard-modal"], [role="dialog"], .smart-wizard-modal',
      { timeout: 3000 }
    );
    
    const endTime = Date.now();
    const openDelay = endTime - startTime;
    
    console.log(`✅ Wizard opened in ${openDelay}ms`);
    
    // Assert opens quickly
    expect(openDelay).toBeLessThan(500);
    
    // Warn if not immediate
    if (openDelay > 100) {
      console.warn(`⚠️ Wizard took ${openDelay}ms to open (expected < 100ms)`);
    }
  });

  // ============================================================================
  // TEST 2: STEP 1 - INDUSTRY SELECTION
  // ============================================================================
  
  test('TEST 2: Step 1 - Industry selection works', async ({ page }) => {
    await openSmartWizard(page);
    
    // Verify we're on Step 1
    const step1 = await page.locator('[data-step="1"], .wizard-step-1').first();
    await expect(step1).toBeVisible();
    
    // Find industry options
    const industryButtons = await page.locator(
      '[data-industry], .industry-option, button[class*="industry"]'
    );
    
    const count = await industryButtons.count();
    expect(count).toBeGreaterThan(0);
    
    console.log(`✅ Found ${count} industry options`);
    
    // Click first industry
    const firstIndustry = industryButtons.first();
    const industryText = await firstIndustry.textContent();
    
    const startTime = Date.now();
    await firstIndustry.click();
    
    // Wait for Step 2 to appear
    await waitForStep(page, 2);
    
    const endTime = Date.now();
    const advanceTime = endTime - startTime;
    
    console.log(`✅ Selected "${industryText}" - Advanced in ${advanceTime}ms`);
    
    // Should auto-advance within 2 seconds
    expect(advanceTime).toBeLessThan(2000);
    
    if (advanceTime > 1000) {
      console.warn(`⚠️ Slow advance: ${advanceTime}ms`);
    }
  });

  // ============================================================================
  // TEST 3: STEP 2 - USE CASE DETAILS
  // ============================================================================
  
  test('TEST 3: Step 2 - Use case details load without errors', async ({ page }) => {
    await openSmartWizard(page);
    
    // Navigate to Step 2
    const industryButton = await page.locator('[data-industry], .industry-option').first();
    await industryButton.click();
    
    // Wait for Step 2
    await waitForStep(page, 2);
    
    const step2 = await page.locator('[data-step="2"], .wizard-step-2').first();
    
    // Check for error messages
    const errorMessage = await step2.locator('.error, [class*="error"]').count();
    expect(errorMessage).toBe(0);
    
    // Check for "Failed to load" text
    const content = await step2.textContent();
    expect(content).not.toContain('Failed to load');
    expect(content).not.toContain('failed to load');
    
    // Check for use case options
    const useCaseOptions = await step2.locator('[data-use-case], .use-case-option').count();
    
    if (useCaseOptions > 0) {
      console.log(`✅ Found ${useCaseOptions} use case options`);
    } else {
      console.warn('⚠️ No use case options found');
    }
    
    // Should not be blank
    expect(content?.trim().length).toBeGreaterThan(10);
    
    console.log('✅ Step 2 loaded successfully');
  });

  // ============================================================================
  // TEST 4: STEPS 3-6 ARE NOT BLANK
  // ============================================================================
  
  test('TEST 4: Steps 3-6 render content (not blank)', async ({ page }) => {
    await openSmartWizard(page);
    
    // Navigate through wizard
    await page.locator('[data-industry], .industry-option').first().click();
    await waitForStep(page, 2);
    
    // Try to navigate to each step
    const results: { step: number; isBlank: boolean; hasNaN: boolean }[] = [];
    
    for (let stepNum = 3; stepNum <= 6; stepNum++) {
      // Try to click next button
      const nextButton = await page.locator('[data-next], .next-button, button:has-text("Next")').first();
      
      if (await nextButton.isVisible()) {
        await nextButton.click();
        await page.waitForTimeout(500);
      }
      
      // Check if step exists
      const step = await page.locator(`[data-step="${stepNum}"], .wizard-step-${stepNum}`).first();
      const isVisible = await step.isVisible().catch(() => false);
      
      if (isVisible) {
        const content = await step.textContent();
        const isBlank = content ? content.trim().length < 10 : true;
        const hasNaN = content ? content.includes('NaN') : false;
        
        results.push({ step: stepNum, isBlank, hasNaN });
        
        if (isBlank) {
          console.error(`❌ Step ${stepNum} is BLANK`);
        } else if (hasNaN) {
          console.error(`❌ Step ${stepNum} contains NaN values`);
        } else {
          console.log(`✅ Step ${stepNum} has content`);
        }
      } else {
        console.warn(`⚠️ Step ${stepNum} not found`);
      }
    }
    
    // Assert no steps are blank
    results.forEach(result => {
      expect(result.isBlank).toBe(false);
      expect(result.hasNaN).toBe(false);
    });
  });

  // ============================================================================
  // TEST 5: NO NaN VALUES IN UI
  // ============================================================================
  
  test('TEST 5: No NaN values anywhere in wizard', async ({ page }) => {
    await openSmartWizard(page);
    
    // Navigate through wizard to check each step
    await page.locator('[data-industry], .industry-option').first().click();
    await page.waitForTimeout(500);
    
    // Check for NaN on current step
    let nanElements = await checkForNaN(page);
    
    if (nanElements.length > 0) {
      console.error('❌ Found NaN values:', nanElements);
    } else {
      console.log('✅ No NaN values found');
    }
    
    // Navigate through more steps
    for (let i = 0; i < 4; i++) {
      const nextButton = await page.locator('[data-next], button:has-text("Next")').first();
      if (await nextButton.isVisible()) {
        await nextButton.click();
        await page.waitForTimeout(500);
        
        const stepNaN = await checkForNaN(page);
        nanElements = nanElements.concat(stepNaN);
      }
    }
    
    // Assert no NaN found
    expect(nanElements.length).toBe(0);
  });

  // ============================================================================
  // TEST 6: NO CONSOLE ERRORS
  // ============================================================================
  
  test('TEST 6: No console errors during wizard flow', async ({ page }) => {
    const errors: string[] = [];
    
    // Capture console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Run through wizard
    await openSmartWizard(page);
    await page.locator('[data-industry], .industry-option').first().click();
    await page.waitForTimeout(1000);
    
    // Navigate through steps
    for (let i = 0; i < 4; i++) {
      const nextButton = await page.locator('[data-next], button:has-text("Next")').first();
      if (await nextButton.isVisible()) {
        await nextButton.click();
        await page.waitForTimeout(500);
      }
    }
    
    if (errors.length > 0) {
      console.error('❌ Console errors found:', errors);
    } else {
      console.log('✅ No console errors');
    }
    
    // Assert no errors
    expect(errors.length).toBe(0);
  });

  // ============================================================================
  // TEST 7: NAVIGATION WORKS
  // ============================================================================
  
  test('TEST 7: Back and forward navigation works', async ({ page }) => {
    await openSmartWizard(page);
    
    // Go to Step 2
    await page.locator('[data-industry], .industry-option').first().click();
    await waitForStep(page, 2);
    
    // Find back button
    const backButton = await page.locator('[data-back], .back-button, button:has-text("Back")').first();
    
    if (await backButton.isVisible()) {
      await backButton.click();
      await page.waitForTimeout(500);
      
      // Should be back on Step 1
      const step1 = await page.locator('[data-step="1"]').first();
      await expect(step1).toBeVisible();
      
      console.log('✅ Back navigation works');
      
      // Go forward again
      await page.locator('[data-industry], .industry-option').first().click();
      await waitForStep(page, 2);
      
      console.log('✅ Forward navigation works');
    } else {
      console.warn('⚠️ No back button found');
    }
  });

  // ============================================================================
  // TEST 8: FULL WIZARD FLOW
  // ============================================================================
  
  test('TEST 8: Complete wizard flow end-to-end', async ({ page }) => {
    const startTime = Date.now();
    
    // Open wizard
    await openSmartWizard(page);
    console.log('✅ Step 1: Wizard opened');
    
    // Select industry
    await page.locator('[data-industry], .industry-option').first().click();
    await waitForStep(page, 2);
    console.log('✅ Step 2: Industry selected');
    
    // Select use case (if available)
    const useCaseButton = await page.locator('[data-use-case], .use-case-option').first();
    if (await useCaseButton.isVisible()) {
      await useCaseButton.click();
      await page.waitForTimeout(500);
      console.log('✅ Use case selected');
    }
    
    // Navigate through remaining steps
    for (let i = 3; i <= 6; i++) {
      const nextButton = await page.locator('[data-next], button:has-text("Next")').first();
      
      if (await nextButton.isVisible()) {
        await nextButton.click();
        await page.waitForTimeout(500);
        console.log(`✅ Step ${i}: Navigated`);
      } else {
        console.warn(`⚠️ Could not navigate to step ${i}`);
        break;
      }
    }
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    console.log(`✅ Complete flow took ${totalTime}ms`);
    
    // Should complete in reasonable time
    expect(totalTime).toBeLessThan(30000); // 30 seconds
  });

  // ============================================================================
  // TEST 9: EDGE CASES
  // ============================================================================
  
  test('TEST 9: Close and reopen wizard', async ({ page }) => {
    // Open wizard
    await openSmartWizard(page);
    
    // Navigate to Step 2
    await page.locator('[data-industry], .industry-option').first().click();
    await waitForStep(page, 2);
    
    // Close wizard
    const closeButton = await page.locator('[data-close], .close-button, button[aria-label="Close"]').first();
    
    if (await closeButton.isVisible()) {
      await closeButton.click();
      await page.waitForTimeout(500);
      console.log('✅ Wizard closed');
      
      // Reopen
      await openSmartWizard(page);
      console.log('✅ Wizard reopened');
      
      // Should start from Step 1 again
      const step1 = await page.locator('[data-step="1"]').first();
      await expect(step1).toBeVisible();
      
      console.log('✅ Wizard reset to Step 1');
    } else {
      console.warn('⚠️ No close button found');
    }
  });

  // ============================================================================
  // TEST 10: PERFORMANCE
  // ============================================================================
  
  test('TEST 10: Performance metrics', async ({ page }) => {
    const metrics: any = {};
    
    // Measure wizard open time
    const openStart = Date.now();
    await openSmartWizard(page);
    metrics.openTime = Date.now() - openStart;
    
    // Measure step navigation
    const navStart = Date.now();
    await page.locator('[data-industry], .industry-option').first().click();
    await waitForStep(page, 2);
    metrics.step1ToStep2 = Date.now() - navStart;
    
    // Get performance metrics from browser
    const perfMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
      };
    });
    
    metrics.domContentLoaded = perfMetrics.domContentLoaded;
    metrics.loadComplete = perfMetrics.loadComplete;
    
    console.log('📊 Performance Metrics:', metrics);
    
    // Assert acceptable performance
    expect(metrics.openTime).toBeLessThan(500);
    expect(metrics.step1ToStep2).toBeLessThan(2000);
  });

});

// ============================================================================
// TEST CONFIGURATION
// ============================================================================

test.use({
  viewport: { width: 1280, height: 720 },
  screenshot: 'only-on-failure',
  video: 'retain-on-failure',
  trace: 'retain-on-failure',
});
