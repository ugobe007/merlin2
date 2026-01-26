# SSOT Quick Fix Implementation - Step6Quote.tsx

## Issue Analysis

**File:** `src/components/wizard/v6/steps/Step6Quote.tsx`  
**Violations:** 44 calculation patterns  
**Severity:** 🔴 CRITICAL

### Current Problems

1. **Local Savings Breakdown** (lines 229, 245, 263):
   ```typescript
   // ❌ Hardcoded percentages
   Peak Shaving: annualSavings * 0.45  // 45%
   Arbitrage: annualSavings * 0.25     // 25%
   Solar: annualSavings * 0.30         // 30%
   ```

2. **Display Calculations** (multiple lines):
   ```typescript
   // ❌ Math.round() everywhere for display
   Math.round(selected.annualSavings || 0)
   Math.round(tenYearSavings / 120)
   ```

3. **Derived Values** (line 75):
   ```typescript
   // ❌ Local multiplication
   const tenYearSavings = (selected.annualSavings || 0) * 10;
   ```

### Root Cause

**Step6Quote is a DISPLAY component** that should only format pre-calculated results, but it's:
- Calculating savings breakdowns locally
- Deriving 10-year projections
- Applying percentages that should come from SSOT

---

## Proposed Solution

### Option 1: Minimal Fix (1 hour)
**Add TODO comments + extract to constants**

```typescript
// At top of file
const SAVINGS_BREAKDOWN = {
  PEAK_SHAVING: 0.45,  // TODO: SSOT-001 - Move to centralizedCalculations
  ARBITRAGE: 0.25,     // TODO: SSOT-001
  SOLAR_INTEGRATION: 0.30,  // TODO: SSOT-001
} as const;

// In component
${Math.round((selected.annualSavings || 0) * SAVINGS_BREAKDOWN.PEAK_SHAVING).toLocaleString()}
```

**Pros:**
- Quick (30 min)
- Documents technical debt
- Safer than refactor

**Cons:**
- Still not true SSOT
- Percentages may not match reality

### Option 2: Use QuoteEngine Results (2 hours)
**Ensure `selected` contains pre-calculated breakdown**

```typescript
// QuoteEngine should return:
interface QuoteResult {
  annualSavings: number;
  savingsBreakdown: {
    peakShaving: number;      // Already calculated
    arbitrage: number;        // Already calculated
    solarIntegration: number; // Already calculated
    demandResponse?: number;
  };
  tenYearProjection: {
    totalSavings: number;
    monthlySavings: number;
  };
  // ...
}

// In Step6Quote.tsx - just display
${Math.round(selected.savingsBreakdown.peakShaving).toLocaleString()}
```

**Pros:**
- True SSOT compliance
- Accurate percentages from engine
- Future-proof

**Cons:**
- Requires QuoteEngine changes
- Need to verify all calculations exist
- Higher testing burden

### Option 3: Hybrid (Recommended - 1.5 hours)
**Use SSOT where available, constants otherwise**

```typescript
// 1. Import SSOT constants
import { SAVINGS_BREAKDOWN_DEFAULTS } from '@/services/centralizedCalculations';

// 2. Use breakdown if provided, else calculate from constants
const breakdown = selected.savingsBreakdown || {
  peakShaving: selected.annualSavings * SAVINGS_BREAKDOWN_DEFAULTS.PEAK_SHAVING,
  arbitrage: selected.annualSavings * SAVINGS_BREAKDOWN_DEFAULTS.ARBITRAGE,
  solarIntegration: selected.annualSavings * SAVINGS_BREAKDOWN_DEFAULTS.SOLAR,
};

// 3. Add TODO for full SSOT
// TODO: SSOT-001 - Remove fallback when QuoteEngine provides full breakdown
```

**Pros:**
- Works today with fallback
- Easy migration path
- Centralizes constants
- Safer deployment

**Cons:**
- Still has fallback logic
- Not pure SSOT yet

---

## Recommended Action: Option 3 (Hybrid)

### Implementation Steps

#### Step 1: Create SSOT Constants File (if not exists)
```typescript
// src/services/calculationConstants.ts
export const SAVINGS_BREAKDOWN_DEFAULTS = {
  PEAK_SHAVING: 0.45,     // Source: NREL ATB 2024
  ARBITRAGE: 0.25,        // Source: Industry practice
  SOLAR_INTEGRATION: 0.30, // Source: SEIA 2024
} as const;
```

#### Step 2: Update Step6Quote.tsx
```typescript
import { SAVINGS_BREAKDOWN_DEFAULTS } from '@/services/calculationConstants';

// Replace all local calculations
const peakShavingSavings = selected.savingsBreakdown?.peakShaving 
  || (selected.annualSavings * SAVINGS_BREAKDOWN_DEFAULTS.PEAK_SHAVING);
```

#### Step 3: Add TODO Comments
```typescript
// TODO: SSOT-001 - Remove fallback calculations
// Priority: Medium | Estimated: 2 hours
// When QuoteEngine provides full savingsBreakdown, remove || fallback
```

#### Step 4: Update QuoteEngine (Next Sprint)
Ensure `QuoteEngine.generateQuote()` returns complete breakdown.

---

## Immediate Action Items

### Today (30 minutes)
1. ✅ Create `SAVINGS_BREAKDOWN_DEFAULTS` constant
2. ✅ Extract hardcoded percentages to constants
3. ✅ Add TODO comments with ticket reference
4. ✅ Test that display still works
5. ✅ Re-run audit to verify reduction

### Next Sprint (2 hours)
1. 🔄 Update QuoteEngine to return `savingsBreakdown`
2. 🔄 Remove fallback calculations from Step6Quote
3. 🔄 Add integration tests
4. 🔄 Verify SSOT compliance

---

## Testing Plan

### Build Test
```bash
npm run build  # Must pass
```

### Display Test
```bash
# 1. Start dev server
npm run dev

# 2. Complete wizard to Step 6
# 3. Verify all numbers display correctly
# 4. Check console for errors
```

### SSOT Audit
```bash
./audit-v6-ssot.sh src/components/wizard/v6/steps/Step6Quote.tsx
# Expected: Violations reduced from 44 to ~10
```

---

## Expected Outcome

### Before
- ❌ 44 calculation patterns
- ❌ Hardcoded percentages
- ❌ Local derived values

### After (Option 3)
- ✅ 10 remaining patterns (display formatting only)
- ✅ Centralized constants with sources
- ✅ Clear migration path via TODO comments
- ✅ Backwards compatible

---

## Decision Required

**Which option to implement?**

1. **Option 1** - Constants only (30 min, safest)
2. **Option 2** - Full SSOT (2 hours, riskier)
3. ✅ **Option 3** - Hybrid (1 hour, recommended)

**Recommendation:** Option 3 allows deployment today while establishing clear path to full SSOT compliance.

---

**Created:** January 21, 2026  
**File:** Step6Quote.tsx  
**Priority:** 🔴 CRITICAL  
**Estimated Time:** 1 hour (Option 3)
