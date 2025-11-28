# BESS Quote Builder - Test Suite Documentation

## Overview

This test suite addresses critical issues identified in console logs and provides comprehensive testing for the BESS (Battery Energy Storage Systems) Quote Builder application.

## Issues Identified from Console Logs

### 🔴 Critical Issues

1. **Duplicate BaselineService Calls**
   - **Issue**: BaselineService.fetchConfiguration called 6 times with identical parameters
   - **Impact**: Performance degradation, unnecessary API calls
   - **Location**: `baselineService.ts:216-218`
   - **Test Coverage**: `bess-workflow-tests.test.ts` - "should fetch configuration only once for identical parameters"

2. **Multiple Supabase Client Instances**
   - **Issue**: Multiple GoTrueClient instances detected in same browser context
   - **Impact**: Undefined behavior, potential state conflicts
   - **Location**: `@supabase_supabase-js.js:8252`
   - **Test Coverage**: `bess-workflow-e2e.spec.ts` - "should not create multiple Supabase client instances"

### ⚠️ Performance Issues

3. **Excessive Component Re-renders**
   - **Issue**: AdvancedQuoteBuilder rendering multiple times unnecessarily
   - **Impact**: UI lag, poor user experience
   - **Location**: `BessQuoteBuilder.tsx:830`
   - **Test Coverage**: Performance tests for re-render detection

4. **Node Module Compatibility Warnings**
   - **Issue**: Stream, timers, and events modules externalized for browser
   - **Impact**: RSS parser functionality may be limited
   - **Location**: `rss-parser.js`
   - **Recommendation**: Consider alternative RSS parsing library for browser

## Test Suite Structure

```
tests/
├── unit/
│   └── workflow.test.ts             # Unit & Integration Tests
├── e2e/
│   └── bess-quote-builder.test.ts   # End-to-End Tests
├── utils/
│   └── test-helpers.ts              # Test Utilities & Mocks
├── setup.ts                         # Global Test Setup
└── README.md                        # This file
```

## Installation

```bash
# Install test dependencies
npm install --save-dev vitest @vitest/ui @testing-library/react @testing-library/react-hooks @testing-library/user-event @testing-library/jest-dom jsdom

# For E2E tests
npm install --save-dev @playwright/test

# Install Playwright browsers (first time only)
npx playwright install
```

## Running Tests

### Unit & Integration Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests with UI
npm run test:ui

# Run specific test file
npm run test workflow.test.ts
```

### End-to-End Tests

```bash
# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run E2E tests in headed mode
npm run test:e2e:headed
```

## Package.json Scripts

Add these to your `package.json`:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed"
  }
}
```

## Test Categories

### 1. Baseline Service Tests
Tests for configuration fetching, caching, and duplicate call prevention.

**Key Tests:**
- ✅ Configuration caching
- ✅ Duplicate call detection
- ✅ Use case data validation
- ✅ Cache management

**Priority Fix - Request Deduplication:**
```typescript
// Implement in baselineService.ts
class BaselineService {
  private pendingRequests = new Map<string, Promise<any>>();
  
  async fetchConfiguration(useCase: string, data: any) {
    const key = this.getCacheKey(useCase, data);
    
    // Check for pending request
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key);
    }
    
    // Check cache
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }
    
    // Make new request
    const promise = this.makeRequest(useCase, data);
    this.pendingRequests.set(key, promise);
    
    try {
      const result = await promise;
      this.cache.set(key, result);
      return result;
    } finally {
      this.pendingRequests.delete(key);
    }
  }
}
```

### 2. AI Data Collection Tests
Tests for daily update workflow, data fetching, and scheduling.

**Key Tests:**
- ✅ Parallel data fetching
- ✅ Update completion time
- ✅ Data collection results
- ✅ Next collection scheduling
- ✅ Error handling

**Expected Results:**
- Pricing: 3 items
- Products: 9 items
- Financing: 2 items
- News: 14 items
- Incentives: 3 items
- Total time: < 1 second

### 3. Smart Wizard State Management
Tests for modal state, timing tracking, and user interactions.

**Key Tests:**
- ✅ Page load time tracking
- ✅ Modal visibility toggling
- ✅ State change logging
- ✅ Call stack verification

### 4. Performance Tests
Tests to ensure application meets performance benchmarks.

**Benchmarks:**
- Baseline fetch: < 200ms
- Component renders: < 10 per action
- Page load: < 3 seconds
- Daily update: < 2 seconds

### 5. Integration Tests
End-to-end workflow testing from initialization to quote generation.

**Workflows Tested:**
- ✅ Service initialization
- ✅ Data collection
- ✅ Baseline calculation
- ✅ Quote generation
- ✅ Error recovery

## Mock Data

The test suite includes comprehensive mock data for:
- Use case configurations (car-wash, hotel, data-center, office-building)
- Baseline calculation results
- AI data collection results
- Quote generation outputs

See `tests/utils/test-helpers.ts` for all mock data structures.

## Performance Monitoring

```typescript
import { PerformanceMonitor } from '@/tests/utils/test-helpers';

const monitor = new PerformanceMonitor();

test('should track performance', async () => {
  const start = Date.now();
  await someOperation();
  monitor.recordMetric('operation', Date.now() - start);
  
  monitor.report();
});
```

## Debugging Tips

### Enable Verbose Logging
```typescript
// In test file
import { captureConsoleLogs } from '@/tests/utils/test-helpers';

const { logs, restore } = captureConsoleLogs();
// ... run tests ...
console.log(logs);
restore();
```

### Debug Specific Tests
```bash
# Run single test
npm run test -- -t "should fetch configuration only once"

# Debug mode
node --inspect-brk ./node_modules/.bin/vitest run
```

### View Test UI
```bash
npm run test:ui
# Opens browser with interactive test runner
```

## Continuous Integration

### GitHub Actions Example
```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run test:coverage
      - run: npx playwright install
      - run: npm run test:e2e
```

## Coverage Reports

After running `npm run test:coverage`, view reports at:
- HTML: `./coverage/index.html`
- JSON: `./coverage/coverage-final.json`
- LCOV: `./coverage/lcov.info`

**Current Coverage Thresholds:**
- Lines: 70%
- Functions: 70%
- Branches: 70%
- Statements: 70%

## Recommended Fixes

### Priority 1: Duplicate BaselineService Calls ⚠️
**Issue**: 6 identical calls to fetchConfiguration
**Solution**: Implement request deduplication

```typescript
// In baselineService.ts
private pendingRequests = new Map<string, Promise<any>>();

async fetchConfiguration(useCase: string, useCaseData: any) {
  const cacheKey = this.getCacheKey(useCase, useCaseData);
  
  // Return pending request if exists
  if (this.pendingRequests.has(cacheKey)) {
    return this.pendingRequests.get(cacheKey);
  }
  
  // Create new request
  const promise = this.makeApiRequest(useCase, useCaseData);
  this.pendingRequests.set(cacheKey, promise);
  
  try {
    const result = await promise;
    this.cache.set(cacheKey, result);
    return result;
  } finally {
    this.pendingRequests.delete(cacheKey);
  }
}
```

### Priority 2: Supabase Client Singleton ⚠️
**Issue**: Multiple GoTrueClient instances
**Solution**: Implement singleton pattern

```typescript
// supabaseClient.ts
let instance: SupabaseClient | null = null;

export function getSupabaseClient() {
  if (!instance) {
    instance = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY
    );
  }
  return instance;
}
```

### Priority 3: Component Re-render Optimization 🔧
**Issue**: AdvancedQuoteBuilder rendering multiple times
**Solution**: Use React.memo and useCallback

```typescript
const AdvancedQuoteBuilder = React.memo(({ showModal, onClose, data }) => {
  const processedData = useMemo(() => 
    data.map(item => ({ ...item, calculated: item.value * 2 })),
    [data]
  );
  
  if (!showModal) return null;
  
  return <Modal>...</Modal>;
});

// In parent component
const handleClose = useCallback(() => setShowModal(false), []);
```

## Known Issues

1. **RSS Parser Warnings**: Browser compatibility warnings are expected. Consider using a browser-specific RSS library or fetching RSS on the server side.

2. **Test Flakiness**: Some E2E tests may be flaky due to timing. Adjust timeout values in `playwright.config.ts` if needed.

3. **Coverage Thresholds**: Currently set to 70%. Adjust in `vitest.config.ts` as needed.

## Test File Locations

After implementation, tests will be located at:
- **Unit Tests**: `tests/unit/workflow.test.ts`
- **E2E Tests**: `tests/e2e/bess-quote-builder.test.ts`
- **Utilities**: `tests/utils/test-helpers.ts`
- **Setup**: `tests/setup.ts`

## Quick Start

```bash
# 1. Install dependencies
npm install --save-dev vitest @vitest/ui @testing-library/react @testing-library/jest-dom jsdom @playwright/test

# 2. Install Playwright browsers
npx playwright install

# 3. Run unit tests
npm run test

# 4. Run E2E tests
npm run test:e2e

# 5. View coverage
npm run test:coverage
open coverage/index.html
```

## Contributing

When adding new features:
1. Write tests first (TDD approach)
2. Ensure all tests pass
3. Maintain coverage above 70%
4. Update this README if adding new test categories

## Support

For issues or questions:
1. Check console logs for specific error messages
2. Review test output for failure details
3. Use `npm run test:ui` for interactive debugging
4. Check Playwright trace files for E2E failures

## Test Maintenance

- Update mock data when API responses change
- Review and update performance benchmarks quarterly
- Add new test cases for bug fixes
- Remove obsolete tests when features are deprecated
