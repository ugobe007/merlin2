import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for BESS Quote Builder E2E Tests
 * See https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // Test directory
  testDir: './tests/e2e',
  
  // Maximum time one test can run (increased for wizard flow)
  timeout: 120 * 1000, // 2 minutes
  
  // Run tests in files in parallel
  fullyParallel: false, // Disable parallel for wizard tests to avoid server conflicts
  
  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,
  
  // Retry on CI only
  retries: process.env.CI ? 2 : 0,
  
  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : 1, // Single worker to avoid server conflicts
  
  // Reporter to use
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['list']
  ],
  
  // Shared settings for all the projects below
  use: {
    // Base URL to use in actions like `await page.goto('/')`
    baseURL: process.env.TEST_URL || process.env.BASE_URL || 'http://localhost:5177',
    
    // Collect trace when retrying the failed test
    trace: 'on-first-retry',
    
    // Screenshot on failure
    screenshot: 'only-on-failure',
    
    // Video on failure
    video: 'retain-on-failure',
    
    // Maximum time each action such as `click()` can take
    actionTimeout: 15 * 1000, // Increased for slow interactions
    
    // Maximum time each navigation can take
    navigationTimeout: 60 * 1000, // Increased for slow page loads
    
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
    
    // Geolocation
    geolocation: { longitude: -115.1398, latitude: 36.1699 }, // Las Vegas
    permissions: ['geolocation'],
  },

  // Configure projects for major browsers (simplified to just Chromium for now)
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

  // Run dev server automatically before tests
  webServer: {
    command: 'npm run dev',
    url: process.env.TEST_URL || process.env.BASE_URL || 'http://localhost:5177',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    stdout: 'pipe',
    stderr: 'pipe',
  },

  // Global setup and teardown
  globalSetup: './tests/utils/global-setup.ts',
  globalTeardown: './tests/utils/global-teardown.ts',

  // Folder for test artifacts such as screenshots, videos, traces, etc.
  outputDir: 'test-results/',

  // Whether to preserve output between runs
  preserveOutput: 'always',

  // Global test timeout
  globalTimeout: 60 * 60 * 1000, // 1 hour

  // Expect timeout
  expect: {
    timeout: 10 * 1000, // Increased for slow assertions
    toHaveScreenshot: {
      maxDiffPixels: 100,
    },
    toMatchSnapshot: {
      maxDiffPixelRatio: 0.1,
    },
  },
});
