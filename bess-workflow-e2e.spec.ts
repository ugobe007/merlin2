import { test, expect, Page } from '@playwright/test';

/**
 * End-to-End Tests for BESS Quote Builder
 * Tests the complete user workflow from opening the app to generating a quote
 */

test.describe('BESS Quote Builder E2E', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    await page.goto('http://localhost:5173'); // Vite default port
    
    // Wait for initial data collection to complete
    await page.waitForSelector('[data-testid="app-ready"]', { timeout: 10000 });
  });

  test.describe('Application Initialization', () => {
    test('should initialize all services on load', async () => {
      // Check console logs for service initialization
      const logs: string[] = [];
      
      page.on('console', msg => {
        logs.push(msg.text());
      });

      await page.reload();

      // Wait for key initialization messages
      await page.waitForTimeout(2000);

      expect(logs.some(log => log.includes('Cache cleared'))).toBeTruthy();
      expect(logs.some(log => log.includes('AI Data Collection] Service initialized'))).toBeTruthy();
      expect(logs.some(log => log.includes('Daily update complete'))).toBeTruthy();
    });

    test('should complete AI data collection within 2 seconds', async () => {
      const startTime = Date.now();
      
      await page.waitForFunction(() => {
        return window.console.toString().includes('Daily update complete');
      }, { timeout: 3000 });

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(2000);
    });

    test('should not create multiple Supabase client instances', async () => {
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

      // Should not have this warning
      expect(supabaseWarnings.length).toBe(0);
    });
  });

  test.describe('Smart Wizard Workflow', () => {
    test('should open smart wizard when requested', async () => {
      // Click button to open wizard
      await page.click('[data-testid="open-smart-wizard"]');

      // Verify wizard is visible
      await expect(page.locator('[data-testid="smart-wizard"]')).toBeVisible();

      // Check console log
      const logs: string[] = [];
      page.on('console', msg => logs.push(msg.text()));

      expect(logs.some(log => 
        log.includes('[useBessQuoteBuilder] setShowSmartWizard called: true')
      )).toBeTruthy();
    });

    test('should close smart wizard when dismissed', async () => {
      await page.click('[data-testid="open-smart-wizard"]');
      await expect(page.locator('[data-testid="smart-wizard"]')).toBeVisible();

      await page.click('[data-testid="close-smart-wizard"]');
      await expect(page.locator('[data-testid="smart-wizard"]')).not.toBeVisible();
    });

    test('should track time since page load', async () => {
      const logs: string[] = [];
      
      page.on('console', msg => {
        logs.push(msg.text());
      });

      await page.click('[data-testid="open-smart-wizard"]');

      const timeLog = logs.find(log => log.includes('timeSincePageLoad'));
      expect(timeLog).toBeDefined();
      expect(timeLog).toMatch(/timeSincePageLoad: \d+ ms/);
    });
  });

  test.describe('Baseline Configuration', () => {
    test('should fetch baseline for medical office facility', async () => {
      // Fill in facility details
      await page.fill('[data-testid="square-footage"]', '50000');
      await page.selectOption('[data-testid="facility-type"]', 'medical_office');
      await page.fill('[data-testid="operating-hours"]', '12');
      await page.selectOption('[data-testid="grid-connection"]', 'unreliable');
      await page.check('[data-testid="has-restaurant"]');

      // Trigger baseline fetch
      await page.click('[data-testid="calculate-baseline"]');

      // Wait for baseline to be calculated
      await page.waitForSelector('[data-testid="baseline-result"]', { timeout: 5000 });

      // Verify result is displayed
      const baselineResult = await page.textContent('[data-testid="baseline-result"]');
      expect(baselineResult).not.toBeNull();
    });

    test('should cache baseline configuration', async () => {
      const logs: string[] = [];
      
      page.on('console', msg => {
        if (msg.text().includes('[BaselineService]')) {
          logs.push(msg.text());
        }
      });

      // First calculation
      await page.fill('[data-testid="square-footage"]', '50000');
      await page.selectOption('[data-testid="facility-type"]', 'medical_office');
      await page.click('[data-testid="calculate-baseline"]');
      await page.waitForTimeout(1000);

      const initialCallCount = logs.filter(log => 
        log.includes('Fetching configuration for: office')
      ).length;

      // Clear logs
      logs.length = 0;

      // Second calculation with same data
      await page.click('[data-testid="calculate-baseline"]');
      await page.waitForTimeout(1000);

      const cachedCallCount = logs.filter(log => 
        log.includes('Fetching configuration for: office')
      ).length;

      // Should have fewer calls due to caching
      expect(cachedCallCount).toBeLessThanOrEqual(initialCallCount);
    });

    test('should not make duplicate baseline calls', async () => {
      const baselineCalls: string[] = [];
      
      page.on('console', msg => {
        if (msg.text().includes('Fetching configuration for: office')) {
          baselineCalls.push(msg.text());
        }
      });

      await page.fill('[data-testid="square-footage"]', '50000');
      await page.selectOption('[data-testid="facility-type"]', 'medical_office');
      await page.click('[data-testid="calculate-baseline"]');
      
      await page.waitForTimeout(2000);

      // Should not have 6 identical calls as seen in logs
      expect(baselineCalls.length).toBeLessThanOrEqual(2);
    });
  });

  test.describe('Complete Quote Generation', () => {
    test('should generate quote with all data sources', async () => {
      // Fill in facility details
      await page.fill('[data-testid="square-footage"]', '50000');
      await page.selectOption('[data-testid="facility-type"]', 'medical_office');
      await page.fill('[data-testid="operating-hours"]', '12');

      // Select BESS components
      await page.click('[data-testid="select-battery-system"]');
      await page.selectOption('[data-testid="battery-capacity"]', '1000');
      await page.selectOption('[data-testid="battery-duration"]', '4');

      // Generate quote
      await page.click('[data-testid="generate-quote"]');

      // Wait for quote to be generated
      await page.waitForSelector('[data-testid="quote-result"]', { timeout: 10000 });

      // Verify quote contains expected sections
      await expect(page.locator('[data-testid="quote-pricing"]')).toBeVisible();
      await expect(page.locator('[data-testid="quote-products"]')).toBeVisible();
      await expect(page.locator('[data-testid="quote-incentives"]')).toBeVisible();
    });

    test('should include financing options in quote', async () => {
      await page.fill('[data-testid="square-footage"]', '50000');
      await page.selectOption('[data-testid="facility-type"]', 'medical_office');
      await page.click('[data-testid="generate-quote"]');

      await page.waitForSelector('[data-testid="quote-result"]');

      // Verify financing section
      await expect(page.locator('[data-testid="financing-options"]')).toBeVisible();
      
      const financingOptions = await page.locator('[data-testid="financing-option"]').count();
      expect(financingOptions).toBeGreaterThan(0);
    });
  });

  test.describe('Performance Monitoring', () => {
    test('should complete page load within 3 seconds', async () => {
      const startTime = Date.now();
      
      await page.goto('http://localhost:5173');
      await page.waitForLoadState('networkidle');

      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(3000);
    });

    test('should not have excessive console warnings', async () => {
      const warnings: string[] = [];
      
      page.on('console', msg => {
        if (msg.type() === 'warning') {
          warnings.push(msg.text());
        }
      });

      await page.reload();
      await page.waitForTimeout(2000);

      // Filter out known Vite module warnings (acceptable)
      const criticalWarnings = warnings.filter(w => 
        !w.includes('Module') && 
        !w.includes('externalized for browser compatibility')
      );

      // Should have minimal critical warnings
      expect(criticalWarnings.length).toBeLessThan(5);
    });

    test('should render components without excessive re-renders', async () => {
      const renderLogs: string[] = [];
      
      page.on('console', msg => {
        if (msg.text().includes('Rendering AdvancedQuoteBuilder')) {
          renderLogs.push(msg.text());
        }
      });

      // Trigger state change
      await page.click('[data-testid="open-smart-wizard"]');
      await page.click('[data-testid="close-smart-wizard"]');

      await page.waitForTimeout(500);

      // Should have reasonable number of renders (not 10+)
      expect(renderLogs.length).toBeLessThan(10);
    });
  });

  test.describe('Error Handling', () => {
    test('should handle API failures gracefully', async () => {
      // Mock API failure
      await page.route('**/api/baseline', route => {
        route.abort('failed');
      });

      await page.fill('[data-testid="square-footage"]', '50000');
      await page.click('[data-testid="calculate-baseline"]');

      // Should show error message
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
      
      const errorText = await page.textContent('[data-testid="error-message"]');
      expect(errorText).toContain('error');
    });

    test('should continue with partial data if one source fails', async () => {
      // Mock one API to fail
      await page.route('**/api/products', route => {
        route.abort('failed');
      });

      await page.reload();
      await page.waitForTimeout(2000);

      // Should still show other data sources as loaded
      const logs: string[] = [];
      page.on('console', msg => logs.push(msg.text()));

      const successfulUpdates = logs.filter(log => log.includes('✅'));
      expect(successfulUpdates.length).toBeGreaterThan(0);
    });
  });
});

test.describe('Data Collection Scheduling', () => {
  test('should schedule next collection for 2:00 AM', async ({ page }) => {
    const logs: string[] = [];
    
    page.on('console', msg => {
      if (msg.text().includes('Next collection scheduled')) {
        logs.push(msg.text());
      }
    });

    await page.goto('http://localhost:5173');
    await page.waitForTimeout(2000);

    const scheduleLog = logs.find(log => log.includes('Next collection scheduled'));
    expect(scheduleLog).toBeDefined();
    expect(scheduleLog).toMatch(/2:00:00 AM/);
  });
});
