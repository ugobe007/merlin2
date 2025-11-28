# Quick Start Guide - BESS Test Suite

## 🚀 Get Started in 5 Minutes

### 1. Install Dependencies
```bash
npm install --save-dev vitest @vitest/ui @testing-library/react @testing-library/react-hooks @testing-library/jest-dom jsdom @playwright/test
```

### 2. Add to package.json
```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui",
    "test:e2e": "playwright test"
  }
}
```

### 3. Run Tests
```bash
npm run test              # Run all tests once
npm run test:watch        # Watch mode
npm run test:coverage     # With coverage report
npm run test:ui           # Interactive UI
```

## 📋 Files Overview

| File | Purpose |
|------|---------|
| `bess-workflow-tests.test.ts` | Unit & integration tests |
| `bess-workflow-e2e.spec.ts` | End-to-end Playwright tests |
| `test-utils.ts` | Mocks, helpers, fixtures |
| `vitest.config.ts` | Test configuration |
| `test-setup.ts` | Global test setup |
| `code-fixes.ts` | Recommended code fixes |
| `README-TESTS.md` | Full documentation |

## 🔥 Priority Issues to Fix

### Issue #1: Duplicate BaselineService Calls (HIGH PRIORITY)
**Problem:** 6 identical calls for same data  
**Fix:** Implement request deduplication in `baselineService.ts`  
**Reference:** See `code-fixes.ts` - "FIX 1"

```typescript
// Quick fix - add this to your baselineService.ts
private pendingRequests = new Map<string, Promise<any>>();

async fetchConfiguration(useCase: string, useCaseData: any) {
  const key = this.getCacheKey(useCase, useCaseData);
  
  if (this.pendingRequests.has(key)) {
    return this.pendingRequests.get(key);
  }
  
  const promise = this.makeRequest(useCase, useCaseData);
  this.pendingRequests.set(key, promise);
  
  try {
    return await promise;
  } finally {
    this.pendingRequests.delete(key);
  }
}
```

### Issue #2: Multiple Supabase Clients (MEDIUM PRIORITY)
**Problem:** Multiple GoTrueClient instances  
**Fix:** Create singleton pattern  
**Reference:** See `code-fixes.ts` - "FIX 2"

```typescript
// Create supabaseClient.ts
let instance: SupabaseClient | null = null;

export function getSupabaseClient() {
  if (!instance) {
    instance = createClient(url, key);
  }
  return instance;
}
```

### Issue #3: Excessive Re-renders (MEDIUM PRIORITY)
**Problem:** Component rendering too often  
**Fix:** Add React.memo, useMemo, useCallback  
**Reference:** See `code-fixes.ts` - "FIX 3"

```typescript
const AdvancedQuoteBuilder = React.memo(({ showModal, onClose }) => {
  // Component code
});
```

## 🧪 Test Command Cheat Sheet

```bash
# Unit Tests
npm run test                          # Run once
npm run test -- -t "BaselineService"  # Run specific test
npm run test -- --reporter=verbose    # Verbose output

# Coverage
npm run test:coverage                 # Generate report
open coverage/index.html              # View report

# E2E Tests
npx playwright install                # Install browsers (first time)
npm run test:e2e                      # Run E2E tests
npm run test:e2e -- --headed          # See browser
npm run test:e2e -- --debug           # Debug mode

# Interactive
npm run test:ui                       # Vitest UI
npm run test:e2e -- --ui              # Playwright UI
```

## 📊 Expected Test Results

### Unit Tests (bess-workflow-tests.test.ts)
- ✅ 50+ tests should pass
- ✅ Coverage >70%
- ✅ Duration <10s

### E2E Tests (bess-workflow-e2e.spec.ts)
- ✅ 20+ tests should pass
- ✅ Duration <2min
- ✅ All workflows complete

### Performance Benchmarks
- BaselineService fetch: <200ms
- Component renders: <10 per action
- Page load: <3s
- Daily update: <2s

## 🐛 Debugging Failed Tests

### Console Logs Not Showing?
```typescript
// In test file
import { captureConsoleLogs } from './test-utils';

const { logs } = captureConsoleLogs();
// ... run test ...
console.log(logs); // View captured logs
```

### Test Timing Out?
```typescript
test('slow test', async () => {
  // ...
}, 30000); // Increase timeout to 30s
```

### E2E Test Failing?
```bash
# See what's happening
npm run test:e2e -- --headed --debug

# Save trace
npm run test:e2e -- --trace on
npx playwright show-trace trace.zip
```

## 🔍 Verify Issues Are Fixed

After implementing fixes, verify with:

```bash
# 1. Check duplicate calls are gone
npm run test -- -t "should not make duplicate baseline calls"

# 2. Check Supabase singleton works
npm run test -- -t "should use single Supabase client"

# 3. Check re-renders reduced
npm run test -- -t "should not trigger excessive re-renders"

# 4. Run full suite
npm run test:coverage
```

## 📈 Integration Checklist

- [ ] Install dependencies
- [ ] Copy all test files to project
- [ ] Update package.json with scripts
- [ ] Run `npm run test` to verify setup
- [ ] Fix Priority #1: Duplicate calls
- [ ] Fix Priority #2: Supabase singleton
- [ ] Fix Priority #3: Re-renders
- [ ] Run full test suite
- [ ] Check coverage report
- [ ] Add to CI/CD pipeline

## 💡 Pro Tips

1. **Start with unit tests** - They're faster and catch most bugs
2. **Use test:watch** - Auto-reruns tests as you code
3. **Check coverage** - Aim for >70% on critical paths
4. **Mock external APIs** - Tests should be fast and reliable
5. **Use test:ui** - Great for debugging complex tests
6. **Add tests before fixing bugs** - TDD approach works!

## 🆘 Common Issues

### "Module not found"
```bash
npm install
# Ensure all dependencies are installed
```

### "Cannot find name 'describe'"
```bash
# Add to test file
import { describe, it, expect } from 'vitest';
```

### "ReferenceError: window is not defined"
```typescript
// In vitest.config.ts
export default defineConfig({
  test: {
    environment: 'jsdom'  // Add this
  }
});
```

## 📚 Learn More

- Full docs: `README-TESTS.md`
- Code fixes: `code-fixes.ts`
- Test examples: `bess-workflow-tests.test.ts`
- Vitest docs: https://vitest.dev
- Playwright docs: https://playwright.dev
- Testing Library: https://testing-library.com

## 🎯 Next Steps

1. Implement the 3 priority fixes
2. Run test suite to verify
3. Add tests for new features
4. Set up CI/CD integration
5. Monitor test coverage over time

---

**Need help?** Check the logs, they tell you everything! 🔍
