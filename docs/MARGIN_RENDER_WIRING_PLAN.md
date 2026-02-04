# Margin Render Envelope Wiring Plan

## Overview

This document provides the exact wiring plan to connect the Margin Policy Engine to Steps 4/5/6 via the locked-down `MarginRenderEnvelope`.

**Goal**: Steps 4/5/6 receive ONLY `MarginRenderEnvelope` and render `sellPriceTotal` directly — NO MATH ALLOWED.

---

## Architecture Summary

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  INSERTION POINT: truequoteV2Adapter.ts                                     │
│  generateTrueQuoteV2()                                                      │
│                                                                             │
│  1. Calls calculateQuote() → base costs (SSOT)                              │
│  2. Calls applyMarginPolicy() → sell prices                                 │
│  3. Calls toMarginRenderEnvelope() → locked envelope                        │
│  4. Attaches to envelope.marginRender                                       │
└───────────────────────────────┬─────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  MERLIN SERVICE (MerlinOrchestrator.ts / TrueQuoteEngineV2.ts)              │
│                                                                             │
│  Generates TrueQuoteAuthenticatedResult with:                               │
│    options.starter.marginRender                                             │
│    options.perfectFit.marginRender                                          │
│    options.beastMode.marginRender                                           │
└───────────────────────────────┬─────────────────────────────────────────────┘
                                │
              ┌─────────────────┼─────────────────┐
              ▼                 ▼                 ▼
        ┌──────────┐     ┌──────────┐     ┌──────────┐
        │  Step 4  │     │  Step 5  │     │  Step 6  │
        │ Options  │     │ MagicFit │     │  Quote   │
        │          │     │          │     │          │
        │ Renders: │     │ Renders: │     │ Renders: │
        │ sellPrice│     │ sellPrice│     │ sellPrice│
        │ badge    │     │ per band │     │ breakdown│
        └──────────┘     └──────────┘     └──────────┘
```

---

## Files Created

### 1. `src/services/marginRenderEnvelopeAdapter.ts` ✅
- **Purpose**: Single conversion function from `MarginQuoteResult` → `MarginRenderEnvelope`
- **Key function**: `toMarginRenderEnvelope(marginResult)`
- **Helper functions**: `getConfidenceDisplay()`, `formatSellPrice()`, `getReviewBannerText()`, `getClampBadge()`
- **Call this**: ONLY in the insertion point (TrueQuote adapter)

### 2. `src/types/marginRenderEnvelope.ts` ✅ (updated)
- **Types**: `MarginRenderEnvelope`, `RenderLineItem`, `PricingConfidenceBadge`
- **Helpers**: `getPricingBadge()`, `isValidRenderEnvelope()`, `assertValidEnvelope()`
- **Forbidden**: `_FORBIDDEN_computeMarginInUI()`, `_FORBIDDEN_getRawCostsForRecomputation()`

---

## Wiring Steps

### Step 1: Update contracts.ts — Add marginRender to AuthenticatedSystemOption

**File**: `src/services/contracts.ts`

Find `AuthenticatedSystemOption` interface and add:

```typescript
import type { MarginRenderEnvelope } from '@/types/marginRenderEnvelope';

export interface AuthenticatedSystemOption {
  // ... existing fields ...
  
  /** Locked-down margin render envelope for UI - USE THIS FOR DISPLAY */
  marginRender?: MarginRenderEnvelope;
}
```

### Step 2: Update TrueQuoteEngineV2.ts — Attach marginRender to each option

**File**: `src/services/TrueQuoteEngineV2.ts`

1. Import the adapter:
```typescript
import { toMarginRenderEnvelope } from './marginRenderEnvelopeAdapter';
import { applyMarginPolicy } from './marginPolicyEngine';
```

2. After generating each option, compute and attach `marginRender`:
```typescript
// For each tier (starter, perfectFit, beastMode):
const marginResult = applyMarginPolicy({
  lineItems: [...optionLineItems],
  totalBaseCost: option.financials.totalInvestment,
  // ... other params
});

option.marginRender = toMarginRenderEnvelope(marginResult);
```

### Step 3: Update Step 4 (Step4Options.tsx) — Display sell prices

**Current problem**: Step 4 may be computing preview costs locally.

**Fix**: Read `marginRender.sellPriceTotal` from props/state.

**Changes**:
1. Remove any local margin computation
2. Display `option.marginRender?.sellPriceTotal` 
3. Add review banner: `if (marginRender?.needsHumanReview) { ... }`
4. Add clamp badge: `if (marginRender?.clampEvents.length > 0) { ... }`

### Step 4: Update Step 5 (Step5MagicFit.tsx) — Display per-band sell prices

**Current shape consumed** (from code review):
```typescript
const quoteResult = await generateQuote(state); // TrueQuoteAuthenticatedResult
const option = quoteResult.options[tier]; // AuthenticatedSystemOption
// Uses: option.financials.totalInvestment, option.financials.netCost, etc.
```

**Required change**: Each option needs `marginRender` attached.

**UI changes**:
1. Replace `option.financials.totalInvestment` with `option.marginRender.sellPriceTotal`
2. Add confidence badge: `option.marginRender.confidenceBadge.badge`
3. Add review banner if any option has `needsHumanReview`

**Example render**:
```tsx
<div className="text-3xl font-bold">
  ${option.marginRender?.sellPriceTotal.toLocaleString()}
</div>
<div className="text-xs text-slate-400">
  {option.marginRender?.confidenceBadge.badge}
</div>
{option.marginRender?.needsHumanReview && (
  <div className="text-amber-500">⚠️ Needs Review</div>
)}
```

### Step 5: Update Step 6 (Step6Quote.tsx) — Display breakdown

**Current shape consumed**:
```typescript
const calculations = state.calculations;
const selected = calculations.selected;
// Uses: selected.totalInvestment, selected.netInvestment, etc.
```

**Required change**: Wire marginRender through wizard state.

**Option A**: Store marginRender in `state.calculations.selected.marginRender`

**Option B**: Pass marginRender as prop from wizard orchestrator

**UI changes**:
1. Hero number: `marginRender.sellPriceTotal` (big)
2. Breakdown section:
   - Market Cost: `marginRender.marketCostTotal`
   - Buffer: `marginRender.procurementBufferTotal`
   - Base Cost: `marginRender.baseCostTotal`
   - Margin: `marginRender.marginDollars`
   - **Sell Price: `marginRender.sellPriceTotal`**
3. Review banner if `needsHumanReview`
4. Clamp details (collapsible)

---

## Type-Level Enforcement

### In Step 4/5/6 Props

**DO NOT ALLOW**:
```typescript
// ❌ FORBIDDEN - exposes raw margin result
marginPolicy?: MarginQuoteResult;

// ❌ FORBIDDEN - enables recomputation
rawLineItems?: MarginLineItem[];
```

**ONLY ALLOW**:
```typescript
// ✅ CORRECT - locked render envelope
marginRender?: MarginRenderEnvelope;
```

### CI Grep Guard (Recommended)

Add to CI pipeline:
```bash
# Fail if forbidden patterns appear in Steps 4/5/6
if grep -rn "appliedMarginPercent\|applyMarginPolicy\|baseCost \*" \
   src/components/wizard/v6/steps/Step{4,5,6}*.tsx; then
  echo "🚨 SSOT violation: Steps 4/5/6 should not compute margins"
  exit 1
fi
```

---

## Test Coverage (77 tests)

| Test File | Tests | Status |
|-----------|-------|--------|
| margin-policy.test.ts | 56 | ✅ Pass |
| magicfit-invariants.test.ts | 17 | ✅ Pass |
| db-sentinel.test.ts | 4 | ✅ Pass |

### Key Invariants Tested

- Tier 3: No double-margin (sellPriceTotal = baseCostTotal + marginDollars)
- Tier 6: sellPrice ≥ baseCost (never negative margin)
- Tier 8: Floor clamp only pushes UP, never DOWN
- Tier 8: MagicFit uses obtainableCost for sizing (not sellPrice)

---

## Summary

| Component | Receives | Displays | Computes |
|-----------|----------|----------|----------|
| TrueQuote Adapter | MarginQuoteResult | — | ✅ Margin |
| Step 4 | MarginRenderEnvelope | sellPriceTotal + badge | ❌ No math |
| Step 5 | MarginRenderEnvelope per band | sellPriceTotal × 3 | ❌ No math |
| Step 6 | MarginRenderEnvelope | Full breakdown | ❌ No math |

**The rule**: UI trusts these values. It does NOT compute them.
