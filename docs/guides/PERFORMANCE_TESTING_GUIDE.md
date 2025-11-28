# SmartWizard Performance Testing Suite

## Quick Start

Run the **fastest** performance check:

```bash
npm run perf
```

This runs `scripts/quick-perf-test.js` and tests:
- ✅ Baseline Calculation
- ✅ Equipment Pricing
- ✅ Financial Calculations (Simple & Full NPV)
- ✅ Use Case Loading

**Expected Output:**
```
🚀 Quick Performance Test - SmartWizard

═══════════════════════════════════════

✅ FAST Baseline Calculation: 145ms
✅ FAST Equipment Pricing: 87ms
✅ FAST Financial Calculations (Simple): 56ms
⚠️ OK Financial Calculations (Full NPV): 312ms
✅ FAST Use Case Loading: 92ms

═══════════════════════════════════════
📊 SUMMARY

✅ Fast (<200ms): 4
⚠️ OK (200-500ms): 1
❌ Slow (>500ms): 0
❌ Errors: 0

⏱️  Total Time: 692ms

═══════════════════════════════════════
```

## Test Files Created

### 1. **Quick Performance Test** (Recommended)
**File:** `scripts/quick-perf-test.js`  
**Run:** `npm run perf` or `node scripts/quick-perf-test.js`  
**Purpose:** Instant bottleneck detection (runs in ~1 second)

### 2. **Wizard Performance Test Suite**
**File:** `tests/performance/wizard-performance-test.ts`  
**Purpose:** Comprehensive testing of all wizard components
- Template selection speed
- Use case loading
- Baseline calculation
- Equipment pricing
- Financial calculations (NPV/IRR/ROI)
- Database caching
- State update cascade
- Full wizard flow end-to-end
- Memory usage patterns

### 3. **Database Query Performance**
**File:** `tests/performance/database-query-test.ts`  
**Purpose:** Identifies slow Supabase queries
- Get all use cases
- Get use case with configurations
- Get equipment templates
- Regional pricing queries
- Complex joins
- Tier filtering

### 4. **Calculation Benchmark**
**File:** `tests/performance/calculation-benchmark.ts`  
**Purpose:** Benchmark all calculation functions
- Baseline calculation (10 iterations)
- Financial metrics (simple & full)
- Equipment pricing
- Solar sizing

### 5. **Wizard Flow Profiler**
**File:** `scripts/profile-wizard-flow.ts`  
**Run:** `npm run perf:profile`  
**Purpose:** Step-by-step profiling showing EXACT time spent in each step

### 6. **React Component Render Test**
**File:** `tests/performance/react-render-test.tsx`  
**Purpose:** Measure actual component render times

## Performance Thresholds

### ✅ FAST (Target)
- Template selection: < 50ms (instant)
- Use case loading: < 200ms
- Baseline calculation: < 500ms
- Equipment pricing: < 300ms
- Financial calculations (simple): < 100ms
- Financial calculations (NPV): < 400ms

### ⚠️ OK (Acceptable)
- 1.5x - 2x above thresholds

### ❌ SLOW (Bottleneck)
- 2x+ above thresholds

## How to Use

### Daily Quick Check
```bash
npm run perf
```
Run this before committing changes to catch performance regressions.

### Deep Dive Investigation
```bash
npm run perf:profile
```
Shows exactly where time is spent in the wizard flow.

### Full Test Suite
```bash
./scripts/run-performance-tests.sh
```
Runs all tests and generates comprehensive report with bottleneck analysis.

## Interpreting Results

### Look for:
1. **🔴 CRITICAL bottlenecks** (>500ms) - Fix immediately
2. **🟡 SLOW queries** (200-500ms) - Optimize when possible
3. **Memory leaks** - Heap usage should not grow significantly
4. **Cache effectiveness** - Second calls should be <50ms

### Common Issues:

**Slow baseline calculation (>500ms):**
- Database query not cached
- Complex sizing logic
- Multiple template lookups

**Slow financial calculations (>400ms):**
- NPV/IRR iterations too high
- Not using cached constants
- Unnecessary recalculations

**Slow use case loading (>200ms):**
- Database not indexed
- Too many join queries
- Not using caching

## Test Results Location

All test results saved to:
```
./test-results/performance-YYYYMMDD-HHMMSS/
```

Contains:
- Individual test logs
- SUMMARY.md with bottleneck analysis
- Performance metrics

## Integration with CI/CD

Add to `.github/workflows/performance.yml`:
```yaml
- name: Performance Tests
  run: npm run perf
  
- name: Fail on bottlenecks
  run: |
    if grep -q "SLOW\|CRITICAL" test-results/latest.log; then
      echo "Performance bottlenecks detected!"
      exit 1
    fi
```

## Troubleshooting

**Tests failing with import errors:**
- Check that service paths are correct
- Run `npm install` to ensure dependencies

**Supabase connection errors:**
- Verify `.env` has correct SUPABASE_URL and SUPABASE_ANON_KEY
- Check internet connection

**Tests timing out:**
- Increase timeout in test configuration
- Check if services are running (database, etc.)

## Next Steps

After running tests:

1. **Identify critical bottlenecks** (>500ms)
2. **Profile those specific functions** with detailed logging
3. **Implement caching** where appropriate
4. **Optimize database queries** (add indexes, reduce joins)
5. **Re-run tests** to verify improvements

## Continuous Monitoring

Set up performance budget in `package.json`:
```json
{
  "performanceBudgets": {
    "wizardFlow": 2000,
    "baselineCalc": 500,
    "financialCalc": 400
  }
}
```

Fail CI if budgets exceeded.
