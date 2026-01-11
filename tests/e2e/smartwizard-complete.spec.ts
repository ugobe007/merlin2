import { test, expect } from '@playwright/test';

/**
 * SmartWizard V3 - Complete End-to-End Test
 * ==========================================
 * This test validates the ENTIRE wizard flow with real user interactions
 * 
 * Test Scenario: 50,000 sq ft office building, $2,500/mo bill, save money goal
 */

test.describe('SmartWizard V3 - Complete Flow', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate directly to wizard route (more reliable than clicking homepage button)
    await page.goto('/wizard');
    await page.waitForLoadState('networkidle');
    // Wait a bit for React to hydrate
    await page.waitForTimeout(1000);
  });

  test('Complete Office Building Quote Flow - NO BREAKS', async ({ page }) => {
    // ========================================
    // STEP 0: Wizard should be open (Step 1 = Location)
    // ========================================
    // Verify wizard is loaded - Step 1 is Location (look for heading specifically)
    await expect(page.getByRole('heading', { name: 'Your Location' })).toBeVisible({ timeout: 15000 });

    // ========================================
    // STEP 1: Location (Required: zip code + 2 goals)
    // ========================================
    // Step 1 requires: 5-digit zip code + state + at least 2 goals selected
    
    // Fill in a valid zip code (5 digits) - this should auto-set the state
    const zipInput = page.locator('input[placeholder*="89101"], input[type="text"]').first();
    await expect(zipInput).toBeVisible({ timeout: 10000 });
    await zipInput.fill('90210'); // Beverly Hills, CA - valid zip
    await page.waitForTimeout(1000); // Wait for zip code validation and state lookup
    
    // Select at least 2 goals (required to proceed)
    // Look for goal buttons/cards - they typically have emoji icons
    const goalButtons = page.locator('button:has-text("Save Money"), button:has-text("Lower Cost"), button:has-text("Backup Power"), button:has-text("Reduce Emissions"), button[class*="goal"]');
    const goalCount = await goalButtons.count();
    
    if (goalCount >= 2) {
      // Select first 2 goals
      await goalButtons.nth(0).click();
      await page.waitForTimeout(300);
      await goalButtons.nth(1).click();
      await page.waitForTimeout(500);
    } else {
      // Try clicking any goal cards visible
      const anyGoalCard = page.locator('button[class*="rounded"], button[class*="border"]').filter({ hasNotText: /Continue|Back|Next/ });
      const cardCount = await anyGoalCard.count();
      if (cardCount >= 2) {
        await anyGoalCard.nth(0).click();
        await page.waitForTimeout(300);
        await anyGoalCard.nth(1).click();
        await page.waitForTimeout(500);
      }
    }
    
    // Verify Continue button is enabled
    const continueButton = page.locator('button:has-text("Continue")').first();
    await expect(continueButton).toBeEnabled({ timeout: 5000 });
    
    // Verify ONLY ONE continue button
    const step1NextButtons = await page.locator('button:has-text("Continue")').count();
    expect(step1NextButtons).toBeLessThanOrEqual(1);
    
    // Proceed to Step 2 (Industry Selection)
    await continueButton.click();
    await page.waitForTimeout(1500); // Wait for navigation and state update

    // ========================================
    // STEP 2: Select Office Building Industry
    // ========================================
    // Wait for Step 2 (Industry Selection) to load
    await expect(
      page.getByRole('heading', { name: /Select Your Industry|Confirm Your Industry/ }).first()
    ).toBeVisible({ timeout: 15000 });
    
    // Select Office Building industry
    const officeButton = page.locator('button:has-text("Office"), [data-testid="use-case-office"]').first();
    await expect(officeButton).toBeVisible({ timeout: 10000 });
    await officeButton.click();
    await page.waitForTimeout(500);
    
    // Verify ONLY ONE next button
    const step2NextButtons = await page.locator('button:has-text("Next"), button:has-text("Continue")').count();
    expect(step2NextButtons).toBeLessThanOrEqual(1);
    
    // Proceed to Step 3 (Details/Questions)
    const nextButton2 = page.locator('button:has-text("Next"), button:has-text("Continue")').first();
    if (await nextButton2.isVisible() && await nextButton2.isEnabled()) {
      await nextButton2.click();
      await page.waitForTimeout(1000); // Wait for navigation
    }

    // ========================================
    // STEP 3: Answer Questions (Details)
    // ========================================
    // Wait for Step 3 to load (may take a moment for questions to load)
    await page.waitForTimeout(2000);
    
    // Look for question inputs or wizard step indicator
    const questionInput = page.locator('input[name="squareFootage"], input[placeholder*="square"], input[placeholder*="sq"], input[type="number"]').first();
    if (await questionInput.isVisible({ timeout: 10000 })) {
      // Fill office building questions
      await questionInput.fill('50000');
      await page.waitForTimeout(500);
      
      // Try to fill monthly bill if field exists
      const billInput = page.locator('input[name="monthlyElectricBill"], input[placeholder*="bill"], input[placeholder*="monthly"]').first();
      if (await billInput.isVisible({ timeout: 3000 })) {
        await billInput.fill('2500');
        await page.waitForTimeout(500);
      }
      
      // Look for goal/energy preference selectors (may be buttons or selects)
      const goalButtons = page.locator('button:has-text("Save Money"), button:has-text("Lower Cost"), button:has-text("Cost Savings")');
      if (await goalButtons.count() > 0) {
        await goalButtons.first().click();
        await page.waitForTimeout(500);
      }
    }
    
    // Verify NO duplicate buttons
    const step3NextButtons = await page.locator('button:has-text("Next"), button:has-text("Continue"), button:has-text("Continue to Options")').count();
    expect(step3NextButtons).toBeLessThanOrEqual(1);
    
    // Proceed to Step 4 (Options)
    const nextButton3 = page.locator('button:has-text("Next"), button:has-text("Continue"), button:has-text("Continue to Options")').first();
    if (await nextButton3.isVisible() && await nextButton3.isEnabled()) {
      await nextButton3.click();
      await page.waitForTimeout(1000); // Wait for navigation
    }

    // ========================================
    // STEP 4: Options (Solar/EV/Generator)
    // ========================================
    // Wait for Step 4 to load
    await page.waitForTimeout(1000);
    
    // Should show solar/EV/generator options
    const solarOption = page.locator('button:has-text("Solar"), input[type="checkbox"][aria-label*="Solar"], div:has-text("Solar")').first();
    if (await solarOption.isVisible({ timeout: 5000 })) {
      await solarOption.click();
      await page.waitForTimeout(500);
    }
    
    // Verify NO duplicate buttons
    const step4NextButtons = await page.locator('button:has-text("Next"), button:has-text("Continue"), button:has-text("Continue to MagicFit")').count();
    expect(step4NextButtons).toBeLessThanOrEqual(1);
    
    // Proceed to Step 5 (MagicFit)
    const nextButton4 = page.locator('button:has-text("Next"), button:has-text("Continue"), button:has-text("Continue to MagicFit")').first();
    if (await nextButton4.isVisible() && await nextButton4.isEnabled()) {
      await nextButton4.click();
      await page.waitForTimeout(1500); // Wait for MagicFit calculations
    }

    // ========================================
    // STEP 5: MagicFit (System Sizing)
    // ========================================
    // Wait for MagicFit to calculate and display
    await page.waitForTimeout(2000);
    
    // Should show calculated battery/system values
    const batteryDisplay = page.locator('text=/0\\.\\d+\\s*MW|\\d+\\.\\d+\\s*kW|\\d+\\s*MWh|Battery|Power').first();
    await expect(batteryDisplay).toBeVisible({ timeout: 15000 });
    
    // Verify NO NaN anywhere
    await expect(page.locator('text=NaN')).toHaveCount(0);
    
    // Verify ONLY ONE next button
    const step5NextButtons = await page.locator('button:has-text("Next"), button:has-text("Continue"), button:has-text("Continue to Quote"), button:has-text("Generate Quote")').count();
    expect(step5NextButtons).toBeLessThanOrEqual(1);
    
    // Proceed to Step 6 (Quote Summary)
    const nextButton5 = page.locator('button:has-text("Next"), button:has-text("Continue"), button:has-text("Continue to Quote"), button:has-text("Generate Quote")').first();
    if (await nextButton5.isVisible() && await nextButton5.isEnabled()) {
      await nextButton5.click();
      await page.waitForTimeout(1500); // Wait for quote generation
    }

    // ========================================
    // STEP 6: Quote Summary
    // ========================================
    await expect(page.locator('text=Quote Summary').or(page.locator('text=Summary'))).toBeVisible();
    
    // Verify NO NaN errors in quote
    await expect(page.locator('text=NaN')).toHaveCount(0);
    
    // Verify equipment costs are displayed
    await expect(page.locator('text=/\\$[\\d,]+/')).toBeVisible();
    
    // Verify can generate/complete
    const completeButton = page.locator('button:has-text("Complete"), button:has-text("Finish"), button:has-text("Generate")');
    await expect(completeButton.first()).toBeVisible();
    
    // Click complete
    await completeButton.first().click();
    
    console.log('✅ COMPLETE FLOW SUCCESSFUL - NO BREAKS!');
  });

  test('Verify NO Duplicate Navigation Buttons on Any Step', async ({ page }) => {
    // Wizard is already open from beforeEach (navigates to /wizard)
    // Verify we're on Step 1 (Location)
    await expect(page.getByRole('heading', { name: 'Your Location' })).toBeVisible({ timeout: 15000 });
    
    // Check each step for duplicate buttons
    for (let step = 0; step < 6; step++) {
      const nextButtons = await page.locator('button:has-text("Next"), button:has-text("Continue")').count();
      const backButtons = await page.locator('button:has-text("Back")').count();
      
      console.log(`Step ${step}: Next buttons=${nextButtons}, Back buttons=${backButtons}`);
      
      expect(nextButtons).toBeLessThanOrEqual(1);
      expect(backButtons).toBeLessThanOrEqual(1);
      
      // Try to advance (may need to fill required fields)
      const nextButton = page.locator('button:has-text("Next"), button:has-text("Continue")').first();
      if (await nextButton.isVisible() && await nextButton.isEnabled()) {
        await nextButton.click();
        await page.waitForTimeout(500); // Wait for navigation
      } else {
        break; // Can't proceed without filling fields
      }
    }
  });

  test('Power Status Bar Appears from Step 2 Onwards', async ({ page }) => {
    // Wizard is already open from beforeEach (navigates to /wizard)
    // Verify we're on Step 1 (Location)
    await expect(page.getByRole('heading', { name: 'Your Location' })).toBeVisible({ timeout: 15000 });
    
    // Select use case
    await page.click('[data-testid="use-case-office"], button:has-text("Office")');
    await page.click('button:has-text("Next"), button:has-text("Continue")');
    
    // Answer minimal questions to advance
    await page.fill('input[name="squareFootage"]', '50000');
    await page.click('button:has-text("Next"), button:has-text("Continue")');
    
    // Power Status Bar should appear
    const powerStatusBar = page.locator('[data-testid="power-status-bar"], div:has-text("Power Configuration")');
    
    // May appear on Step 2 or 3 depending on architecture
    const isVisible = await powerStatusBar.isVisible();
    if (!isVisible) {
      console.warn('⚠️ Power Status Bar not visible yet');
      // Try advancing one more step
      await page.click('button:has-text("Next"), button:has-text("Continue")');
      await expect(powerStatusBar).toBeVisible();
    }
    
    console.log('✅ Power Status Bar is visible');
  });

  test('Math Verification: 50K sq ft = ~0.3 MW', async ({ page }) => {
    // Wizard is already open from beforeEach (navigates to /wizard)
    // Verify we're on Step 1 (Location)
    await expect(page.getByRole('heading', { name: 'Your Location' })).toBeVisible({ timeout: 15000 });
    
    // Select office
    await page.click('[data-testid="use-case-office"], button:has-text("Office")');
    await page.click('button:has-text("Next"), button:has-text("Continue")');
    
    // Enter 50,000 sq ft
    await page.fill('input[name="squareFootage"]', '50000');
    await page.click('button:has-text("Next"), button:has-text("Continue")');
    
    // Check calculated battery size
    // 50K sq ft × 6 W/sq ft = 300 kW = 0.3 MW
    // Should see 0.3 MW or 300 kW somewhere
    const powerDisplay = page.locator('text=/0\\.3\\s*MW|300\\s*kW|0\\.2[5-9]\\s*MW|0\\.[3-4]\\s*MW/');
    
    await expect(powerDisplay).toBeVisible({ timeout: 10000 });
    console.log('✅ Math verification passed: ~0.3 MW for 50K sq ft');
  });
});
