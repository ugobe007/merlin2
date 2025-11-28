import { test, expect, Page } from '@playwright/test';

/**
 * End-to-End Tests for BESS Quote Builder
 * Tests complete user workflows from UI interaction to quote generation
 */

test.describe('BESS Quote Builder E2E Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
    
    // Wait for initial data collection to complete
    await page.waitForFunction(() => {
      return window.localStorage.getItem('app_initialized') === 'true' ||
             document.querySelector('[data-testid="app-ready"]') !== null;
    }, { timeout: 10000 });
  });

  test.describe('Application Initialization', () => {
    test('should load application without errors', async ({ page }) => {
      // Check for critical elements
      await expect(page.locator('body')).toBeVisible();
      
      // Verify no critical console errors
      const errors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      await page.waitForTimeout(2000);

      // Filter out known non-critical errors
      const criticalErrors = errors.filter(err => 
        !err.includes('Module') && 
        !err.includes('externalized for browser compatibility')
      );

      expect(criticalErrors.length).toBe(0);
    });

    test('should complete cache initialization', async ({ page }) => {
      const logs: string[] = [];
      
      page.on('console', msg => {
        logs.push(msg.text());
      });

      await page.waitForTimeout(1000);

      const cacheLog = logs.find(log => log.includes('Cache cleared'));
      expect(cacheLog).toBeDefined();
    });

    test('should initialize AI data collection service', async ({ page }) => {
      const logs: string[] = [];
      
      page.on('console', msg => {
        logs.push(msg.text());
      });

      await page.waitForTimeout(2000);

      const initLog = logs.find(log => 
        log.includes('[AI Data Collection] Service initialized')
      );
      expect(initLog).toBeDefined();
    });

    test('should complete daily update successfully', async ({ page }) => {
      const logs: string[] = [];
      
      page.on('console', msg => {
        logs.push(msg.text());
      });

      await page.waitForTimeout(3000);

      // Check for completion log
      const completionLog = logs.find(log => 
        log.includes('[AI Data Collection] Daily update complete')
      );
      expect(completionLog).toBeDefined();

      // Verify all data sources collected
      expect(logs.some(log => log.includes('pricing:'))).toBeTruthy();
      expect(logs.some(log => log.includes('products:'))).toBeTruthy();
      expect(logs.some(log => log.includes('incentives:'))).toBeTruthy();
    });

    test('should not create multiple Supabase clients', async ({ page }) => {
      const warnings: string[] = [];
      
      page.on('console', msg => {
        if (msg.type() === 'warning') {
          warnings.push(msg.text());
        }
      });

      await page.reload();
      await page.waitForTimeout(1000);

      const supabaseWarnings = warnings.filter(w => 
        w.includes('Multiple GoTrueClient instances')
      );

      expect(supabaseWarnings.length).toBe(0);
    });
  });

  test.describe('Smart Wizard Workflow', () => {
    test('should open smart wizard modal', async ({ page }) => {
      // Click button to open wizard
      await page.click('[data-testid="open-smart-wizard-btn"]');

      // Wait for modal to appear
      await expect(page.locator('[data-testid="smart-wizard-modal"]')).toBeVisible();

      // Verify modal header
      await expect(page.locator('[data-testid="wizard-title"]')).toContainText('Smart Wizard');
    });

    test('should close smart wizard modal', async ({ page }) => {
      await page.click('[data-testid="open-smart-wizard-btn"]');
      await expect(page.locator('[data-testid="smart-wizard-modal"]')).toBeVisible();

      await page.click('[data-testid="close-wizard-btn"]');
      await expect(page.locator('[data-testid="smart-wizard-modal"]')).not.toBeVisible();
    });

    test('should log state changes with timing', async ({ page }) => {
      const logs: string[] = [];
      
      page.on('console', msg => {
        logs.push(msg.text());
      });

      await page.click('[data-testid="open-smart-wizard-btn"]');

      const stateLog = logs.find(log => 
        log.includes('[useBessQuoteBuilder] setShowSmartWizard called: true')
      );
      expect(stateLog).toBeDefined();

      const timingLog = logs.find(log => 
        log.includes('timeSincePageLoad:')
      );
      expect(timingLog).toBeDefined();
    });

    test('should navigate through wizard steps', async ({ page }) => {
      await page.click('[data-testid="open-smart-wizard-btn"]');

      // Step 1: Facility Type
      await page.selectOption('[data-testid="facility-type-select"]', 'office');
      await page.click('[data-testid="wizard-next-btn"]');

      // Step 2: Facility Details
      await expect(page.locator('[data-testid="wizard-step-2"]')).toBeVisible();
      await page.fill('[data-testid="square-footage-input"]', '50000');
      await page.fill('[data-testid="operating-hours-input"]', '12');
      await page.click('[data-testid="wizard-next-btn"]');

      // Step 3: Grid Connection
      await expect(page.locator('[data-testid="wizard-step-3"]')).toBeVisible();
      await page.selectOption('[data-testid="grid-connection-select"]', 'unreliable');
      await page.click('[data-testid="wizard-next-btn"]');

      // Step 4: Additional Options
      await expect(page.locator('[data-testid="wizard-step-4"]')).toBeVisible();
    });
  });

  test.describe('Baseline Configuration', () => {
    test('should calculate baseline for medical office', async ({ page }) => {
      // Fill in facility details
      await page.selectOption('[data-testid="facility-type"]', 'medical_office');
      await page.fill('[data-testid="square-footage"]', '50000');
      await page.fill('[data-testid="operating-hours"]', '12');
      await page.selectOption('[data-testid="grid-connection"]', 'unreliable');
      await page.check('[data-testid="has-restaurant"]');

      // Click calculate button
      await page.click('[data-testid="calculate-baseline-btn"]');

      // Wait for results
      await page.waitForSelector('[data-testid="baseline-results"]', { timeout: 5000 });

      // Verify results displayed
      await expect(page.locator('[data-testid="peak-load"]')).toBeVisible();
      await expect(page.locator('[data-testid="recommended-capacity"]')).toBeVisible();
    });

    test('should not make duplicate baseline API calls', async ({ page }) => {
      const apiCalls: string[] = [];
      
      page.on('request', request => {
        if (request.url().includes('/api/baseline')) {
          apiCalls.push(request.url());
        }
      });

      // Fill form
      await page.selectOption('[data-testid="facility-type"]', 'medical_office');
      await page.fill('[data-testid="square-footage"]', '50000');
      await page.fill('[data-testid="operating-hours"]', '12');

      // Calculate
      await page.click('[data-testid="calculate-baseline-btn"]');
      await page.waitForTimeout(2000);

      // Should only make 1 API call, not 6 like in the logs
      expect(apiCalls.length).toBeLessThanOrEqual(1);
    });

    test('should cache baseline configuration', async ({ page }) => {
      const apiCalls: string[] = [];
      
      page.on('request', request => {
        if (request.url().includes('/api/baseline')) {
          apiCalls.push(request.url());
        }
      });

      // First calculation
      await page.selectOption('[data-testid="facility-type"]', 'medical_office');
      await page.fill('[data-testid="square-footage"]', '50000');
      await page.click('[data-testid="calculate-baseline-btn"]');
      await page.waitForSelector('[data-testid="baseline-results"]');

      const firstCallCount = apiCalls.length;

      // Clear results
      await page.click('[data-testid="clear-results-btn"]');

      // Second calculation with same data
      await page.selectOption('[data-testid="facility-type"]', 'medical_office');
      await page.fill('[data-testid="square-footage"]', '50000');
      await page.click('[data-testid="calculate-baseline-btn"]');
      await page.waitForSelector('[data-testid="baseline-results"]');

      const secondCallCount = apiCalls.length;

      // Should use cache, so no new API calls
      expect(secondCallCount).toBe(firstCallCount);
    });

    test('should display baseline calculation results', async ({ page }) => {
      await page.selectOption('[data-testid="facility-type"]', 'medical_office');
      await page.fill('[data-testid="square-footage"]', '50000');
      await page.fill('[data-testid="operating-hours"]', '12');
      await page.click('[data-testid="calculate-baseline-btn"]');

      await page.waitForSelector('[data-testid="baseline-results"]');

      // Verify all result fields
      const peakLoad = await page.textContent('[data-testid="peak-load"]');
      const averageLoad = await page.textContent('[data-testid="average-load"]');
      const recommendedCapacity = await page.textContent('[data-testid="recommended-capacity"]');

      expect(peakLoad).toBeTruthy();
      expect(averageLoad).toBeTruthy();
      expect(recommendedCapacity).toBeTruthy();
    });
  });

  test.describe('Quote Generation', () => {
    test('should generate complete quote', async ({ page }) => {
      // Fill facility details
      await page.selectOption('[data-testid="facility-type"]', 'medical_office');
      await page.fill('[data-testid="square-footage"]', '50000');
      await page.fill('[data-testid="operating-hours"]', '12');

      // Calculate baseline
      await page.click('[data-testid="calculate-baseline-btn"]');
      await page.waitForSelector('[data-testid="baseline-results"]');

      // Select BESS components
      await page.click('[data-testid="select-battery-btn"]');
      await page.selectOption('[data-testid="battery-capacity"]', '1500');
      await page.selectOption('[data-testid="battery-duration"]', '4');

      // Generate quote
      await page.click('[data-testid="generate-quote-btn"]');
      await page.waitForSelector('[data-testid="quote-results"]', { timeout: 10000 });

      // Verify quote sections
      await expect(page.locator('[data-testid="quote-summary"]')).toBeVisible();
      await expect(page.locator('[data-testid="quote-pricing"]')).toBeVisible();
      await expect(page.locator('[data-testid="quote-products"]')).toBeVisible();
      await expect(page.locator('[data-testid="quote-incentives"]')).toBeVisible();
      await expect(page.locator('[data-testid="quote-financing"]')).toBeVisible();
    });

    test('should include pricing data in quote', async ({ page }) => {
      await page.selectOption('[data-testid="facility-type"]', 'medical_office');
      await page.fill('[data-testid="square-footage"]', '50000');
      await page.click('[data-testid="generate-quote-btn"]');

      await page.waitForSelector('[data-testid="quote-results"]');

      const pricingSection = page.locator('[data-testid="quote-pricing"]');
      await expect(pricingSection).toContainText('$');
      await expect(pricingSection).toContainText('kWh');
    });

    test('should include product recommendations', async ({ page }) => {
      await page.selectOption('[data-testid="facility-type"]', 'medical_office');
      await page.fill('[data-testid="square-footage"]', '50000');
      await page.click('[data-testid="generate-quote-btn"]');

      await page.waitForSelector('[data-testid="quote-results"]');

      const productCount = await page.locator('[data-testid="product-card"]').count();
      expect(productCount).toBeGreaterThan(0);
    });

    test('should include financing options', async ({ page }) => {
      await page.selectOption('[data-testid="facility-type"]', 'medical_office');
      await page.fill('[data-testid="square-footage"]', '50000');
      await page.click('[data-testid="generate-quote-btn"]');

      await page.waitForSelector('[data-testid="quote-results"]');

      const financingOptions = await page.locator('[data-testid="financing-option"]').count();
      expect(financingOptions).toBeGreaterThan(0);
    });

    test('should include incentive information', async ({ page }) => {
      await page.selectOption('[data-testid="facility-type"]', 'medical_office');
      await page.fill('[data-testid="square-footage"]', '50000');
      await page.click('[data-testid="generate-quote-btn"]');

      await page.waitForSelector('[data-testid="quote-results"]');

      const incentives = page.locator('[data-testid="incentive-item"]');
      await expect(incentives.first()).toBeVisible();
    });
  });

  test.describe('Performance', () => {
    test('should load page within 3 seconds', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(3000);
    });

    test('should complete baseline calculation quickly', async ({ page }) => {
      await page.selectOption('[data-testid="facility-type"]', 'medical_office');
      await page.fill('[data-testid="square-footage"]', '50000');

      const startTime = Date.now();
      await page.click('[data-testid="calculate-baseline-btn"]');
      await page.waitForSelector('[data-testid="baseline-results"]');
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(2000);
    });

    test('should not have excessive component re-renders', async ({ page }) => {
      const renderLogs: string[] = [];
      
      page.on('console', msg => {
        if (msg.text().includes('Rendering AdvancedQuoteBuilder')) {
          renderLogs.push(msg.text());
        }
      });

      // Trigger state changes
      await page.click('[data-testid="open-smart-wizard-btn"]');
      await page.waitForTimeout(500);
      await page.click('[data-testid="close-wizard-btn"]');
      await page.waitForTimeout(500);

      // Should have reasonable number of renders
      expect(renderLogs.length).toBeLessThan(10);
    });
  });

  test.describe('Error Handling', () => {
    test('should handle baseline API failure gracefully', async ({ page }) => {
      // Mock API to fail
      await page.route('**/api/baseline', route => {
        route.abort('failed');
      });

      await page.selectOption('[data-testid="facility-type"]', 'medical_office');
      await page.fill('[data-testid="square-footage"]', '50000');
      await page.click('[data-testid="calculate-baseline-btn"]');

      // Should show error message
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
      
      const errorText = await page.textContent('[data-testid="error-message"]');
      expect(errorText?.toLowerCase()).toContain('error');
    });

    test('should handle missing data gracefully', async ({ page }) => {
      // Try to calculate without required fields
      await page.click('[data-testid="calculate-baseline-btn"]');

      // Should show validation errors
      await expect(page.locator('[data-testid="validation-error"]')).toBeVisible();
    });

    test('should recover from temporary failures', async ({ page }) => {
      let callCount = 0;

      await page.route('**/api/baseline', route => {
        callCount++;
        if (callCount === 1) {
          route.abort('failed');
        } else {
          route.continue();
        }
      });

      await page.selectOption('[data-testid="facility-type"]', 'medical_office');
      await page.fill('[data-testid="square-footage"]', '50000');

      // First attempt fails
      await page.click('[data-testid="calculate-baseline-btn"]');
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible();

      // Retry succeeds
      await page.click('[data-testid="retry-btn"]');
      await page.waitForSelector('[data-testid="baseline-results"]');
      
      await expect(page.locator('[data-testid="baseline-results"]')).toBeVisible();
    });
  });

  test.describe('User Workflows', () => {
    test('should complete full medical office workflow', async ({ page }) => {
      // Step 1: Open wizard
      await page.click('[data-testid="open-smart-wizard-btn"]');

      // Step 2: Select facility type
      await page.selectOption('[data-testid="facility-type-select"]', 'medical_office');
      await page.click('[data-testid="wizard-next-btn"]');

      // Step 3: Enter details
      await page.fill('[data-testid="square-footage-input"]', '50000');
      await page.fill('[data-testid="operating-hours-input"]', '12');
      await page.click('[data-testid="wizard-next-btn"]');

      // Step 4: Grid connection
      await page.selectOption('[data-testid="grid-connection-select"]', 'unreliable');
      await page.check('[data-testid="has-restaurant-checkbox"]');
      await page.click('[data-testid="wizard-finish-btn"]');

      // Verify results
      await page.waitForSelector('[data-testid="baseline-results"]');
      await expect(page.locator('[data-testid="baseline-results"]')).toBeVisible();
    });

    test('should save and retrieve quote', async ({ page }) => {
      // Generate quote
      await page.selectOption('[data-testid="facility-type"]', 'medical_office');
      await page.fill('[data-testid="square-footage"]', '50000');
      await page.click('[data-testid="generate-quote-btn"]');
      await page.waitForSelector('[data-testid="quote-results"]');

      // Save quote
      await page.click('[data-testid="save-quote-btn"]');
      await expect(page.locator('[data-testid="save-success"]')).toBeVisible();

      // Get quote ID
      const quoteId = await page.textContent('[data-testid="quote-id"]');

      // Navigate away
      await page.goto('/dashboard');

      // Retrieve quote
      await page.fill('[data-testid="search-quote-input"]', quoteId || '');
      await page.click('[data-testid="search-quote-btn"]');

      // Verify quote loaded
      await expect(page.locator('[data-testid="quote-results"]')).toBeVisible();
    });

    test('should export quote as PDF', async ({ page }) => {
      // Generate quote
      await page.selectOption('[data-testid="facility-type"]', 'medical_office');
      await page.fill('[data-testid="square-footage"]', '50000');
      await page.click('[data-testid="generate-quote-btn"]');
      await page.waitForSelector('[data-testid="quote-results"]');

      // Export PDF
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.click('[data-testid="export-pdf-btn"]')
      ]);

      expect(download).toBeTruthy();
      expect(download.suggestedFilename()).toContain('.pdf');
    });
  });
});
