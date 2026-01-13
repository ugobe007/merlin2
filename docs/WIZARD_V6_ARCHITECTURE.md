# Wizard V6 Architecture (SSOT)

## Authority Boundary

**WizardV6 owns quoting.** Only these files may call TrueQuote:

```
/wizard/v6/
  ├─ Step5MagicFit.tsx   ✅ (only compute moment)
  ├─ wizardFingerprint.ts
  ├─ wizardStateValidator.ts
```

**These files must NOT call quote engines:**
- `BessQuoteBuilder.tsx` (deprecated shell)
- `UnifiedQuoteCalculator.ts` (legacy)
- `magicFitScenarios.ts` (experimental)
- `QuoteEngine.ts` (legacy orchestrator)

They may:
- format
- explain
- display
- export
- verify

They may NOT:
- size
- price
- compute savings
- write to `WizardV6State.calculations`

## File Categories

### 🟣 Category A: SSOT Engines (KEEP ISOLATED)
Pure engines, no React:
- `/services/merlin` ← TrueQuote
- `/gridSynkBESSCalculator` ← low-level sizing

**Rule:** No UI imports. Ever.

### 🔵 Category B: Wizard Controllers (AUTHORITATIVE)
Own user intent and state:
- `WizardV6.tsx`
- `Step3Integration.tsx`
- `Step5MagicFit.tsx`
- `Step6Quote.tsx`
- `wizardFingerprint.ts`
- `wizardStateValidator.ts`

**Rule:** Only these may:
- call `generateQuote`
- write `calculations`
- update `selectedPowerLevel`

### 🟢 Category C: Presentation & Explainability (READ-ONLY)
Consume results but do not decide them:
- `TrueQuoteModal.tsx`
- `TrueQuoteVerifyBadge.tsx`
- `Step6Quote.tsx`
- `ValidationErrorPanel.tsx`
- `QuoteExportUtils.ts`

**Rule:** They may read:
- `state.calculations.base`
- `state.calculations.selected`

They may never modify them.

### 🟠 Category D: Legacy / Experimental (QUARANTINE)
Current risk zone:
- `magicFitScenarios.ts`
- `UnifiedQuoteCalculator.ts`
- `QuoteEngine.ts`
- `BessQuoteBuilder.tsx`

**Action:**
- Marked with `@deprecated`
- Header comment: `⚠️ NOT USED BY WIZARD V6`
- May be moved to `/legacy/` or `/experiments/`

## One-Way Data Flow

The ONLY valid quote pipeline:

```
WizardState
   ↓
validateWizardStateForTrueQuote
   ↓
fingerprintWizardForQuote
   ↓
generateQuote (TrueQuote)
   ↓
calculations.base   ← immutable
calculations.selected ← tier projection
   ↓
Step 6 / Modals / Export
```

**If any file violates this direction → delete or refactor it.**

## Hard Rules

### Rule 1: No math in UI
Search for:
- `annualSavings =`
- `paybackYears =`
- `batteryKW =`

Outside `Step5MagicFit` → delete or replace with reads.

### Rule 2: No silent fallback math
If something is missing:
- Red Box (wizard)
- Structured rejection (engine)

Never "assume 30% ITC" silently.

### Rule 3: Tests protect the contract
You only need 3 tests:
1. Wizard state validation blocks bad input
2. TrueQuote populates `calculations.base`
3. Tier switching never mutates `base`

## State Structure

```typescript
WizardV6State {
  // Inputs (Steps 1-4)
  zipCode, state, industry, useCaseData.inputs, selectedOptions
  
  // Cache (idempotency)
  quoteCache?: {
    fingerprint: string;
    result: TrueQuoteAuthenticatedResult | null;
    inFlightFingerprint?: string;
  }
  
  // Calculations (Step 5+)
  calculations?: {
    base: CalculationsBase;      // immutable SSOT from TrueQuote
    selected: CalculationsSelected; // tier projection
  }
}
```

## Invariants

### Invariant A: No derived fields in Step 3
`useCaseData.inputs` must only contain raw user inputs.
No `estimatedAnnualKwh`, `peakDemandKw`, etc.

### Invariant B: Engine populates base
After `generateQuote`, `calculations.base` must contain:
- `annualConsumptionKWh`
- `peakDemandKW`
- `utilityRate`
- `demandCharge`
- `quoteId`

## Next Steps

1. ✅ Freeze WizardV6 as authoritative
2. ✅ Quarantine legacy calculators (deprecation headers)
3. ⏳ Run 3-test checklist
4. ⏳ Monitor for violations
5. ⏳ Consider moving legacy files to `/legacy/`
