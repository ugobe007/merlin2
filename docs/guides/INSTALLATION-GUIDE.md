# Complete Test Suite Setup Guide

## 📁 File Structure Overview

Your test suite is now organized as follows:

```
project-root/
├── tests/
│   ├── unit/
│   │   └── workflow.test.ts           # Unit & integration tests
│   ├── e2e/
│   │   └── bess-quote-builder.test.ts # E2E Playwright tests
│   └── utils/
│       ├── test-helpers.ts            # Mock services & utilities
│       ├── global-setup.ts            # Playwright global setup
│       └── global-teardown.ts         # Playwright global teardown
├── playwright.config.ts               # Playwright configuration
├── vitest.config.ts                   # Vitest configuration
├── test-setup.ts                      # Global test setup
├── code-fixes.ts                      # Recommended fixes for issues
├── README-TESTS.md                    # Full documentation
└── QUICK-START.md                     # Quick reference guide
```

## 🚀 Step-by-Step Installation

### Step 1: Install Dependencies

```bash
# Install Vitest and testing libraries
npm install --save-dev vitest @vitest/ui @vitest/coverage-v8

# Install React Testing Library
npm install --save-dev @testing-library/react @testing-library/react-hooks @testing-library/jest-dom @testing-library/user-event

# Install Playwright
npm install --save-dev @playwright/test

# Install JSDOM for React component testing
npm install --save-dev jsdom

# Install type definitions
npm install --save-dev @types/node
```

### Step 2: Update package.json

Add the test scripts from `package.json.snippet` to your package.json:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "test:unit": "vitest run tests/unit",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed"
  }
}
```

### Step 3: Install Playwright Browsers

```bash
npx playwright install
```

### Step 4: Copy Test Files

Copy all files to your project root:

```bash
# Copy configuration files to root
cp vitest.config.ts /path/to/your/project/
cp playwright.config.ts /path/to/your/project/
cp test-setup.ts /path/to/your/project/

# Copy test files
cp -r tests/ /path/to/your/project/tests/

# Copy documentation
cp README-TESTS.md /path/to/your/project/
cp QUICK-START.md /path/to/your/project/
cp code-fixes.ts /path/to/your/project/
```

### Step 5: Verify Installation

```bash
# Test that Vitest is set up correctly
npm run test -- --run

# Test that Playwright is set up correctly
npx playwright test --list
```

## ✅ Quick Verification

Run these commands to verify everything works:

```bash
# 1. Run unit tests
npm run test:unit

# 2. Run E2E tests (make sure dev server is running)
npm run dev &
npm run test:e2e

# 3. Check coverage
npm run test:coverage

# 4. Open test UI
npm run test:ui
```

## 🔧 Configuration Adjustments

### Adjust Base URL (if needed)

In `playwright.config.ts`:
```typescript
use: {
  baseURL: 'http://localhost:3000', // Change to your port
}
```

### Adjust Test Timeouts (if needed)

In `vitest.config.ts`:
```typescript
test: {
  testTimeout: 20000, // Increase if tests timeout
}
```

In `playwright.config.ts`:
```typescript
timeout: 60 * 1000, // Increase for slower tests
```

### Add Custom Test Data Attributes

Update your components with test IDs:

```tsx
// Example component
<button data-testid="calculate-baseline-btn">
  Calculate Baseline
</button>

<div data-testid="baseline-results">
  {/* Results */}
</div>
```

## 🐛 Implement Priority Fixes

### Fix #1: Duplicate BaselineService Calls

In your `baselineService.ts`:

```typescript
class BaselineService {
  private pendingRequests = new Map<string, Promise<any>>();
  
  async fetchConfiguration(useCase: string, useCaseData: any) {
    const cacheKey = this.getCacheKey(useCase, useCaseData);
    
    // Prevent duplicate in-flight requests
    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey);
    }
    
    // Check cache
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    // Make new request
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
}
```

### Fix #2: Supabase Singleton

Create `supabaseClient.ts`:

```typescript
import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseInstance) {
    supabaseInstance = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY
    );
  }
  return supabaseInstance;
}
```

Replace all direct `createClient()` calls with `getSupabaseClient()`.

### Fix #3: React Component Optimization

Wrap components with React.memo:

```typescript
import React, { useMemo, useCallback } from 'react';

const AdvancedQuoteBuilder = React.memo(({ showModal, onClose, data }) => {
  const processedData = useMemo(() => {
    return data.map(item => ({ ...item, calculated: item.value * 2 }));
  }, [data]);
  
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);
  
  return (
    <Modal open={showModal} onClose={handleClose}>
      {/* Content */}
    </Modal>
  );
});
```

## 📊 Running Tests in CI/CD

### GitHub Actions Example

Create `.github/workflows/test.yml`:

```yaml
name: Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:coverage
      
      - name: Install Playwright browsers
        run: npx playwright install --with-deps
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: |
            coverage/
            test-results/
            playwright-report/
```

## 🎯 Test Coverage Goals

Target these coverage thresholds:

- **Lines**: 70%+
- **Functions**: 70%+
- **Branches**: 70%+
- **Statements**: 70%+

View coverage report after running:
```bash
npm run test:coverage
open coverage/index.html
```

## 📝 Writing New Tests

### Unit Test Template

```typescript
import { describe, it, expect, beforeEach } from 'vitest';

describe('MyComponent', () => {
  beforeEach(() => {
    // Setup
  });

  it('should do something', () => {
    // Arrange
    const input = 'test';
    
    // Act
    const result = myFunction(input);
    
    // Assert
    expect(result).toBe('expected');
  });
});
```

### E2E Test Template

```typescript
import { test, expect } from '@playwright/test';

test('user workflow', async ({ page }) => {
  await page.goto('/');
  
  await page.click('[data-testid="button"]');
  
  await expect(page.locator('[data-testid="result"]')).toBeVisible();
});
```

## 🔍 Debugging Tests

### Debug Unit Tests

```bash
# Run specific test
npm run test -- -t "should fetch configuration"

# Run with UI
npm run test:ui

# Run in watch mode
npm run test:watch
```

### Debug E2E Tests

```bash
# Run with browser visible
npm run test:e2e:headed

# Run in debug mode (step through)
npm run test:e2e:debug

# Run specific test file
npm run test:e2e tests/e2e/bess-quote-builder.test.ts

# View trace of failed test
npx playwright show-trace trace.zip
```

## 📚 Next Steps

1. ✅ Install all dependencies
2. ✅ Copy test files to project
3. ✅ Verify tests run successfully
4. ✅ Implement the 3 priority fixes
5. ✅ Add data-testid attributes to your components
6. ✅ Run full test suite
7. ✅ Set up CI/CD pipeline
8. ✅ Achieve 70%+ coverage
9. ✅ Add new tests as you add features

## 🆘 Troubleshooting

### "Module not found" errors
```bash
npm install
npm run test -- --run
```

### "Cannot find name 'describe'" in TypeScript
Add to `tsconfig.json`:
```json
{
  "compilerOptions": {
    "types": ["vitest/globals"]
  }
}
```

Or import explicitly:
```typescript
import { describe, it, expect } from 'vitest';
```

### Playwright tests fail immediately
```bash
# Make sure dev server is running
npm run dev

# Or configure webServer in playwright.config.ts
```

### Tests are too slow
```typescript
// In vitest.config.ts
test: {
  maxConcurrency: 10,  // Run more tests in parallel
  pool: 'threads',     // Use thread pool
}
```

## 📞 Support

- **Documentation**: See `README-TESTS.md` for comprehensive docs
- **Quick Reference**: See `QUICK-START.md`
- **Code Fixes**: See `code-fixes.ts` for specific issue fixes
- **Vitest Docs**: https://vitest.dev
- **Playwright Docs**: https://playwright.dev

## ✨ Success Criteria

Your test suite is successfully set up when:

- ✅ `npm run test` runs without errors
- ✅ `npm run test:e2e` completes successfully
- ✅ Coverage reports are generated
- ✅ All priority fixes are implemented
- ✅ No duplicate API calls in logs
- ✅ No multiple Supabase client warnings
- ✅ Component re-renders are optimized

Happy testing! 🎉
