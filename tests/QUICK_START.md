# Quick Start Guide - BESS Test Suite

## 🚀 Get Started in 5 Minutes

### 1. Install Dependencies
```bash
npm install --save-dev vitest @vitest/ui @testing-library/react @testing-library/react-hooks @testing-library/user-event @testing-library/jest-dom jsdom @playwright/test
```

### 2. Add to package.json
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

### 3. Run Tests
```bash
npm run test              # Run all tests once
npm run test:watch        # Watch mode
npm run test:coverage     # With coverage report
npm run test:ui           # Interactive UI
```

## 📋 Files Created

| File | Location | Purpose |
|------|----------|---------|
| `vitest.config.ts` | Root | Vitest configuration |
| `tests/setup.ts` | tests/ | Global test setup |
| `tests/README.md` | tests/ | Full documentation |

**Still needed (from Claude scripts):**
- `tests/unit/workflow.test.ts` - Unit & integration tests
- `tests/e2e/bess-quote-builder.test.ts` - End-to-end tests
- `tests/utils/test-helpers.ts` - Mocks, helpers, fixtures
- `playwright.config.ts` - Playwright configuration

## 🔥 Priority Issues to Fix

### Issue #1: Duplicate BaselineService Calls ⚠️ HIGH PRIORITY
**Problem:** 6 identical calls for same data  
**Location:** `baselineService.ts:216-218`  
**Impact:** Performance degradation, wasted API calls

**Quick Fix:**
```typescript
// Add to your baselineService.ts
class BaselineService {
  private cache = new Map<string, any>();
  private pendingRequests = new Map<string, Promise<any>>();
  
  private getCacheKey(useCase: string, useCaseData: any): string {
    const sortedData = Object.keys(useCaseData)
      .sort()
      .map(key => `${key}:${useCaseData[key]}`)
      .join('|');
    return `baseline_${useCase}_${sortedData}`;
  }
  
  async fetchConfiguration(useCase: string, useCaseData: any) {
    const key = this.getCacheKey(useCase, useCaseData);
    
    // Check pending request
    if (this.pendingRequests.has(key)) {
      console.log('⏳ Request in progress, waiting...');
      return this.pendingRequests.get(key);
    }
    
    // Check cache
    if (this.cache.has(key)) {
      console.log('✅ Returning cached result');
      return this.cache.get(key);
    }
    
    // Make new request
    console.log('🌐 Making new API request');
    const promise = this.makeApiRequest(useCase, useCaseData);
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

### Issue #2: Multiple Supabase Clients ⚠️ MEDIUM PRIORITY
**Problem:** Multiple GoTrueClient instances detected  
**Location:** `@supabase/supabase-js`  
**Impact:** Undefined behavior, state conflicts

**Quick Fix:**
```typescript
// Create src/lib/supabaseClient.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseInstance) {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables');
    }
    
    supabaseInstance = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
    
    console.log('✅ Supabase client initialized');
  }
  
  return supabaseInstance;
}

// Then replace all createClient() calls with:
import { getSupabaseClient } from '@/lib/supabaseClient';
const supabase = getSupabaseClient();
```

### Issue #3: Excessive Component Re-renders 🔧 MEDIUM PRIORITY
**Problem:** AdvancedQuoteBuilder rendering too often  
**Location:** `BessQuoteBuilder.tsx:830`  
**Impact:** UI lag, poor UX

**Quick Fix:**
```typescript
// Optimize component with React.memo
import React, { useMemo, useCallback } from 'react';

const AdvancedQuoteBuilder = React.memo(function AdvancedQuoteBuilder({ 
  showAdvancedQuoteBuilderModal, 
  onClose,
  data 
}: AdvancedQuoteBuilderProps) {
  // Memoize expensive calculations
  const processedData = useMemo(() => {
    return data.map(item => ({
      ...item,
      calculated: item.value * 2
    }));
  }, [data]);
  
  // Memoize callbacks
  const handleSubmit = useCallback(() => {
    onClose();
  }, [onClose]);
  
  // Early return if not showing
  if (!showAdvancedQuoteBuilderModal) {
    return null;
  }
  
  return (
    <Modal open={showAdvancedQuoteBuilderModal} onClose={onClose}>
      {/* Component content */}
    </Modal>
  );
});

// In parent component
const handleClose = useCallback(() => setShowModal(false), []);
```

## 🧪 Test Command Cheat Sheet

```bash
# Unit Tests
npm run test                          # Run once
npm run test -- -t "BaselineService"  # Run specific test
npm run test -- --reporter=verbose    # Verbose output

# Coverage
npm run test:coverage                 # Generate report
open coverage/index.html              # View report (macOS)

# E2E Tests
npx playwright install                # Install browsers (first time)
npm run test:e2e                      # Run E2E tests
npm run test:e2e:headed               # See browser
npm run test:e2e:ui                   # Playwright UI
npm run test:e2e -- --debug           # Debug mode

# Interactive
npm run test:ui                       # Vitest UI
```

## 📊 Expected Test Results

### Unit Tests (when implemented)
- ✅ 50+ tests should pass
- ✅ Coverage >70%
- ✅ Duration <10s

### E2E Tests (when implemented)
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
import { captureConsoleLogs } from '@/tests/utils/test-helpers';

const { logs, restore } = captureConsoleLogs();
// ... run test ...
console.log(logs); // View captured logs
restore();
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
npm run test:e2e:headed

# Save trace for debugging
npm run test:e2e -- --trace on
npx playwright show-trace trace.zip
```

## 🔍 Verify Issues Are Fixed

After implementing fixes, verify with these commands:

```bash
# 1. Check duplicate calls are gone
npm run test -- -t "should fetch configuration only once"

# 2. Check Supabase singleton works
npm run test -- -t "should not create multiple Supabase client instances"

# 3. Check re-renders reduced
npm run test -- -t "should not trigger excessive re-renders"

# 4. Run full suite
npm run test:coverage
```

## 📈 Integration Checklist

- [x] Install test dependencies
- [x] Create vitest.config.ts
- [x] Create tests/setup.ts
- [x] Create tests/README.md
- [ ] Create playwright.config.ts
- [ ] Create test files (workflow, e2e, helpers)
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

### "Module not found: vitest"
```bash
npm install --save-dev vitest @vitest/ui
```

### "Cannot find name 'describe'"
```typescript
// Already handled in tests/setup.ts with globals: true
// But if needed, add to test file:
import { describe, it, expect } from 'vitest';
```

### "ReferenceError: window is not defined"
```typescript
// Already fixed in vitest.config.ts with:
test: {
  environment: 'jsdom'
}
```

### Port 5173 vs 5178
Your app runs on port **5178** (not 5173). When creating E2E tests, ensure playwright.config.ts uses:
```typescript
baseURL: 'http://localhost:5178'
```

## 📚 Learn More

- **Full docs**: `tests/README.md`
- **Vitest docs**: https://vitest.dev
- **Playwright docs**: https://playwright.dev
- **Testing Library**: https://testing-library.com
- **React Testing**: https://testing-library.com/react

## 🎯 Next Steps

1. **Install dependencies** (if not done)
   ```bash
   npm install --save-dev vitest @vitest/ui @testing-library/react @testing-library/jest-dom jsdom @playwright/test
   ```

2. **Add package.json scripts** (see above)

3. **Implement the 3 priority fixes** (see sections above)

4. **Create remaining test files**
   - `tests/unit/workflow.test.ts`
   - `tests/e2e/bess-quote-builder.test.ts`
   - `tests/utils/test-helpers.ts`
   - `playwright.config.ts`

5. **Run test suite to verify**
   ```bash
   npm run test
   npm run test:e2e
   ```

6. **Check coverage**
   ```bash
   npm run test:coverage
   open coverage/index.html
   ```

7. **Add tests for new features as you build**

8. **Set up CI/CD integration**

9. **Monitor test coverage over time**

---

**Need help?** Check the logs - they tell you everything! 🔍

**Console showing issues?** That's good - it means monitoring is working. Now fix them! 💪
