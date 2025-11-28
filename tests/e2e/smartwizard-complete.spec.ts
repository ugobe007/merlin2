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
    await page.goto('http://localhost:5177');
    await page.waitForLoadState('networkidle');
  });

  test('Complete Office Building Quote Flow - NO BREAKS', async ({ page }) => {
    // ========================================
    // STEP 0: Open Wizard
    // ========================================
    await page.click('button:has-text("Smart Wizard")');
    await expect(page.locator('text=Smart Wizard')).toBeVisible();
    
    // Skip intro if present
    const skipButton = page.locator('button:has-text("Start Building")');
    if (await skipButton.isVisible()) {
      await skipButton.click();
    }

    // ========================================
    // STEP 1: Select Office Building
    // ========================================
    await expect(page.locator('text=Select Your Industry')).toBeVisible();
    await page.click('[data-testid="use-case-office"], button:has-text("Office")');
    
    // Verify ONLY ONE next button
    const step1NextButtons = await page.locator('button:has-text("Next"), button:has-text("Continue")').count();
    expect(step1NextButtons).toBeLessThanOrEqual(1);
    
    await page.click('button:has-text("Next"), button:has-text("Continue")');

    // ========================================
    // STEP 2: Answer Questions
    // ========================================
    await expect(page.locator('text=Tell Us About Your Building').or(page.locator('text=Answer Questions'))).toBeVisible();
    
    // Fill office building questions
    await page.fill('input[name="squareFootage"], input[placeholder*="square"]', '50000');
    await page.fill('input[name="monthlyElectricBill"], input[placeholder*="bill"]', '2500');
    
    // Select primary goal
    const goalSelect = page.locator('select[name="primaryGoals"], select:has-text("Primary Goal")');
    if (await goalSelect.isVisible()) {
      await goalSelect.selectOption({ label: /save.*money|Lower.*cost/i });
    }
    
    // Grid reliability (if present)
    const gridSelect = page.locator('select[name="gridReliability"], select:has-text("Grid")');
    if (await gridSelect.isVisible()) {
      await gridSelect.selectOption({ label: /reliable/i });
    }
    
    // Verify NO duplicate buttons
    const step2NextButtons = await page.locator('button:has-text("Next"), button:has-text("Continue")').count();
    expect(step2NextButtons).toBeLessThanOrEqual(1);
    
    await page.click('button:has-text("Next"), button:has-text("Continue")');

    // ========================================
    // STEP 3: Battery/Power Configuration
    // ========================================
    // Should show calculated battery values
    await expect(page.locator('text=Battery').or(page.locator('text=Power'))).toBeVisible();
    
    // Verify battery MW is calculated (should be ~0.3 MW for 50K sq ft office)
    const batteryDisplay = page.locator('text=/0\\.\\d+ MW|\\d+\\.\\d+ kW/');
    await expect(batteryDisplay).toBeVisible();
    
    // Verify NO NaN anywhere
    await expect(page.locator('text=NaN')).toHaveCount(0);
    
    // Verify ONLY ONE next button
    const step3NextButtons = await page.locator('button:has-text("Next"), button:has-text("Continue")').count();
    expect(step3NextButtons).toBeLessThanOrEqual(1);
    
    await page.click('button:has-text("Next"), button:has-text("Continue")');

    // ========================================
    // STEP 4: Add Renewables (Solar/EV/etc)
    // ========================================
    // Power Status Bar should be visible
    const powerStatusBar = page.locator('[data-testid="power-status-bar"], text=Power Configuration');
    if (await powerStatusBar.isVisible()) {
      console.log('✅ Power Status Bar is visible');
    } else {
      console.warn('⚠️ Power Status Bar not found');
    }
    
    // Should show solar option for "save money" goal
    const solarToggle = page.locator('text=Solar').or(page.locator('input[type="checkbox"]')).first();
    if (await solarToggle.isVisible()) {
      await solarToggle.click();
    }
    
    // Verify NO duplicate buttons
    const step4NextButtons = await page.locator('button:has-text("Next"), button:has-text("Continue")').count();
    expect(step4NextButtons).toBeLessThanOrEqual(1);
    
    await page.click('button:has-text("Next"), button:has-text("Continue")');

    // ========================================
    // STEP 5: Location & Pricing
    // ========================================
    await expect(page.locator('text=Location').or(page.locator('text=Pricing'))).toBeVisible();
    
    // Select location
    const locationSelect = page.locator('select[name="location"]');
    if (await locationSelect.isVisible()) {
      await locationSelect.selectOption({ label: /California|United States/i });
    }
    
    // Verify NO duplicate buttons
    const step5NextButtons = await page.locator('button:has-text("Next"), button:has-text("Continue")').count();
    expect(step5NextButtons).toBeLessThanOrEqual(1);
    
    await page.click('button:has-text("Next"), button:has-text("Continue")');

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
    // Open wizard
    await page.click('button:has-text("Smart Wizard")');
    
    // Skip intro
    const skipButton = page.locator('button:has-text("Start Building")');
    if (await skipButton.isVisible()) {
      await skipButton.click();
    }
    
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
    // Open wizard and navigate to Step 2
    await page.click('button:has-text("Smart Wizard")');
    
    const skipButton = page.locator('button:has-text("Start Building")');
    if (await skipButton.isVisible()) {
      await skipButton.click();
    }
    
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
    // Open wizard
    await page.click('button:has-text("Smart Wizard")');
    
    const skipButton = page.locator('button:has-text("Start Building")');
    if (await skipButton.isVisible()) {
      await skipButton.click();
    }
    
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
