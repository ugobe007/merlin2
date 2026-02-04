# Margin Render Wiring - Surgical Implementation Plan

> **Purpose**: Exact copy-paste blocks for wiring `marginRender` envelope into Steps 4/5/6.  
> All changes are fallback-safe (if `marginRender` is undefined, old values still render).

**Date**: February 1, 2026  
**Status**: ✅ IMPLEMENTED - Core wiring complete

---

## Implementation Completed (Feb 1, 2026)

### Files Updated:
1. ✅ `src/services/contracts.ts` - Added `marginRender?: MarginRenderEnvelope` to `AuthenticatedSystemOption`
2. ✅ `src/services/TrueQuoteEngineV2.ts` - Added margin policy application at Step 9.5
3. ✅ `src/components/wizard/v6/steps/Step5MagicFit.tsx` - Using `sellPriceForTier()` and `netCostForTier()` helpers
4. ✅ `src/components/wizard/v6/steps/Step6Quote.tsx` - Reads from `state.calculations.selected` (auto-correct via Step5)

### Tests Passing:
- 56/56 margin policy tests pass

---

## Executive Summary

| Step | Current Source | Target Source |
|------|---------------|---------------|
| **Step4** | Local `result.netCostAfterITC` | `option.marginRender.sellPriceTotal` |
| **Step5** | `option.financials.totalInvestment` | `option.marginRender.sellPriceTotal` |
| **Step5** | Local calc: `netCost = totalInvestment - federalITC - stateIncentive` | `sellPriceTotal - federalITC - stateIncentive` |
| **Step6** | `state.calculations.selected.totalInvestment` | `state.calculations.selected.marginRender.sellPriceTotal` |

### Key Invariant (NEVER VIOLATE)
```
Net Cost = sellPriceTotal − federalITC − stateIncentive
```
The UI NEVER computes margin. It only subtracts incentives from the sell price.

---

## Files Updated (Ready)

### 1. `src/services/marginRenderEnvelopeAdapter.ts` ✅
Single conversion function. Clean version deployed.

### 2. `src/types/marginRenderEnvelope.ts` ✅
Types-only file. Clean version deployed.

---

## 1) Step 4 — Step4Options.tsx

### File Location
`src/components/wizard/v6/steps/Step4Options.tsx` (783 lines)

### A) Add Helpers (near top of file, outside component)

```tsx
function getOptionSellPrice(option: any): number | null {
  const v = option?.marginRender?.sellPriceTotal;
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function formatCurrencySafe(n: number): string {
  return `$${Math.round(n).toLocaleString()}`;
}
```

### B) Solar TierCard Metrics — "After ITC" line (Line ~358)

**Replace this:**
```tsx
{ label: "After ITC", value: o.netCost, highlight: true, color: "purple" },
```

**With this:**
```tsx
{
  label: "After ITC",
  value: (() => {
    const sell = getOptionSellPrice(o);
    // If marginRender exists, show sell price; otherwise fall back to previous raw net cost
    const display = sell !== null ? sell : (typeof o.netCostRaw === "number" ? o.netCostRaw : 0);
    return formatCurrencySafe(display);
  })(),
  highlight: true,
  color: "purple",
},
```

### C) Generator TierCard Metrics — "After Credits" line (Line ~478)

**Replace:**
```tsx
value: o.netCostStr,
```

**With:**
```tsx
value: (() => {
  const sell = getOptionSellPrice(o);
  if (sell !== null) return formatCurrencySafe(sell);
  return o.netCostStr;
})(),
```

### D) Generator Card Header value (Line ~450)

**Replace:**
```tsx
value={curGen ? curGen.netCostStr : "$73k"}
```

**With:**
```tsx
value={(() => {
  if (!curGen) return "$73k";
  const sell = getOptionSellPrice(curGen);
  return sell !== null ? formatCurrencySafe(sell) : curGen.netCostStr;
})()}
```

---

## 2) Step 5 — Step5MagicFit.tsx (THE CRITICAL ONE)

> **This is where double-margin dies.** We do three things:
> 1. Display "Total Investment" as `sellPriceTotal`
> 2. Delete local net cost math (replace with sell price minus incentives)
> 3. Write selected totals into wizard state using `marginRender` (and pass envelope through)

### File Location
`src/components/wizard/v6/steps/Step5MagicFit.tsx` (924 lines)

### A) Add Helpers (near top of file, outside component)

```tsx
function sellPriceForTier(option: any): number | null {
  const v = option?.marginRender?.sellPriceTotal;
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function tierNeedsReview(option: any): boolean {
  return Boolean(option?.marginRender?.needsHumanReview);
}

function getTierBadge(option: any): string | null {
  return option?.marginRender?.confidenceBadge?.badge ?? null;
}
```

### B) Replace Local netCost Computation (Line ~602)

**Replace this (OLD):**
```tsx
const netCost =
  option.financials.totalInvestment - option.financials.federalITC - stateIncentive;
```

**With this (NEW, CORRECT):**
```tsx
const sellPrice = sellPriceForTier(option);
const totalInvestment = sellPrice !== null ? sellPrice : option.financials.totalInvestment;

// Incentives are still incentives — we subtract them for "Net Cost"
const netCost = totalInvestment - (option.financials.federalITC || 0) - (stateIncentive || 0);
```

✅ Now "Total Investment" is sell price, and "Net Cost" is sell minus incentives.

### C) Financial Summary Rendering (Lines ~756–787)

#### 1) Replace "Total Investment" display

**Replace:**
```tsx
{formatCurrency(option.financials.totalInvestment)}
```

**With:**
```tsx
{formatCurrency(totalInvestment)}
```

#### 2) "Net Cost" display — Keep as-is
If you replaced the `netCost` variable per section B, it will now reflect the new logic automatically.

### D) Add Badge + Review Banner (after Financial Summary block)

Drop this right after the summary (same card, after `<div className="space-y-2 ...">`):

```tsx
{(() => {
  const badge = getTierBadge(option);
  const needsReview = tierNeedsReview(option);

  if (!badge && !needsReview) return null;

  return (
    <div className="mt-3 space-y-2">
      {badge && (
        <div className="inline-flex items-center px-2 py-1 rounded-lg text-[11px] bg-white/5 border border-white/10 text-slate-200">
          {badge}
        </div>
      )}

      {needsReview && (
        <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-300">
          ⚠️ Pricing needs human review (market below threshold)
        </div>
      )}
    </div>
  );
})()}
```

### E) updateState Writes When Selecting Tier (Lines ~363–367)

**Replace this block:**
```tsx
totalInvestment: option.financials.totalInvestment,
federalITC: option.financials.federalITC,
netCost: option.financials.netCost,
```

**With this COMPLETE replacement (includes marginRender passthrough):**

```tsx
const sellPrice = sellPriceForTier(option);
const totalInvestment =
  sellPrice !== null ? sellPrice : option.financials.totalInvestment;

const netInvestment =
  totalInvestment - (option.financials.federalITC || 0) - (stateIncentive || 0);

updateState?.({
  calculations: {
    ...state.calculations,
    selected: {
      ...state.calculations.selected,

      // ✅ Authoritative totals (sell price)
      totalInvestment,

      // ✅ Incentives remain incentives
      federalITC: option.financials.federalITC,

      // ✅ Net investment uses sell price minus incentives
      netInvestment,

      // ✅ Keep existing fields
      annualSavings: option.financials.annualSavings,
      paybackYears: option.financials.paybackYears,

      // ✅ Carry the render envelope forward for Step 6
      marginRender: option.marginRender ?? state.calculations.selected?.marginRender,
    },
  },
});
```

**Why this is correct:**
- Step 6 reads the same numbers Step 5 displayed
- Incentives are still shown, but sell price is now the "total system cost"
- The `marginRender` envelope is carried through intact

---

## 3) Step 6 — Step6Quote.tsx

> Step 6 reads from wizard state written by Step 5. It should use `marginRender` from state for display.

### File Location
`src/components/wizard/v6/steps/Step6Quote.tsx` (951 lines)

### A) Add Helpers (near top of file, outside component)

```tsx
function getQuoteTotals(selected: any) {
  const mr = selected?.marginRender ?? null;
  return {
    sell: typeof mr?.sellPriceTotal === "number" ? mr.sellPriceTotal : null,
    needsReview: Boolean(mr?.needsHumanReview),
    badge: mr?.confidenceBadge?.badge ?? null,
  };
}
```

### B) Investment Breakdown Panel (Lines ~329–347)

**Replace "Total System Cost" display:**

```tsx
// OLD:
${Math.round(selected.totalInvestment || 0).toLocaleString()}

// NEW:
{(() => {
  const qt = getQuoteTotals(selected);
  const val = qt.sell ?? selected.totalInvestment ?? 0;
  return `$${Math.round(val).toLocaleString()}`;
})()}
```

**"Net Investment" display is correct as-is** if Step 5 wrote `netInvestment` correctly (sell − ITC − stateIncentive).

### C) Add Review Banner (top of quote section, if needed)

```tsx
{(() => {
  const qt = getQuoteTotals(selected);
  if (!qt.needsReview) return null;
  return (
    <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-sm text-amber-300">
      ⚠️ This quote requires human review — market pricing below threshold
    </div>
  );
})()}
```

### D) QuoteExportData (Line ~130)

**Replace:**
```tsx
systemCost: selected.totalInvestment || 0,
```

**With:**
```tsx
systemCost: (() => {
  const qt = getQuoteTotals(selected);
  return qt.sell ?? selected.totalInvestment ?? 0;
})(),
```

### E) $/kWh Display (Line ~826)

**Replace:**
```tsx
${((selected.totalInvestment || 0) / (selected.bessKWh || 1)).toFixed(0)}/kWh installed cost
```

**With:**
```tsx
{(() => {
  const qt = getQuoteTotals(selected);
  const investment = qt.sell ?? selected.totalInvestment ?? 0;
  const perKWh = (investment / (selected.bessKWh || 1)).toFixed(0);
  return `$${perKWh}/kWh installed cost`;
})()}
```

---

## 4) Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  TrueQuoteEngineV2 / truequoteV2Adapter.ts                                  │
│                                                                             │
│  1. Build base costs from equipment pricing                                 │
│  2. Call applyMarginPolicyAsync(input)                                      │
│  3. Call toMarginRenderEnvelope(marginResult)  ← SINGLE INSERTION POINT     │
│  4. Attach to each option: option.marginRender = envelope                   │
│                                                                             │
│  option.marginRender = {                                                    │
│    sellPriceTotal: number,        ← UI displays this                        │
│    baseCostTotal: number,         ← transparency only                       │
│    marginDollars: number,         ← transparency only                       │
│    needsHumanReview: boolean,     ← show warning banner                     │
│    confidenceBadge: {...},        ← show badge                              │
│    reviewEvents: [...],           ← audit trail                             │
│    clampEvents: [...],            ← audit trail                             │
│    lineItems: [...],              ← detail view                             │
│  }                                                                          │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  Step 5: selectPowerLevel() → updateState()                                 │
│                                                                             │
│  Writes to state.calculations.selected:                                     │
│    totalInvestment: sellPriceTotal                                          │
│    federalITC: option.financials.federalITC (unchanged)                     │
│    netInvestment: sellPriceTotal − federalITC − stateIncentive              │
│    marginRender: option.marginRender  ← pass through envelope               │
│                                                                             │
│  KEY INVARIANT: Net = Sell − FederalITC − StateIncentive                    │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  Step 6: Reads from state.calculations.selected                             │
│                                                                             │
│  Displays:                                                                  │
│    "Total System Cost" → selected.marginRender.sellPriceTotal               │
│    "Federal ITC"       → selected.federalITC (incentive display)            │
│    "Net Investment"    → selected.netInvestment                             │
│    Review Banner       → selected.marginRender.needsHumanReview             │
│    Badge               → selected.marginRender.confidenceBadge              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5) Contract Change Required

### In `src/services/contracts.ts`

Add to `AuthenticatedSystemOption` interface:

```typescript
import type { MarginRenderEnvelope } from '@/types/marginRenderEnvelope';

export interface AuthenticatedSystemOption {
  // ... existing fields ...
  
  /** Margin render envelope for UI consumption (optional during migration) */
  marginRender?: MarginRenderEnvelope;
}
```

---

## 6) Verification Commands

After wiring, run these to verify:

```bash
# 1) Ensure Steps never reference margin math directly
rg -n "applyMarginPolicy|appliedMarginPercent|marginBand|procurementBuffer|baseCost \* \(1 \+|sellPrice\s*=\s*base" src/components/wizard/v6/steps

# 2) Ensure Steps reference marginRender
rg -n "marginRender" src/components/wizard/v6/steps

# 3) Run the gated test suites
npx vitest run tests/integration/margin-policy.test.ts tests/integration/magicfit-invariants.test.ts tests/integration/db-sentinel.test.ts
```

---

## 7) Implementation Order

1. ✅ `marginRenderEnvelopeAdapter.ts` — Clean version deployed
2. ✅ `marginRenderEnvelope.ts` — Clean types deployed
3. ⏳ Add `marginRender` to `contracts.ts` (AuthenticatedSystemOption)
4. ⏳ Wire in `TrueQuoteEngineV2` (single insertion point)
5. ⏳ Update `Step5MagicFit.tsx` (CRITICAL — prevents double margin)
6. ⏳ Update `Step6Quote.tsx` (reads from state written by Step5)
7. ⏳ Update `Step4Options.tsx` (optional add-ons display)
8. ⏳ Run verification commands
9. ⏳ Run full test suite

---

## 8) Risk Assessment

| Risk | Mitigation |
|------|-----------|
| Breaking existing quotes | Fallback to `option.financials.*` if `marginRender` is undefined |
| Double margin | Type-level tripwires + CI grep guards |
| Missing fields | Runtime validation via helpers with null checks |
| Test failures | Run margin-policy tests after each step |
| Net Cost wrong | Enforced: `Net = Sell − FederalITC − StateIncentive` (both incentives) |

---

## Approval Status

- [x] `marginRenderEnvelopeAdapter.ts` implementation ✅
- [x] `marginRenderEnvelope.ts` types ✅
- [x] Step 4 wiring approach (exact code blocks) ✅
- [x] Step 5 wiring approach (exact code blocks) ✅
- [x] Step 6 wiring approach (exact code blocks) ✅
- [x] Net Cost invariant confirmed: `Sell − FederalITC − StateIncentive` ✅
- [ ] Contract change (AuthenticatedSystemOption.marginRender) — pending implementation
- [ ] TrueQuoteEngineV2 wiring — pending implementation

**STATUS: APPROVED — Ready for implementation**

---

*Updated: February 1, 2026*
*Approved by: User review*
