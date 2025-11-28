/**
 * Playwright Global Teardown
 * Runs once after all tests
 */

import { FullConfig } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global teardown...');

  try {
    // Clean up test artifacts if needed
    console.log('🗑️ Cleaning up test artifacts...');

    // Optional: Clean up authentication state
    const authPath = path.join(__dirname, '../../playwright/.auth');
    if (fs.existsSync(authPath)) {
      fs.rmSync(authPath, { recursive: true, force: true });
      console.log('✅ Cleaned up authentication state');
    }

    // Optional: Clean up temporary test data
    console.log('✅ Test cleanup complete');

    // Generate summary
    console.log('\n📊 Test Run Summary:');
    console.log('  Test directory:', config.projects[0].testDir);
    console.log('  Browser(s):', config.projects.map(p => p.name).join(', '));
    console.log('  Base URL:', config.projects[0].use.baseURL);

    console.log('✅ Global teardown complete');
  } catch (error) {
    console.error('❌ Global teardown error:', error);
    // Don't throw - teardown errors shouldn't fail the test run
  }
}

export default globalTeardown;
