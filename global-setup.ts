/**
 * Playwright Global Setup
 * Runs once before all tests
 */

import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global setup for E2E tests...');

  const { baseURL } = config.projects[0].use;
  
  // Launch browser for setup
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Navigate to the app
    console.log(`📍 Navigating to: ${baseURL}`);
    await page.goto(baseURL || 'http://localhost:5173', { 
      waitUntil: 'networkidle',
      timeout: 60000 
    });

    // Wait for app to be ready
    console.log('⏳ Waiting for application to initialize...');
    await page.waitForTimeout(3000);

    // Check if app loaded successfully
    const title = await page.title();
    console.log(`✅ Application loaded: ${title}`);

    // Optional: Set up test data or authentication state
    console.log('🔧 Setting up test environment...');
    
    // Mark app as initialized
    await page.evaluate(() => {
      window.localStorage.setItem('app_initialized', 'true');
      window.localStorage.setItem('test_mode', 'true');
    });

    // Optional: Create authenticated state if needed
    // await page.context().storageState({ path: 'playwright/.auth/user.json' });

    console.log('✅ Global setup complete');
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;
