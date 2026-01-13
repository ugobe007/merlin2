# SSOT Policy Audit - January 2026

## Executive Summary

Audit of SSOT policy compliance, TrueQuote policy, wizard state, false executables, and incorrect dependencies.

**Audit Date:** January 2026  
**Architecture:** Porsche 911 (MerlinOrchestrator → TrueQuoteEngineV2 → MagicFit → proposalValidator)

---

## 🔴 CRITICAL ISSUES FOUND

### 1. WizardV6.tsx - RequestQuoteModal (FIXED ✅)

**Location:** `src/components/wizard/v6/WizardV6.tsx` lines 434-439

**Issue:** Reading flat `state.calculations.*` instead of nested `state.calculations.selected.*`

**Status:** FIXED - Now reads from correct nested paths

```tsx
// BEFORE (❌ WRONG - flat structure)
storageSizeMW: state.calculations.bessKW / 1000,

// AFTER (✅ CORRECT - nested structure)  
storageSizeMW: state.calculations.selected.bessKW / 1000,
```

**IMPORTANT:** As of January 2026, `calculations` uses nested structure:
```typescript
calculations: {
  base: { bessKW, bessKWh, solarKW, ... },    // MagicFit base recommendations  
  selected: { bessKW, bessKWh, solarKW, ... } // User's selected values
}
```

---

## 🟡 DEPRECATED DEPENDENCIES

### Files Still Importing from Deprecated TrueQuoteEngine (v1)

| File | Import | Status |
|------|--------|--------|
| `src/hooks/useTrueQuote.ts` | `calculateTrueQuote` | ⚠️ DEAD CODE - not used anywhere |
| `src/components/wizard/v6/utils/trueQuoteMapper.ts` | `TrueQuoteInput` type | ⚠️ Type-only import |
| `src/tests/trueQuoteDataFlowTest.ts` | Multiple | Test file |
| `tests/validation/TrueQuoteEngineAllIndustries.test.ts` | Multiple | Test file |
| `tests/validation/TrueQuoteValidation.test.ts` | `calculateTrueQuote` | Test file |

### Deprecated Files Still Present

| File | Status | Used By | Action |
|------|--------|---------|--------|
| `src/services/TrueQuoteEngine.ts` | `@deprecated` header | useTrueQuote.ts (dead code), tests | Keep for test compatibility |
| `src/services/bessDataService.ts` | Multiple deprecated functions | Unknown | Audit needed |
| `src/core/calculations/QuoteEngine.ts` | Pre-Porsche 911 | Unknown | Should be removed |

---

## 🟢 FALSE EXECUTABLES (Dead Code)

### 1. useTrueQuote.ts - DEAD CODE

**Location:** `src/hooks/useTrueQuote.ts`

**Evidence:** Zero imports found in entire codebase

```bash
grep -r "useTrueQuote" --include="*.tsx" --include="*.ts" | grep -v "useTrueQuote.ts"
# Returns: 0 matches (excluding the file itself)
```

**Purpose:** Was intended to power TrueQuoteVerifyBadge but never integrated

**Recommendation:** Mark as deprecated, do not modify

---

## ✅ CORRECT SSOT FLOW

The correct calculation flow (Porsche 911 Architecture):

```
┌─────────────────────────────────────────────────────────────────┐
│                         Step5MagicFit.tsx                       │
│                    ONLY file that calls generateQuote           │
└─────────────────────────────────────┬───────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                      MerlinOrchestrator.ts                      │
│                    General Contractor - Entry Point              │
└─────────────────────────────────────┬───────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                      TrueQuoteEngineV2.ts                       │
│                    Prime Sub - All Calculations                  │
└─────────────────────────────────────┬───────────────────────────┘
                                      │
              ┌───────────────────────┼───────────────────────────┐
              ▼                       ▼                           ▼
┌────────────────────┐  ┌────────────────────┐  ┌────────────────────┐
│ calculators/*.ts   │  │    MagicFit.ts     │  │ proposalValidator  │
│                    │  │   3 Option Generator│  │   Authentication    │
│ - loadCalculator   │  │                    │  │                    │
│ - bessCalculator   │  │ starter/perfect/   │  │ Validates MagicFit │
│ - solarCalculator  │  │ beast_mode         │  │ proposals          │
│ - financialCalc    │  └────────────────────┘  └────────────────────┘
└────────────────────┘
```

---

## Type Contract: SystemCalculations

**Location:** `src/components/wizard/v6/types.ts`

```typescript
interface SystemCalculations {
  base: CalculationsBase;      // Immutable base values
  selected: CalculationsSelected;  // Tier-selected values
}

interface CalculationsBase {
  annualConsumptionKWh: number;
  peakDemandKW: number;
  utilityName?: string;
  utilityRate?: number;
  demandCharge?: number;
  quoteId?: string;
  pricingSources?: string[];
}

interface CalculationsSelected {
  bessKW: number;           // ← Use this for BESS power
  bessKWh: number;          // ← Use this for BESS energy
  solarKW: number;
  evChargers: number;
  generatorKW: number;
  totalInvestment: number;  // ← Use this for costs
  annualSavings: number;
  paybackYears: number;
  tenYearROI: number;
  federalITC: number;
  netInvestment: number;
}
```

---

## Recommended Actions

### Immediate (P0)
- [x] Fix WizardV6.tsx RequestQuoteModal reads ✅

### Short-term (P1)
- [ ] Mark `useTrueQuote.ts` as deprecated (dead code)
- [ ] Update trueQuoteMapper.ts to import types from contracts.ts instead

### Medium-term (P2)
- [ ] Migrate tests to use TrueQuoteEngineV2 or MerlinOrchestrator
- [ ] Clean up QuoteEngine.ts (pre-Porsche 911)
- [ ] Audit bessDataService.ts usage

---

## Audit Checklist

| Item | Status | Notes |
|------|--------|-------|
| WizardV6 state reads | ✅ FIXED | RequestQuoteModal now uses nested paths |
| Step5MagicFit writes | ✅ OK | Writes nested `{ base, selected }` |
| Step6Quote reads | ✅ FIXED | Reads from correct paths |
| trueQuoteMapper reads | ✅ FIXED | Reads from `calculations.selected.*` |
| useTrueQuote.ts | ⚠️ DEAD | Not imported anywhere |
| TrueQuoteEngine.ts (v1) | ⚠️ DEPRECATED | Used by dead code + tests |
| Deprecated imports | ⚠️ PRESENT | 5 files import deprecated v1 |
