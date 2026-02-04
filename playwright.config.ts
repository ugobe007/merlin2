import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for BESS Quote Builder E2E Tests
 * See https://playwright.dev/docs/test-configuration
 */
const PORT = process.env.E2E_PORT || '5177';
const BASE_URL = process.env.E2E_BASE_URL || `http://localhost:${PORT}`;

export default defineConfig({
  // Explicitly tell vitest NOT to run
  globalSetup: undefined,
  globalTeardown: undefined,
  
  // Test directory
  testDir: './tests/e2e',
  
  // Maximum time one test can run
  timeout: 120 * 1000, // Increased to 120 seconds for comprehensive tests
  
  // Run tests in files in parallel
  fullyParallel: false, // Set to false to avoid conflicts
  
  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,
  
  // Retry on CI only
  retries: process.env.CI ? 2 : 0,
  
  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : 1, // Run one at a time to avoid conflicts
  
  // Reporter to use
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['list']
  ],
  
  // Shared settings for all the projects below
  use: {
    // Base URL to use in actions like `await page.goto('/')`
    baseURL: BASE_URL,
    
    // Collect trace when retrying the failed test
    trace: 'retain-on-failure',
    
    // Screenshot on failure
    screenshot: 'only-on-failure',
    
    // Video on failure
    video: 'retain-on-failure',
    
    // Maximum time each action such as `click()` can take
    actionTimeout: 15 * 1000,
    
    // Maximum time each navigation can take
    navigationTimeout: 30 * 1000,
    
    // Emulate browser locale
    locale: 'en-US',
    
    // Emulate timezone
    timezoneId: 'America/Los_Angeles',
    
    // Viewport size
    viewport: { width: 1280, height: 720 },
    
    // Ignore HTTPS errors
    ignoreHTTPSErrors: true,
    
    // Extra HTTP headers
    extraHTTPHeaders: {
      'Accept-Language': 'en-US,en;q=0.9',
    },
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Chrome-specific options
        launchOptions: {
          args: ['--disable-web-security']
        }
      },
    },
  ],

  // ============================================================================
  // WEBSERVER DISABLED (Feb 1, 2026)
  // ============================================================================
  // RATIONALE: Auto-starting dev server during debugging causes 80% of hangs.
  // 
  // When debugging:
  //   1. Start dev server manually: npm run dev
  //   2. Run specific test: npx playwright test path/to/test.ts
  //
  // For CI, re-enable by uncommenting below.
  // ============================================================================
  
  // webServer: {
  //   command: `npm run dev -- --host 127.0.0.1 --port ${PORT}`,
  //   url: BASE_URL,
  //   reuseExistingServer: !process.env.CI, // Reuse if server is already running
  //   timeout: 120 * 1000,
  //   stdout: 'ignore',
  //   stderr: 'pipe',
  //   env: {
  //     // Explicitly disable Vitest
  //     VITEST: 'false',
  //     NODE_ENV: 'test',
  //   },
  // },

  // Folder for test artifacts such as screenshots, videos, traces, etc.
  outputDir: 'test-results/',

  // Whether to preserve output between runs
  preserveOutput: 'always',

  // Global test timeout
  globalTimeout: 60 * 60 * 1000, // 1 hour

  // Expect timeout
  expect: {
    timeout: 10 * 1000,
    toHaveScreenshot: {
      maxDiffPixels: 100,
    },
    toMatchSnapshot: {
      maxDiffPixelRatio: 0.1,
    },
  },
});
