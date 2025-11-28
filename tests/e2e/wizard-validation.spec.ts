import { test, expect, Page } from '@playwright/test';

/**
 * Smart Wizard Validation & Error Detection Suite
 * 
 * Automatically detects common wizard issues:
 * - Console errors/warnings
 * - Missing default values
 * - Validation failures
 * - Excessive logging (>100 messages)
 * - UI blocking/overlay issues
 * - Next button disabled when shouldn't be
 */

test.describe('Smart Wizard Error Detection', () => {
  let consoleLogs: string[] = [];
  let consoleWarnings: string[] = [];
  let consoleErrors: string[] = [];

  test.beforeEach(async ({ page }) => {
    // Capture console messages
    consoleLogs = [];
    consoleWarnings = [];
    consoleErrors = [];

    page.on('console', (msg) => {
      const text = msg.text();
      const type = msg.type();
      
      if (type === 'error') {
        consoleErrors.push(text);
      } else if (type === 'warning') {
        consoleWarnings.push(text);
      } else if (type === 'log') {
        consoleLogs.push(text);
      }
    });

    // Capture uncaught exceptions
    page.on('pageerror', (error) => {
      consoleErrors.push(`Uncaught exception: ${error.message}`);
    });

    // Navigate to wizard
    await page.goto('http://localhost:5177');
    await page.waitForLoadState('networkidle');
  });

  test('should not have excessive console logging (>100 messages)', async ({ page }) => {
    // Open wizard
    await page.click('button:has-text("Get Started")');
    await page.waitForSelector('text=Welcome to Merlin', { timeout: 5000 });

    // Select use case
    await page.click('text=Office Building');
    await page.click('button:has-text("Next")');
    
    // Wait for questions to load
    await page.waitForSelector('select', { timeout: 5000 });

    // Check console log count
    const totalLogs = consoleLogs.length + consoleWarnings.length;
    console.log(`📊 Console Messages: ${totalLogs} (${consoleLogs.length} logs, ${consoleWarnings.length} warnings)`);

    // Fail if more than 100 messages
    expect(totalLogs).toBeLessThan(100);
    
    if (totalLogs > 50) {
      console.warn('⚠️ High console message count:', totalLogs);
    }
  });

  test('should not have validation errors when form has default values', async ({ page }) => {
    // Open wizard and select office building
    await page.click('button:has-text("Get Started")');
    await page.waitForSelector('text=Welcome to Merlin');
    await page.click('text=Office Building');
    await page.click('button:has-text("Next")');
    
    // Wait for questions
    await page.waitForSelector('select', { timeout: 5000 });

    // Check for validation error logs
    const validationErrors = consoleLogs.filter(log => 
      log.includes('Missing required fields') || 
      log.includes('allRequiredFilled: false') ||
      log.includes('validation: false')
    );

    if (validationErrors.length > 0) {
      console.error('❌ Validation errors found:');
      validationErrors.forEach(err => console.error('  -', err));
    }

    // All required fields should have defaults from database
    expect(validationErrors.length).toBe(0);
  });

  test('should not have JavaScript errors', async ({ page }) => {
    // Open wizard
    await page.click('button:has-text("Get Started")');
    await page.waitForSelector('text=Welcome to Merlin');
    await page.click('text=Office Building');
    await page.click('button:has-text("Next")');
    
    // Wait for form
    await page.waitForSelector('select', { timeout: 5000 });
    await page.waitForTimeout(2000);

    // Check for errors
    if (consoleErrors.length > 0) {
      console.error('❌ JavaScript errors detected:');
      consoleErrors.forEach(err => console.error('  -', err));
    }

    expect(consoleErrors.length).toBe(0);
  });

  test('should enable Next button when all required fields filled', async ({ page }) => {
    // Open wizard
    await page.click('button:has-text("Get Started")');
    await page.waitForSelector('text=Welcome to Merlin');
    await page.click('text=Office Building');
    await page.click('button:has-text("Next")');
    
    // Wait for form
    await page.waitForSelector('select', { timeout: 5000 });

    // Fill all required fields (test assumes defaults are applied)
    const nextButton = page.locator('button:has-text("Next")');
    
    // Wait a bit for defaults to apply
    await page.waitForTimeout(1000);

    // Check if Next button is enabled
    const isDisabled = await nextButton.isDisabled();
    
    if (isDisabled) {
      // Try to find which fields are missing
      const missingLog = consoleLogs.find(log => log.includes('Missing required fields'));
      if (missingLog) {
        console.error('❌ Next button disabled. Missing fields log:', missingLog);
      }
    }

    expect(isDisabled).toBe(false);
  });

  test('should not show AI Status Indicator', async ({ page }) => {
    // Open wizard
    await page.click('button:has-text("Get Started")');
    await page.waitForSelector('text=Welcome to Merlin');

    // Check for AI indicator
    const aiIndicator = page.locator('text=Not Used');
    const aiCount = await aiIndicator.count();

    expect(aiCount).toBe(0);
  });

  test('should not show Generator Capacity field for office building', async ({ page }) => {
    // Open wizard
    await page.click('button:has-text("Get Started")');
    await page.waitForSelector('text=Welcome to Merlin');
    await page.click('text=Office Building');
    await page.click('button:has-text("Next")');
    
    // Wait for form
    await page.waitForSelector('select', { timeout: 5000 });

    // Check for generator capacity field
    const generatorField = page.locator('text=Generator capacity (kW)');
    const genFieldCount = await generatorField.count();

    expect(genFieldCount).toBe(0);
  });

  test('should have working select dropdowns with default values', async ({ page }) => {
    // Open wizard
    await page.click('button:has-text("Get Started")');
    await page.waitForSelector('text=Welcome to Merlin');
    await page.click('text=Office Building');
    await page.click('button:has-text("Next")');
    
    // Wait for form
    await page.waitForSelector('select', { timeout: 5000 });

    // Find all select elements
    const selects = await page.locator('select').all();
    console.log(`📋 Found ${selects.length} select dropdowns`);

    let emptySelects = 0;
    for (const select of selects) {
      const value = await select.inputValue();
      if (!value || value === '') {
        emptySelects++;
        const label = await select.locator('..').locator('label').textContent();
        console.warn(`⚠️ Empty select: "${label}"`);
      }
    }

    // All required selects should have default values
    expect(emptySelects).toBe(0);
  });

  test('should not have overlay blocking interactions', async ({ page }) => {
    // Open wizard
    await page.click('button:has-text("Get Started")');
    await page.waitForSelector('text=Welcome to Merlin');
    await page.click('text=Office Building');
    await page.click('button:has-text("Next")');
    
    // Wait for form
    await page.waitForSelector('select', { timeout: 5000 });

    // Try to interact with first select
    const firstSelect = page.locator('select').first();
    const isClickable = await firstSelect.isEnabled();

    expect(isClickable).toBe(true);

    // Try clicking it
    await expect(firstSelect).toBeVisible();
    await expect(firstSelect).toBeEnabled();
  });

  test('should show PowerMeter with zero values initially', async ({ page }) => {
    // Open wizard
    await page.click('button:has-text("Get Started")');
    await page.waitForSelector('text=Welcome to Merlin');

    // Check for PowerMeter widget
    const powerMeter = page.locator('text=Power Generation');
    const hasPowerMeter = await powerMeter.count() > 0;

    if (hasPowerMeter) {
      // Check that initial values are zero
      const peakText = await page.locator('text=Peak').locator('..').textContent();
      expect(peakText).toContain('0.0 MW');
    }
  });

  test('comprehensive wizard flow - office building', async ({ page }) => {
    console.log('🧪 Starting comprehensive wizard flow test...');

    // Step 1: Open wizard
    await page.click('button:has-text("Get Started")');
    await page.waitForSelector('text=Welcome to Merlin');
    console.log('✅ Step 1: Wizard opened');

    // Step 2: Select office building
    await page.click('text=Office Building');
    await page.click('button:has-text("Next")');
    await page.waitForSelector('select', { timeout: 5000 });
    console.log('✅ Step 2: Office building selected');

    // Wait for defaults to apply
    await page.waitForTimeout(1500);

    // Check validation logs
    const validationErrors = consoleLogs.filter(log => 
      log.includes('Missing required fields')
    );

    if (validationErrors.length > 0) {
      console.error('❌ Validation errors during flow:');
      validationErrors.forEach(err => console.error('  -', err));
    }

    // Check for JavaScript errors
    if (consoleErrors.length > 0) {
      console.error('❌ JavaScript errors during flow:');
      consoleErrors.forEach(err => console.error('  -', err));
    }

    // Check Next button
    const nextButton = page.locator('button:has-text("Next")');
    const isDisabled = await nextButton.isDisabled();

    console.log(`📊 Final stats:`);
    console.log(`  - Console logs: ${consoleLogs.length}`);
    console.log(`  - Console warnings: ${consoleWarnings.length}`);
    console.log(`  - Console errors: ${consoleErrors.length}`);
    console.log(`  - Next button disabled: ${isDisabled}`);

    // Final assertions
    expect(consoleErrors.length).toBe(0);
    expect(validationErrors.length).toBe(0);
    expect(isDisabled).toBe(false);
  });
});

test.describe('Regression Tests - Fixed Issues', () => {
  test('should not log per-question renders', async ({ page }) => {
    const renderLogs: string[] = [];

    page.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('Rendering question:')) {
        renderLogs.push(text);
      }
    });

    await page.goto('http://localhost:5177');
    await page.click('button:has-text("Get Started")');
    await page.waitForSelector('text=Welcome to Merlin');
    await page.click('text=Office Building');
    await page.click('button:has-text("Next")');
    await page.waitForSelector('select', { timeout: 5000 });
    await page.waitForTimeout(1000);

    console.log(`🔍 Question render logs: ${renderLogs.length}`);
    
    // Should be 0 after fix
    expect(renderLogs.length).toBe(0);
  });

  test('should only log validation failures, not every check', async ({ page }) => {
    const validationLogs: string[] = [];

    page.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('[canProceed] Dynamic validation:') || text.includes('[canProceed] Missing required fields:')) {
        validationLogs.push(text);
      }
    });

    await page.goto('http://localhost:5177');
    await page.click('button:has-text("Get Started")');
    await page.waitForSelector('text=Welcome to Merlin');
    await page.click('text=Office Building');
    await page.click('button:has-text("Next")');
    await page.waitForSelector('select', { timeout: 5000 });
    await page.waitForTimeout(1000);

    console.log(`🔍 Validation logs: ${validationLogs.length}`);
    
    // Should only log failures, not every check
    // With defaults applied, should be 0-1 logs max
    expect(validationLogs.length).toBeLessThanOrEqual(1);
  });
});
