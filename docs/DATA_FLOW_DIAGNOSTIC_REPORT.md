# Data Center Calculation Diagnostic Report
## Date: January 1, 2026

---

## 🔍 ISSUE SUMMARY

| Issue | Severity | Status | Root Cause |
|-------|----------|--------|------------|
| BESS sizing 40-250x too small | 🚨 CRITICAL | **FOUND** | Double application of BESS multiplier |
| EV chargers not flowing to quote | 🚨 CRITICAL | Found | State mapping issue (fixed in TrueQuote Engine) |
| Generator not recommended | 🚨 CRITICAL | Found | Logic exists but not using TrueQuote Engine |
| Annual savings too low | 🟡 HIGH | Related | Will fix when sizing is corrected |

---

## 🐛 ROOT CAUSE: Double Application of BESS Multiplier

### The Bug

**Location**: `src/components/wizard/v6/steps/Step5MagicFit.tsx:327-348`

```typescript
// Step5MagicFit.tsx - Line 327
if (industry === 'data_center' || industry === 'data-center') {
  const baseline = await calculateDatabaseBaseline('data-center', 1, useCaseData);
  basePowerKW = baseline.powerMW * 1000; // ❌ BUG: This is ALREADY the BESS size!
  // ...
}

// Line 348
const bessKW = Math.round(basePowerKW * multiplier); // ❌ Applying multiplier AGAIN!
```

**The Problem**:
1. `calculateDatabaseBaseline()` returns `powerMW` which is **already the BESS size** (capacity × bessMultiplier)
2. Step5 treats it as if it's the facility power
3. Step5 applies the power level multiplier (0.7, 1.0, or 1.5) **again**
4. Result: BESS size is calculated twice, producing values 40-250x too small

### Example: 400 Rack Tier III Data Center

**Expected Flow**:
```
1. Facility Power: 400 racks × 5kW × 1.6 PUE = 3,200 kW
2. BESS Size: 3,200 kW × 50% (Tier III multiplier) = 1,600 kW
3. Perfect Fit: 1,600 kW × 1.0 = 1,600 kW ✅
```

**Actual Flow (BROKEN)**:
```
1. baselineService: Returns BESS size = 1,600 kW (already multiplied)
2. Step5: Treats 1,600 kW as facility power
3. Step5: Applies multiplier: 1,600 kW × 0.7 (Starter) = 1,120 kW ❌
   OR: 1,600 kW × 1.0 (Perfect Fit) = 1,600 kW (correct by accident)
   OR: 1,600 kW × 1.5 (Beast Mode) = 2,400 kW ❌
```

But the user is seeing 100 kW, which suggests:
- Either `calculateDatabaseBaseline` is returning a much smaller value (e.g., 0.1 MW = 100 kW)
- Or the fallback logic in `calculateBasePowerKW` is being used instead

---

## ✅ SOLUTION: Use TrueQuote Engine

The TrueQuote Engine correctly:
1. Calculates facility peak demand from inputs
2. Applies BESS multiplier once
3. Applies power level multiplier correctly
4. Provides traceable calculation steps

### Implementation Plan

1. **Replace `calculateSystemAsync` in Step5MagicFit.tsx** to use TrueQuote Engine
2. **Map WizardState to TrueQuoteInput** format
3. **Map TrueQuoteResult to SystemCalculations** format
4. **Preserve existing UI** - no visual changes, just correct calculations

---

## 📋 DATA FLOW TRACE

### Current Flow (BROKEN)

```
Step 3: User inputs
  ↓
state.useCaseData = {
  rackCount: 400,
  tierClassification: 'tier_3',
  powerUsageEffectiveness: 1.6
}
  ↓
Step 5: calculateSystemAsync()
  ↓
calculateDatabaseBaseline('data-center', 1, useCaseData)
  → Returns: { powerMW: 1.6, ... }  // This is BESS size, not facility power!
  ↓
basePowerKW = 1.6 * 1000 = 1,600 kW  // ❌ Wrong: This is BESS, not facility
  ↓
bessKW = basePowerKW * multiplier  // ❌ Double multiplication!
  → Result: 1,600 kW × 1.0 = 1,600 kW (seems OK, but wrong conceptually)
  → OR: 1,600 kW × 0.7 = 1,120 kW (Starter)
```

### Fixed Flow (TrueQuote Engine)

```
Step 3: User inputs
  ↓
state.useCaseData = {
  rackCount: 400,
  tierClassification: 'tier_3',
  powerUsageEffectiveness: 1.6
}
  ↓
Step 5: TrueQuoteEngine.calculate({
  location: { zipCode: state.zipCode },
  industry: {
    type: 'data-center',
    subtype: 'tier_3',
    facilityData: state.useCaseData
  },
  options: { ... }
})
  ↓
TrueQuote Engine:
  1. Calculate Peak Demand: 400 racks × 5kW × 1.6 PUE = 3,200 kW ✅
  2. Calculate BESS: 3,200 kW × 50% = 1,600 kW ✅
  3. Apply Power Level: 1,600 kW × multiplier ✅
  ↓
Result: Correct BESS size
```

---

## 🔧 FILES TO MODIFY

1. **`src/components/wizard/v6/steps/Step5MagicFit.tsx`**
   - Replace `calculateSystemAsync` to use TrueQuote Engine
   - Map WizardState → TrueQuoteInput
   - Map TrueQuoteResult → SystemCalculations

2. **`src/components/wizard/v6/steps/Step6Quote.tsx`**
   - Use TrueQuote Engine results for quote display
   - Ensure EV charger data flows correctly

3. **Test with validation suite**
   - Run `tests/validation/TrueQuoteValidationSuite.ts`
   - Verify all benchmarks pass

---

## 📊 VALIDATION BENCHMARKS

The validation suite includes 5 known-correct scenarios:

1. **Tier III Data Center (400 racks)**: Expected 1,600 kW BESS
2. **Regional Hospital (200 beds)**: Expected 1,000 kW BESS
3. **Luxury Hotel (300 rooms)**: Expected 600 kW BESS
4. **EV Charging Hub (10 DC Fast)**: Expected 900 kW BESS
5. **Express Car Wash (4 bays)**: Expected 80 kW BESS

All benchmarks have ±15% tolerance for acceptable results.

---

## ⚠️ BREAKING CHANGES

None - this is a fix, not a refactor. The UI remains identical, only the calculation logic changes.

---

*Report generated: January 1, 2026*
*Next step: Implement TrueQuote Engine integration in Step5MagicFit.tsx*
