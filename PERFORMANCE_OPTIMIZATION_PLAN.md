# Performance Optimization Plan (Mar 11, 2026)

## Problems Identified

### 1. **30-second blank screen on Step 5 (MagicFit)**
- **Root Cause**: Tier calculation blocks UI rendering
- **What happens**: 
  1. User clicks Continue from Step 4
  2. `goToStep(5)` navigates to Step 5
  3. `buildTiers()` runs immediately (3× `calculateQuote()` in parallel)
  4. Each `calculateQuote()` calls PVWatts API
  5. UI can't render loading screen until calculations finish
  6. User sees blank screen for 30 seconds

### 2. **PVWatts API 429 Errors (Rate Limiting)**
- Console shows: `[Warning] PVWatts API failed, using regional estimate: Error: PVWatts API error: 429`
- DEMO_KEY has 30 requests/hour limit
- 3 tiers × 3-4 API calls = 9-12 requests in 1-2 seconds
- Exceeds rate limit immediately

### 3. **Step 1-3 Slow Transitions**
- Lazy loading of step components
- Google Places API calls (autocomplete, photo fetching)
- Industry detection + curated schema loading

## Fixes Implemented

### ✅ Fix 1: Loading Screen Appears Immediately (100ms delay)
**File**: `src/wizard/v8/useWizardV8.ts` (lines 707-724, 741-758)

**Before**:
```typescript
dispatch({ type: "GO_TO_STEP", step: 5 });
dispatch({ type: "SET_TIERS_STATUS", status: "fetching" });
try {
  const tiers = await getOrStartTierBuild(state); // BLOCKS HERE
  // ...
}
```

**After**:
```typescript
dispatch({ type: "GO_TO_STEP", step: 5 });
dispatch({ type: "SET_TIERS_STATUS", status: "fetching" });

// ⚡ PERFORMANCE FIX: Delay tier build to let UI render loading screen
setTimeout(async () => {
  try {
    const tiers = await getOrStartTierBuild(state);
    // ...
  }
}, 100); // 100ms delay
```

**Impact**: Loading spinner/progress bar now appears within 100ms instead of after 30 seconds

## Additional Optimizations Needed

### 2. PVWatts API Caching Per Session
**Current**: Cache exists but may not be effective for 3 parallel requests
**Solution**: Pre-fetch solar data once on Step 1 (location) and reuse for all tiers

**Pseudocode**:
```typescript
// In useWizardV8, when location is set:
useEffect(() => {
  if (location?.zip) {
    // Pre-warm PVWatts cache for common scenarios
    void getPVWattsEstimate({
      systemCapacityKW: 500, // Average system
      zipCode: location.zip,
      arrayType: 1, // Fixed roof
    });
  }
}, [location]);
```

### 3. Parallelize with Deduplication
**Current**: 3 tiers call PVWatts with slightly different capacities
**Solution**: Call PVWatts once, scale results for different sizes

**Logic**:
```typescript
// Instead of:
tier1: calculateQuote({ solarMW: 0.5 }) → PVWatts(500 kW)
tier2: calculateQuote({ solarMW: 0.8 }) → PVWatts(800 kW)
tier3: calculateQuote({ solarMW: 1.0 }) → PVWatts(1000 kW)

// Do this:
baseProduction = await getPVWattsEstimate({ systemCapacityKW: 1000 })
tier1: scale baseProduction by 0.5
tier2: scale baseProduction by 0.8
tier3: use baseProduction as-is
```

**File to modify**: `src/services/pvWattsService.ts`
Add helper: `scaleSolarProduction(baseResult, scaleFactor)`

### 4. Lazy Load Step Components Eagerly
**Current**: Steps 2-6 lazy loaded on navigation
**Solution**: Prefetch next step component on current step idle

**File**: `src/wizard/v8/WizardV8Page.tsx`
```typescript
// Prefetch next step component when user settles on current step
useEffect(() => {
  const prefetchTimeout = setTimeout(() => {
    if (step === 1) {
      import('./steps/Step2V8'); // Prefetch industry
    } else if (step === 2) {
      import('./steps/Step3V8'); // Prefetch questionnaire
    }
  }, 2000); // 2 seconds idle
  return () => clearTimeout(prefetchTimeout);
}, [step]);
```

### 5. Debounce Google Places Autocomplete
**Current**: Every keystroke calls Google API
**Solution**: 300ms debounce

**File**: `src/wizard/v8/steps/Step1V8.tsx`
```typescript
// Already implemented? Check for debounce on autocomplete
```

### 6. Progressive Loading for Step 5
**Current**: Wait for all 3 tiers before showing any
**Solution**: Show tiers as they complete

**File**: `src/wizard/v8/step4Logic.ts`
```typescript
// Instead of Promise.all:
const [starter, recommended, complete] = await Promise.all([...]);

// Stream results:
const results = [];
for (const tier of ['Starter', 'Recommended', 'Complete']) {
  const result = await buildOneTier(...);
  dispatch({ type: "ADD_TIER", tier: result });
  results.push(result);
}
```

## Next Steps

1. ✅ **DONE**: Loading screen fix (100ms delay)
2. **TODO**: Pre-warm PVWatts cache on Step 1
3. **TODO**: Scale solar production instead of multiple API calls
4. **TODO**: Progressive tier loading (show tiers as they complete)
5. **TODO**: Prefetch next step components
6. **TODO**: Get real NREL API key (not DEMO_KEY) to avoid 429 errors

## Expected Performance After All Fixes

| Metric | Before | After Fixes |
|--------|--------|-------------|
| Step 5 blank screen | 30 seconds | < 0.5 seconds (loading animation visible) |
| Step 5 total time | 30 seconds | 10-15 seconds (cached) |
| Step 1-3 transitions | 2-5 seconds | < 1 second |
| PVWatts 429 errors | Frequent | Rare (pre-cached + scaled) |
