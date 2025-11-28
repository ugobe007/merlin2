// Global setup for Playwright tests
export default async function globalSetup() {
  console.log('🚀 Starting test environment setup...');
  // Add any global setup here if needed
  return async () => {
    console.log('✅ Test environment teardown complete');
  };
}
