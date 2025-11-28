# Performance Testing - Quick Start

## ✅ What Works NOW

### Method 1: Baseline Expectations (Instant)
```bash
npm run perf
```

Shows expected performance baselines for all operations. Use this to know what to expect when testing manually.

### Method 2: Browser Console Testing (REAL DATA)
1. Start dev server: `npm run dev`
2. Open http://localhost:5178
3. Open DevTools Console (F12)
4. Copy entire contents of `scripts/browser-perf-test.js`
5. Paste into console and press Enter

This gives you **REAL performance measurements** of actual functions.

### Method 3: Chrome DevTools Performance Tab (Most Accurate)
1. Open http://localhost:5178
2. Open DevTools → Performance tab
3. Click Record (●)
4. Complete wizard flow: Step 1 → Step 7
5. Click Stop
6. Check "User Timing" track for detailed breakdown

## Expected Performance Targets

| Operation | Target | Warning | Critical |
|-----------|--------|---------|----------|
| Template Selection | <50ms | 50-100ms | >100ms |
| Baseline Calculation | 150-300ms | 300-500ms | >500ms |
| Equipment Pricing | 100-200ms | 200-400ms | >400ms |
| Financial Calc (Simple) | 80-150ms | 150-300ms | >300ms |
| Financial Calc (NPV/IRR) | 300-500ms | 500-800ms | >800ms |
| Database Query | 100-200ms | 200-400ms | >400ms |
| **Full Wizard Flow** | **800-1400ms** | **1400-2000ms** | **>2000ms** |

## What to Look For

### 🟢 Good Performance
- Template selection instant (<50ms)
- Total wizard flow under 1.5 seconds
- No noticeable delays when clicking Next

### 🟡 Warning Signs  
- Any operation >500ms
- Total wizard flow 1.5-2 seconds
- Slight delays between steps

### 🔴 Critical Issues
- Any operation >1 second
- Total wizard flow >2 seconds
- Noticeable lag when navigating

## Common Bottlenecks

### Database Queries
**Symptoms:** Slow use case loading, equipment pricing delays  
**Fix:** Add caching, check database indexes

### Baseline Calculation
**Symptoms:** Long delay between Step 2 and Step 3  
**Fix:** Optimize template multiplier lookups, reduce unnecessary calculations

### Financial Calculations
**Symptoms:** Slow transition to quote summary  
**Fix:** Reduce NPV/IRR iterations, cache calculation constants

### React Re-renders
**Symptoms:** UI feels sluggish, multiple re-renders  
**Fix:** Add React.memo, use useCallback, optimize state updates

## Browser Performance Profiling

### Step-by-Step Guide:

1. **Open Performance Tab**
   - Chrome: DevTools → Performance
   - Firefox: DevTools → Performance

2. **Start Recording**
   - Click red Record button
   - OR press Cmd+E (Mac) / Ctrl+E (Windows)

3. **Perform Action**
   - Open Smart Wizard
   - Go through all steps
   - Click Finish

4. **Stop Recording**
   - Click Stop button
   - OR press Cmd+E / Ctrl+E again

5. **Analyze Results**
   - Look for long yellow bars (scripting)
   - Check "User Timing" for custom marks
   - Identify functions taking >100ms

### What to Check:

- **Main thread activity** - Should be mostly idle
- **Function call times** - Look for >100ms functions
- **Network requests** - Should complete <200ms
- **Rendering/painting** - Should be minimal
- **Memory** - Should not grow significantly

## Real-World Testing Checklist

### Test with Realistic Data:
- [ ] 50,000 sqft office building
- [ ] Medical office facility type
- [ ] Include café/restaurant
- [ ] California location
- [ ] 4-hour duration

### Measure These Timings:
- [ ] Time to open wizard
- [ ] Time to select template
- [ ] Time to calculate baseline (Step 2 → Step 3)
- [ ] Time to get pricing (Step 3 → Step 4)
- [ ] Time to calculate financials (Step 5 → Step 6)
- [ ] Total wizard completion time

### Expected Results:
- Total time: 1-2 seconds
- No operation over 500ms
- Smooth transitions between steps

## When to Worry

### 🚨 Immediate Action Required:
- Any user-facing operation >1 second
- Total wizard flow >3 seconds  
- Memory usage growing continuously
- Browser tab becomes unresponsive

### ⚠️ Should Investigate:
- Operations consistently near upper threshold
- Gradual slowdown over time
- Inconsistent performance (fast sometimes, slow others)

## Performance Budget

Set these as hard limits:

```javascript
const PERFORMANCE_BUDGET = {
  templateSelection: 50,        // ms
  baselineCalculation: 300,     // ms
  equipmentPricing: 200,        // ms
  financialSimple: 150,         // ms
  financialNPV: 500,           // ms
  totalWizardFlow: 1500        // ms (1.5 seconds)
};
```

Fail CI/CD if any operation exceeds budget.

## Next Steps

1. Run `npm run perf` to see baselines
2. Open browser and test with real data
3. Use Performance tab to record actual flow
4. Compare against baselines
5. Identify and fix any bottlenecks over threshold
6. Re-test to verify improvements

---

**TL;DR:** Run `npm run perf` to see expectations, then test in browser with DevTools Performance tab for real measurements.
