import { test, expect } from '@playwright/test';

/**
 * CRITICAL E2E TESTS FOR SMARTWIZARDV2
 * These tests validate the actual user experience, not just calculations
 */

test.describe('SmartWizardV2 - Complete Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5177');
    // Wait for app to load
    await page.waitForLoadState('networkidle');
  });

  test('should display intro screen and navigate to step 0', async ({ page }) => {
    // Click "Get Started" or similar button to open wizard
    const wizardButton = page.locator('button:has-text("Get Started")').first();
    await wizardButton.click();
    
    // Should see intro screen (step -1)
    await expect(page.locator('text=Welcome to BESS Quote Builder')).toBeVisible({ timeout: 5000 });
    
    // Click start button
    const startButton = page.locator('button:has-text("Start")').first();
    await startButton.click();
    
    // Should navigate to step 0 (Industry Template)
    await expect(page.locator('text=Choose Your Industry')).toBeVisible({ timeout: 5000 });
  });

  test('EV Charging use case - complete workflow', async ({ page }) => {
    // Open wizard
    await page.click('button:has-text("Get Started")');
    await page.waitForTimeout(1000);
    
    // Skip intro
    await page.click('button:has-text("Start")');
    await page.waitForTimeout(1000);
    
    // STEP 0: Select EV Charging template
    await page.click('text=EV Charging');
    await page.waitForTimeout(500);
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(1000);
    
    // STEP 1: Answer use case questions
    // Fill in number of chargers
    const chargersInput = page.locator('input[type="number"]').first();
    await chargersInput.fill('10');
    await page.waitForTimeout(500);
    
    // Fill in kW per charger
    const kwInput = page.locator('input[type="number"]').nth(1);
    await kwInput.fill('150');
    await page.waitForTimeout(500);
    
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(2000); // Wait for baseline calculation
    
    // STEP 2: Should see PowerMeterWidget
    const powerWidget = page.locator('text=Power Configuration');
    await expect(powerWidget).toBeVisible({ timeout: 5000 });
    
    // Should see battery MW value displayed
    const batteryDisplay = page.locator('text=/\\d+\\.\\d+ MW/').first();
    await expect(batteryDisplay).toBeVisible();
    
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(1000);
    
    // STEP 3: Should see PowerStatusWidget and Solar/EV toggles
    await expect(page.locator('text=Power Status')).toBeVisible({ timeout: 5000 });
    
    // NEW: Check for Solar/EV YES/NO buttons
    const solarYesButton = page.locator('button:has-text("Yes")').first();
    await expect(solarYesButton).toBeVisible();
    
    const evYesButton = page.locator('button:has-text("Yes")').nth(1);
    await expect(evYesButton).toBeVisible();
    
    // Test Solar toggle
    await solarYesButton.click();
    await page.waitForTimeout(500);
    
    // Should show solar configuration inputs
    await expect(page.locator('text=Available Space')).toBeVisible({ timeout: 3000 });
    
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(1000);
    
    // STEP 4: Should see system summary card
    await expect(page.locator('text=Your System Configuration')).toBeVisible({ timeout: 5000 });
    
    // Should see 4-column summary
    await expect(page.locator('text=Battery Storage')).toBeVisible();
    await expect(page.locator('text=Duration')).toBeVisible();
    await expect(page.locator('text=Total Energy')).toBeVisible();
    await expect(page.locator('text=Generation')).toBeVisible();
    
    // Should see "Why location matters" text
    await expect(page.locator('text=Why location matters')).toBeVisible();
    
    // Select location
    await page.selectOption('select', 'North America');
    await page.waitForTimeout(500);
    
    // Enter electricity rate
    const rateInput = page.locator('input[type="number"]').last();
    await rateInput.fill('0.12');
    await page.waitForTimeout(500);
    
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(2000);
    
    // STEP 5: Quote Summary
    await expect(page.locator('text=Review Your Quote')).toBeVisible({ timeout: 5000 });
    
    // Should see financial metrics
    await expect(page.locator('text=/Payback|ROI|Savings/')).toBeVisible();
  });

  test('Data Center use case - workflow validation', async ({ page }) => {
    await page.click('button:has-text("Get Started")');
    await page.waitForTimeout(1000);
    await page.click('button:has-text("Start")');
    await page.waitForTimeout(1000);
    
    // Select Data Center
    await page.click('text=Data Center');
    await page.waitForTimeout(500);
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(1000);
    
    // Answer questions
    const sqftInput = page.locator('input[type="number"]').first();
    await sqftInput.fill('50000');
    await page.waitForTimeout(500);
    
    const rackInput = page.locator('input[type="number"]').nth(1);
    await rackInput.fill('100');
    await page.waitForTimeout(500);
    
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(2000);
    
    // Validate Step 2 widgets
    await expect(page.locator('text=Power Configuration')).toBeVisible({ timeout: 5000 });
    
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(1000);
    
    // Validate Step 3 toggles
    await expect(page.locator('text=Additional Power & Storage Features')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('button:has-text("Yes")').first()).toBeVisible();
  });

  test('Hotel use case - workflow validation', async ({ page }) => {
    await page.click('button:has-text("Get Started")');
    await page.waitForTimeout(1000);
    await page.click('button:has-text("Start")');
    await page.waitForTimeout(1000);
    
    // Select Hotel
    await page.click('text=Hotel');
    await page.waitForTimeout(500);
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(1000);
    
    // Answer questions
    const roomsInput = page.locator('input[type="number"]').first();
    await roomsInput.fill('200');
    await page.waitForTimeout(500);
    
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(2000);
    
    // Validate Step 2
    await expect(page.locator('text=Power Configuration')).toBeVisible({ timeout: 5000 });
    
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(1000);
    
    // Validate Step 3
    await expect(page.locator('text=PowerStatusWidget')).toBeVisible({ timeout: 5000 });
  });

  test('should validate navigation flow', async ({ page }) => {
    await page.click('button:has-text("Get Started")');
    await page.waitForTimeout(1000);
    await page.click('button:has-text("Start")');
    await page.waitForTimeout(1000);
    
    // Step 0
    await page.click('text=Office Building');
    await page.waitForTimeout(500);
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(1000);
    
    // Step 1
    const sqftInput = page.locator('input[type="number"]').first();
    await sqftInput.fill('100000');
    await page.waitForTimeout(500);
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(2000);
    
    // Test BACK button
    await page.click('button:has-text("Back")');
    await page.waitForTimeout(500);
    
    // Should be back at Step 1
    await expect(page.locator('text=Tell Us About Your Operation')).toBeVisible();
    
    // Go forward again
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(2000);
    
    // Should be at Step 2
    await expect(page.locator('text=Configure Your System')).toBeVisible();
  });

  test('should not allow proceeding without required fields', async ({ page }) => {
    await page.click('button:has-text("Get Started")');
    await page.waitForTimeout(1000);
    await page.click('button:has-text("Start")');
    await page.waitForTimeout(1000);
    
    // Try to click Next without selecting template
    const nextButton = page.locator('button:has-text("Next")');
    
    // Button should be disabled or click should do nothing
    const isDisabled = await nextButton.isDisabled();
    expect(isDisabled).toBe(true);
  });

  test('Step 4 system summary should show correct values', async ({ page }) => {
    await page.click('button:has-text("Get Started")');
    await page.waitForTimeout(1000);
    await page.click('button:has-text("Start")');
    await page.waitForTimeout(1000);
    
    await page.click('text=EV Charging');
    await page.waitForTimeout(500);
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(1000);
    
    // Fill in 10 chargers at 150kW = 1.5 MW
    await page.locator('input[type="number"]').first().fill('10');
    await page.waitForTimeout(500);
    await page.locator('input[type="number"]').nth(1).fill('150');
    await page.waitForTimeout(500);
    
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(2000);
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(1000);
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(1000);
    
    // Step 4 - Check summary values
    const batteryMW = page.locator('text=/\\d+\\.\\d+ MW/').first();
    const batteryText = await batteryMW.textContent();
    
    // Should show 1.5 MW (10 chargers * 150kW = 1500kW = 1.5MW)
    expect(batteryText).toContain('1.5');
  });
});

test.describe('Widget Rendering Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5177');
    await page.waitForLoadState('networkidle');
  });

  test('PowerMeterWidget should render in Step 2', async ({ page }) => {
    // Navigate to Step 2
    await page.click('button:has-text("Get Started")');
    await page.waitForTimeout(1000);
    await page.click('button:has-text("Start")');
    await page.waitForTimeout(1000);
    await page.click('text=EV Charging');
    await page.waitForTimeout(500);
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(1000);
    
    // Fill questions
    await page.locator('input[type="number"]').first().fill('10');
    await page.waitForTimeout(500);
    await page.locator('input[type="number"]').nth(1).fill('150');
    await page.waitForTimeout(500);
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(2000);
    
    // Check PowerMeterWidget elements
    await expect(page.locator('text=Power Configuration')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=/\\d+\\.\\d+ MW/')).toBeVisible();
  });

  test('PowerStatusWidget should render in Step 3', async ({ page }) => {
    // Navigate to Step 3
    await page.click('button:has-text("Get Started")');
    await page.waitForTimeout(1000);
    await page.click('button:has-text("Start")');
    await page.waitForTimeout(1000);
    await page.click('text=EV Charging');
    await page.waitForTimeout(500);
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(1000);
    await page.locator('input[type="number"]').first().fill('10');
    await page.waitForTimeout(500);
    await page.locator('input[type="number"]').nth(1).fill('150');
    await page.waitForTimeout(500);
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(2000);
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(1000);
    
    // Check PowerStatusWidget
    await expect(page.locator('text=Power Status')).toBeVisible({ timeout: 5000 });
  });

  test('Solar/EV toggle buttons should be visible and functional', async ({ page }) => {
    // Navigate to Step 3
    await page.click('button:has-text("Get Started")');
    await page.waitForTimeout(1000);
    await page.click('button:has-text("Start")');
    await page.waitForTimeout(1000);
    await page.click('text=Hotel');
    await page.waitForTimeout(500);
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(1000);
    await page.locator('input[type="number"]').first().fill('200');
    await page.waitForTimeout(500);
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(2000);
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(1000);
    
    // Check toggle section exists
    await expect(page.locator('text=Additional Power & Storage Features')).toBeVisible({ timeout: 5000 });
    
    // Check Solar toggle
    await expect(page.locator('text=Add Solar Power?')).toBeVisible();
    const solarYes = page.locator('button:has-text("Yes")').first();
    await expect(solarYes).toBeVisible();
    
    // Check EV toggle
    await expect(page.locator('text=Add EV Charging?')).toBeVisible();
    const evYes = page.locator('button:has-text("Yes")').nth(1);
    await expect(evYes).toBeVisible();
    
    // Test Solar toggle functionality
    await solarYes.click();
    await page.waitForTimeout(1000);
    
    // Should show solar configuration
    await expect(page.locator('text=Available Space')).toBeVisible({ timeout: 3000 });
    
    // Test Solar NO button
    const solarNo = page.locator('button:has-text("No")').first();
    await solarNo.click();
    await page.waitForTimeout(500);
    
    // Solar config should be hidden
    await expect(page.locator('text=Available Space')).not.toBeVisible();
  });

  test('Step 4 system summary card should render', async ({ page }) => {
    // Navigate to Step 4
    await page.click('button:has-text("Get Started")');
    await page.waitForTimeout(1000);
    await page.click('button:has-text("Start")');
    await page.waitForTimeout(1000);
    await page.click('text=Office Building');
    await page.waitForTimeout(500);
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(1000);
    await page.locator('input[type="number"]').first().fill('50000');
    await page.waitForTimeout(500);
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(2000);
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(1000);
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(1000);
    
    // Check system summary card
    await expect(page.locator('text=Your System Configuration')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Battery Storage')).toBeVisible();
    await expect(page.locator('text=Duration')).toBeVisible();
    await expect(page.locator('text=Total Energy')).toBeVisible();
    await expect(page.locator('text=Generation')).toBeVisible();
    await expect(page.locator('text=Why location matters')).toBeVisible();
  });
});

test.describe('Console Error Detection', () => {
  test('should not have console errors during wizard flow', async ({ page }) => {
    const consoleErrors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.goto('http://localhost:5177');
    await page.waitForLoadState('networkidle');
    
    // Complete workflow
    await page.click('button:has-text("Get Started")');
    await page.waitForTimeout(1000);
    await page.click('button:has-text("Start")');
    await page.waitForTimeout(1000);
    await page.click('text=EV Charging');
    await page.waitForTimeout(500);
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(1000);
    await page.locator('input[type="number"]').first().fill('10');
    await page.waitForTimeout(500);
    await page.locator('input[type="number"]').nth(1).fill('150');
    await page.waitForTimeout(500);
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(2000);
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(1000);
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(1000);
    
    // Should have no console errors
    expect(consoleErrors).toHaveLength(0);
  });
});
