import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for V7 Wizard Smoke Tests
 * 
 * Run with: npx playwright test --config=tests/smoke/playwright.smoke.config.ts
 */
const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:5184';

export default defineConfig({
  testDir: '.', // Current directory (tests/smoke)
  
  timeout: 60 * 1000, // 60 seconds per test
  
  fullyParallel: false, // Run sequentially for determinism
  
  forbidOnly: !!process.env.CI,
  
  retries: process.env.CI ? 1 : 0,
  
  workers: 1, // Single worker for smoke tests
  
  reporter: [
    ['list'], // Console output
    ['html', { outputFolder: '../../playwright-report/smoke' }],
  ],
  
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },
  
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  
  // No web server - expect dev server already running on port 5184
});
