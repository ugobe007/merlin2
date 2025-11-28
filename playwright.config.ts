import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for BESS Quote Builder E2E Tests
 * See https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // Test directory
  testDir: './tests/e2e',
  
  // Maximum time one test can run
  timeout: 30 * 1000,
  
  // Run tests in files in parallel
  fullyParallel: true,
  
  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,
  
  // Retry on CI only
  retries: process.env.CI ? 2 : 0,
  
  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter to use
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['list']
  ],
  
  // Shared settings for all the projects below
  use: {
    // Base URL to use in actions like `await page.goto('/')`
    baseURL: process.env.BASE_URL || 'http://localhost:5177',
    
    // Collect trace when retrying the failed test
    trace: 'on-first-retry',
    
    // Screenshot on failure
    screenshot: 'only-on-failure',
    
    // Video on failure
    video: 'retain-on-failure',
    
    // Maximum time each action such as `click()` can take
    actionTimeout: 10 * 1000,
    
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

    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
      },
    },

    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
      },
    },

    // Test against mobile viewports
    {
      name: 'Mobile Chrome',
      use: { 
        ...devices['Pixel 5'],
      },
    },
    {
      name: 'Mobile Safari',
      use: { 
        ...devices['iPhone 12'],
      },
    },

    // Test against branded browsers
    {
      name: 'Microsoft Edge',
      use: { 
        ...devices['Desktop Edge'],
        channel: 'msedge'
      },
    },
    {
      name: 'Google Chrome',
      use: { 
        ...devices['Desktop Chrome'],
        channel: 'chrome'
      },
    },
  ],

  // Commented out - run dev server manually before tests
  // webServer: {
  //   command: 'npm run dev',
  //   url: 'http://localhost:5178',
  //   reuseExistingServer: !process.env.CI,
  //   timeout: 120 * 1000,
  //   stdout: 'ignore',
  //   stderr: 'pipe',
  // },

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
    timeout: 5 * 1000,
    toHaveScreenshot: {
      maxDiffPixels: 100,
    },
    toMatchSnapshot: {
      maxDiffPixelRatio: 0.1,
    },
  },

  // Network settings
  use: {
    ...devices['Desktop Chrome'],
    
    // Emulate network conditions
    // Uncomment to test with slow network
    // launchOptions: {
    //   args: ['--disable-web-security']
    // },
    
    // Context options
    baseURL: process.env.BASE_URL || 'http://localhost:5173',
    
    // Artifacts
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    
    // Browser context options
    storageState: undefined,
    
    // Extra HTTP headers
    extraHTTPHeaders: {
      'Accept-Language': 'en-US,en;q=0.9',
    },
    
    // Geolocation
    geolocation: { longitude: -115.1398, latitude: 36.1699 }, // Las Vegas
    permissions: ['geolocation'],
  },
});
