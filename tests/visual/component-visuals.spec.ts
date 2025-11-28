/**
 * VISUAL REGRESSION TESTS
 * 
 * Playwright visual regression tests using screenshot comparison
 */

import { test, expect } from '@playwright/test';

test.describe('Visual Regression Tests', () => {
  test('quote builder page matches snapshot', async ({ page }) => {
    await page.goto('/quote-builder');
    await page.waitForLoadState('networkidle');
    
    // Take full page screenshot
    await expect(page).toHaveScreenshot('quote-builder.png', {
      fullPage: true,
      maxDiffPixels: 100
    });
  });

  test('smart wizard step 1 matches snapshot', async ({ page }) => {
    await page.goto('/smart-wizard');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('smart-wizard-step1.png', {
      maxDiffPixels: 100
    });
  });

  test('dashboard empty state matches snapshot', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('dashboard-empty.png', {
      maxDiffPixels: 100
    });
  });

  test('quote results card matches snapshot', async ({ page }) => {
    await page.goto('/quote-builder');
    
    // Fill form
    await page.selectOption('[data-testid="facility-type-select"]', 'medical_office');
    await page.fill('[data-testid="square-footage-input"]', '50000');
    await page.click('[data-testid="generate-quote-btn"]');
    
    // Wait for results
    await page.waitForSelector('[data-testid="quote-results"]', { timeout: 30000 });
    
    // Screenshot just the results card
    const resultsCard = page.locator('[data-testid="quote-results"]');
    await expect(resultsCard).toHaveScreenshot('quote-results-card.png', {
      maxDiffPixels: 50
    });
  });

  test('mobile view matches snapshot', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    await expect(page).toHaveScreenshot('homepage-mobile.png', {
      fullPage: true,
      maxDiffPixels: 100
    });
  });

  test('tablet view matches snapshot', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/quote-builder');
    
    await expect(page).toHaveScreenshot('quote-builder-tablet.png', {
      fullPage: true,
      maxDiffPixels: 100
    });
  });

  test('dark mode matches snapshot', async ({ page }) => {
    // Enable dark mode if supported
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');
    
    await expect(page).toHaveScreenshot('homepage-dark-mode.png', {
      fullPage: true,
      maxDiffPixels: 150
    });
  });

  test('error state matches snapshot', async ({ page }) => {
    await page.goto('/quote-builder');
    
    // Try to submit without filling form
    await page.click('[data-testid="generate-quote-btn"]');
    
    // Wait for error messages
    await page.waitForSelector('[data-testid$="-error"]', { timeout: 2000 });
    
    await expect(page).toHaveScreenshot('quote-builder-errors.png', {
      maxDiffPixels: 100
    });
  });
});

test.describe('Component Visual Tests', () => {
  test('modal overlay matches snapshot', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Trigger modal (adjust selector based on actual implementation)
    await page.click('[data-testid="create-new-quote-btn"]');
    await page.waitForSelector('[data-testid="modal-overlay"]', { timeout: 2000 });
    
    const modal = page.locator('[data-testid="modal-overlay"]');
    await expect(modal).toHaveScreenshot('modal-overlay.png', {
      maxDiffPixels: 50
    });
  });

  test('loading spinner matches snapshot', async ({ page }) => {
    await page.goto('/quote-builder');
    await page.selectOption('[data-testid="facility-type-select"]', 'medical_office');
    await page.fill('[data-testid="square-footage-input"]', '50000');
    
    // Start quote generation
    const generatePromise = page.click('[data-testid="generate-quote-btn"]');
    
    // Quickly capture loading state
    await page.waitForSelector('[data-testid="loading-spinner"]', { timeout: 1000 });
    const spinner = page.locator('[data-testid="loading-spinner"]');
    await expect(spinner).toHaveScreenshot('loading-spinner.png');
    
    await generatePromise;
  });
});
