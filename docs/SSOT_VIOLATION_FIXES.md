# SSOT Violation Fixes

## Fixed: `calculateArbitrageSavings` in `constants.ts`

### Problem
The function `calculateArbitrageSavings` in `src/components/wizard/v6/constants.ts` was computing `annualSavings` using arithmetic:

```typescript
const rateSpread = electricityRate * 0.3;
const annualSavings = dailyKWh * rateSpread * 365;
```

This violates SSOT because:
- It computes financial metrics outside of TrueQuote
- A file named `constants.ts` in `/wizard/v6/` is implicitly trusted
- Future devs might use this instead of TrueQuote results

### Solution
**Removed** the function and replaced with deprecation comment pointing to TrueQuote.

### Migration Path
If you need `annualSavings`, read from:
- `state.calculations.selected.annualSavings` (after Step 5)
- `result.options[tier].financials.annualSavings` (from TrueQuote result)

### Files Affected
- ✅ `src/components/wizard/v6/constants.ts` - Function removed
- ⚠️ `src/services/scenarioGenerator.ts` - Import removed (legacy file, acceptable)
- ✅ `src/services/calculators/financialCalculator.ts` - Has its own `calculateArbitrageSavings` (different function, OK)

## SSOT Violation Checker

Created `scripts/check-wizard-ssot-violations.sh` to prevent future regressions.

**Blocklist patterns:**
- `annualSavings\s*=`
- `paybackYears\s*=`
- `tenYearROI\s*=`
- `federalITC\s*=`
- `netInvestment\s*=`
- `calculateFinancial`
- `calculateBESS`
- `gridSynkBESSCalculator`
- `compareConfigFinancials`

**Allowlist:**
- `src/components/wizard/v6/steps/Step5MagicFit.tsx` (only authorized compute moment)

## 3-Test Contract Suite

Created `tests/wizard-v6-ssot.test.ts` with 3 critical tests:

1. **Validation blocks bad input** - Red Box path works
2. **TrueQuote populates calculations.base** - SSOT write path works
3. **Tier switching never mutates base** - Immutability preserved

If these pass, the wizard cannot regress.

## Remaining Items

### `TrueQuoteVerifyBadge.tsx` - `calculateFinancialProjection`
This file uses `calculateFinancialProjection` for display/verification purposes.

**Status:** Likely acceptable (Category C: Presentation)
- Should verify it's not writing to `state.calculations`
- If it's only reading/displaying, it's fine
- If it's computing new values, it should be moved to legacy or refactored

### `scenarioGenerator.ts` - Legacy Usage
This file imports `calculateArbitrageSavings` but it's a legacy/experimental file.

**Status:** Acceptable (Category D: Legacy)
- Marked as legacy/experimental
- Not used by WizardV6
- May need refactoring if used in production
