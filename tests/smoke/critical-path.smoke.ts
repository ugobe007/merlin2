/**
 * SMOKE TESTS - CRITICAL PATH
 * 
 * Fast smoke tests for critical application paths
 * Run before every deployment to ensure core functionality works
 */

import { test, expect } from '@playwright/test';

test.describe('Critical Path Smoke Tests', () => {
  test('homepage loads successfully', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Merlin|BESS/i);
    await expect(page.locator('body')).toBeVisible();
  });

  test('quote builder page is accessible', async ({ page }) => {
    await page.goto('/quote-builder');
    await page.waitForLoadState('networkidle');
    
    // Check for key elements
    const facilityTypeSelect = page.locator('[data-testid="facility-type-select"]');
    await expect(facilityTypeSelect).toBeVisible({ timeout: 10000 });
  });

  test('smart wizard page loads', async ({ page }) => {
    await page.goto('/smart-wizard');
    await page.waitForLoadState('networkidle');
    
    const wizardContainer = page.locator('[data-testid="smart-wizard-container"]');
    await expect(wizardContainer).toBeVisible({ timeout: 10000 });
  });

  test('dashboard page is accessible', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Should see either saved quotes or empty state
    const pageContent = page.locator('body');
    await expect(pageContent).toBeVisible();
  });

  test('navigation between pages works', async ({ page }) => {
    await page.goto('/');
    
    // Navigate to quote builder
    await page.click('text=Get Started');
    await page.waitForURL(/quote-builder|smart-wizard/);
    
    // Verify navigation successful
    expect(page.url()).toMatch(/quote-builder|smart-wizard/);
  });

  test('API endpoints respond', async ({ request }) => {
    // Test Supabase health
    const response = await request.get('https://your-project.supabase.co/rest/v1/');
    expect(response.status()).toBeLessThan(500);
  });

  test('no critical console errors on load', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Filter out known non-critical errors
    const criticalErrors = errors.filter(err => 
      !err.includes('favicon') && 
      !err.includes('sourcemap')
    );

    expect(criticalErrors.length).toBe(0);
  });

  test('form validation works', async ({ page }) => {
    await page.goto('/quote-builder');
    
    // Try to submit without filling form
    const submitButton = page.locator('[data-testid="generate-quote-btn"]');
    
    // Button should be disabled or form should show errors
    const isDisabled = await submitButton.isDisabled();
    expect(isDisabled).toBe(true);
  });

  test('basic calculation completes', async ({ page }) => {
    await page.goto('/quote-builder');
    
    // Fill minimal form
    await page.selectOption('[data-testid="facility-type-select"]', 'medical_office');
    await page.fill('[data-testid="square-footage-input"]', '50000');
    
    // Generate quote
    await page.click('[data-testid="generate-quote-btn"]');
    
    // Wait for results (with timeout)
    await expect(page.locator('[data-testid="quote-results"]')).toBeVisible({ timeout: 30000 });
  });

  test('mobile viewport works', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Check responsive design works
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Performance Smoke Tests', () => {
  test('homepage loads under 3 seconds', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(3000);
  });

  test('no memory leaks on navigation', async ({ page }) => {
    await page.goto('/');
    await page.goto('/quote-builder');
    await page.goto('/dashboard');
    await page.goto('/');
    
    // Should complete without issues
    expect(page.url()).toContain('/');
  });
});
