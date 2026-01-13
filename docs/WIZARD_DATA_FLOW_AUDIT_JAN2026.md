# Wizard Data Flow Audit - January 2026

## Executive Summary

**Status: ✅ SSOT COMPLIANT (with minor issues)**

The wizard follows the correct data flow pattern. Key findings:

1. ✅ **Step 1-4**: Only RAW INPUTS are stored (no calculations)
2. ✅ **Step 5 (MagicFit)**: ONLY place that calls `generateQuote()` - SSOT compliant
3. ✅ **Step 5 writes**: Correctly writes nested `{ base, selected }` structure
4. ⚠️ **Step 4**: Has local `calcSolar()`, `calcEv()`, `calcGen()` helper functions for UI preview ONLY
5. ✅ **Persistence**: `bufferService` handles localStorage persistence correctly

---

## Complete Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            STEP 1: LOCATION                                 │
│                         (Step1Location.tsx)                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ WRITES TO STATE:                                                            │
│   - zipCode: string                                                         │
│   - state: string (from getStateFromZip)                                    │
│   - city: string                                                            │
│   - country: string ('US' or international)                                 │
│   - goals: EnergyGoal[] (min 2 required)                                    │
│   - solarData: { sunHours, rating } (from SSOT: stateElectricityRates.ts)   │
│   - electricityRate: number (from SSOT: stateElectricityRates.ts)           │
│                                                                             │
│   OPTIONAL (Google Places lookup):                                          │
│   - businessName, businessAddress, businessPhotoUrl, businessPlaceId        │
│   - detectedIndustry: string (auto-detected from business type)             │
│   - industry: string (auto-set if business found)                           │
│   - industryName: string (display name)                                     │
│                                                                             │
│ ❌ NO CALCULATIONS - Only raw inputs                                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            STEP 2: INDUSTRY                                 │
│                         (Step2Industry.tsx)                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ WRITES TO STATE:                                                            │
│   - industry: string (slug like 'hotel', 'car-wash')                        │
│   - industryName: string (display name like 'Hotel / Hospitality')          │
│                                                                             │
│ NOTE: May be SKIPPED if Step 1 auto-detected industry from business lookup  │
│                                                                             │
│ ❌ NO CALCULATIONS - Only raw inputs                                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          STEP 3: FACILITY DETAILS                           │
│                (Step3Details.tsx → Step3Integration.tsx                     │
│                      → CompleteStep3Component.tsx)                          │
├─────────────────────────────────────────────────────────────────────────────┤
│ WRITES TO STATE:                                                            │
│   - useCaseData.inputs: Record<string, unknown>                             │
│     {                                                                       │
│       roomCount: number,       // Hotel                                     │
│       bayCount: number,        // Car Wash                                  │
│       squareFootage: number,   // Office/Warehouse                          │
│       bedCount: number,        // Hospital                                  │
│       chargerCount: number,    // EV Charging                               │
│       ... (industry-specific questions)                                     │
│     }                                                                       │
│                                                                             │
│ ✅ SSOT ENFORCED:                                                           │
│   - assertNoDerivedFieldsInStep3() validates no peakDemandKw,               │
│     estimatedAnnualKwh, or calculations are written here                    │
│   - TrueQuote is SSOT for all derived values                                │
│                                                                             │
│ ❌ NO CALCULATIONS - Only raw inputs                                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           STEP 4: OPTIONS                                   │
│                         (Step4Options.tsx)                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│ WRITES TO STATE:                                                            │
│   - selectedOptions: string[] ('solar', 'ev', 'generator')                  │
│   - solarTier: 'starter' | 'recommended' | 'maximum' | null                 │
│   - evTier: 'basic' | 'standard' | 'premium' | null                         │
│   - customSolarKw: number (custom override)                                 │
│   - customEvL2: number                                                      │
│   - customEvDcfc: number                                                    │
│   - customEvUltraFast: number                                               │
│   - customGeneratorKw: number                                               │
│   - generatorFuel: 'natural-gas' | 'diesel'                                 │
│   - solarEnabled: boolean (toggle state)                                    │
│   - evEnabled: boolean                                                      │
│   - generatorEnabled: boolean                                               │
│                                                                             │
│ ⚠️ LOCAL CALCULATIONS (UI PREVIEW ONLY):                                    │
│   - calcSolar(), calcEv(), calcGen() - helper functions for tier cards      │
│   - These are for DISPLAY ONLY in the step                                  │
│   - NOT persisted to state.calculations                                     │
│   - NOT used by Step 5 MagicFit (MagicFit does its own SSOT calculations)   │
│                                                                             │
│ ⚠️ POTENTIAL ISSUE: User sees estimates in Step 4 that may differ from     │
│    Step 5 MagicFit results. This is by design (preview vs SSOT).            │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ⭐ STEP 5: MAGIC FIT ⭐                               │
│                        (Step5MagicFit.tsx)                                  │
│                    THE SINGLE SOURCE OF TRUTH                               │
├─────────────────────────────────────────────────────────────────────────────┤
│ ON MOUNT (useEffect):                                                       │
│   1. Calls generateQuote(state) from @/services/merlin                      │
│   2. This invokes MerlinOrchestrator.generateQuote()                        │
│   3. MerlinOrchestrator validates state and translates to MerlinRequest     │
│   4. Delegates to TrueQuoteEngineV2.processQuote()                          │
│   5. TrueQuoteEngineV2:                                                     │
│      a. calculateLoad() → peakDemandKW, annualConsumptionKWh                │
│      b. calculateBESS() → bessKW, bessKWh                                   │
│      c. calculateSolar() → solarKW                                          │
│      d. calculateGenerator() → generatorKW                                  │
│      e. calculateEV() → evChargers                                          │
│      f. calculateFinancials() → costs, savings, ROI                         │
│   6. Delegates to MagicFit.generateMagicFitProposal() for 3 tiers           │
│   7. proposalValidator.authenticateProposal() validates results             │
│   8. Returns TrueQuoteAuthenticatedResult                                   │
│                                                                             │
│ WRITES TO STATE (on tier selection):                                        │
│   - selectedPowerLevel: 'starter' | 'perfect_fit' | 'beast_mode'            │
│   - calculations: SystemCalculations {                                      │
│       base: {                                    // IMMUTABLE               │
│         annualConsumptionKWh: number,            // From load calculator    │
│         peakDemandKW: number,                    // From load calculator    │
│         utilityName: string,                     // From utility service    │
│         utilityRate: number,                     // From utility service    │
│         demandCharge: number,                    // From utility service    │
│         hasTOU: boolean,                         // Time-of-use flag        │
│         quoteId: string,                         // Unique quote ID         │
│         pricingSources: string[],                // Sources used            │
│       },                                                                    │
│       selected: {                                // CHANGES BY TIER         │
│         bessKW: number,                          // Selected tier BESS      │
│         bessKWh: number,                         // Selected tier energy    │
│         solarKW: number,                         // Selected tier solar     │
│         evChargers: number,                      // Selected tier EV        │
│         generatorKW: number,                     // Selected tier gen       │
│         totalInvestment: number,                 // Total cost              │
│         annualSavings: number,                   // Yearly savings          │
│         paybackYears: number,                    // Payback period          │
│         tenYearROI: number,                      // 10-year ROI             │
│         federalITC: number,                      // Federal tax credit $    │
│         federalITCRate: number,                  // ITC percentage (0.30)   │
│         netInvestment: number,                   // After incentives        │
│       }                                                                     │
│     }                                                                       │
│                                                                             │
│ ✅ SSOT ENFORCEMENT:                                                        │
│   - ONLY Step5MagicFit calls generateQuote()                                │
│   - ONLY Step5MagicFit writes to state.calculations                         │
│   - All financials come from TrueQuoteEngineV2 (authenticated)              │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            STEP 6: QUOTE                                    │
│                          (Step6Quote.tsx)                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│ READS FROM STATE (no writes):                                               │
│   - state.calculations.base.* (quoteId, utilityRate, demandCharge, etc.)    │
│   - state.calculations.selected.* (bessKW, totalInvestment, etc.)           │
│   - state.selectedPowerLevel                                                │
│   - state.industryName                                                      │
│   - state.city, state.state                                                 │
│                                                                             │
│ ✅ READ-ONLY - Displays results, does not modify state.calculations         │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Persistence Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          bufferService.ts                                   │
│                    (src/services/bufferService.ts)                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  WizardV6.tsx                                                               │
│  ├── On mount: state = bufferService.load() || INITIAL_WIZARD_STATE        │
│  ├── On state change: bufferService.autoSave(state, 1000) // 1s debounce   │
│  ├── On step change: bufferService.save(state) // immediate                 │
│  └── On beforeunload: bufferService.save(state) // immediate                │
│                                                                             │
│  Storage: localStorage (key: 'merlin_wizard_v6')                            │
│                                                                             │
│  Fresh Start: ?fresh=true or ?new=true clears persisted state               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## ⚠️ Potential Issues Found

### 1. Step 4 Preview Calculations (LOW RISK)

**Location:** `Step4Options.tsx` lines 68-120

**Issue:** Step 4 has local `calcSolar()`, `calcEv()`, `calcGen()` functions that calculate preview values for tier cards.

**Risk Level:** LOW - These are for UI preview only and are NOT persisted to `state.calculations`.

**Why it's OK:**
- Step 5 MagicFit ignores these and does fresh calculations via SSOT
- User may see slightly different numbers between Step 4 and Step 5 (preview vs actual)
- This is acceptable UX - preview estimates vs final TrueQuote results

### 2. ValueTicker Reads (OK - Correctly Implemented)

**Location:** `WizardV6.tsx` lines 201-248

**Status:** ✅ CORRECT - ValueTicker reads from `state.calculations.base.*` and `state.calculations.selected.*` (nested structure)

### 3. RequestQuoteModal Reads (FIXED)

**Location:** `WizardV6.tsx` lines 430-445

**Status:** ✅ FIXED - Now reads from `state.calculations.selected.*` (nested structure)

---

## SSOT Architecture Verification

| Component | Writes calculations? | Reads calculations? | Status |
|-----------|---------------------|---------------------|--------|
| Step1Location | ❌ No | ❌ No | ✅ OK |
| Step2Industry | ❌ No | ❌ No | ✅ OK |
| Step3Details | ❌ No (enforced) | ❌ No | ✅ OK |
| Step4Options | ❌ No (local preview only) | ❌ No | ✅ OK |
| **Step5MagicFit** | ✅ **YES - SSOT** | ❌ No | ✅ OK |
| Step6Quote | ❌ No | ✅ Yes (read-only) | ✅ OK |
| ValueTicker | ❌ No | ✅ Yes (display) | ✅ OK |
| RequestQuoteModal | ❌ No | ✅ Yes (display) | ✅ FIXED |

---

## Calculation Chain Verification

```
User Input (Steps 1-4)
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│                   MerlinOrchestrator.ts                         │
│               translateWizardState(state)                       │
│                         ↓                                       │
│           Creates MerlinRequest from:                           │
│           - state.zipCode, state.state, state.city             │
│           - state.goals                                         │
│           - state.industry, state.industryName                  │
│           - state.useCaseData (raw facility inputs)             │
│           - state.selectedOptions, customSolarKw, etc.          │
└─────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│                   TrueQuoteEngineV2.ts                          │
│                  processQuote(request)                          │
│                         ↓                                       │
│           1. calculateLoad() → peakDemandKW                     │
│           2. calculateBESS() → bessKW, bessKWh                  │
│           3. calculateSolar() → solarKW                         │
│           4. calculateGenerator() → generatorKW                 │
│           5. calculateEV() → evChargers                         │
│           6. calculateFinancials() → all money stuff            │
└─────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│                      MagicFit.ts                                │
│             generateMagicFitProposal(base, prefs)               │
│                         ↓                                       │
│           Creates 3 tiers:                                      │
│           - starter (60-70% of Perfect Fit)                     │
│           - perfectFit (optimal for facility)                   │
│           - beastMode (120-150% of Perfect Fit)                 │
└─────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│              proposalValidator.ts                               │
│             authenticateProposal(proposal)                      │
│                         ↓                                       │
│           Validates all numbers are within bounds               │
│           Ensures no negative values, reasonable paybacks       │
│           Returns: TrueQuoteAuthenticatedResult                 │
└─────────────────────────────────────────────────────────────────┘
        │
        ▼
    Step5MagicFit writes to state.calculations
```

---

## Conclusion

**The wizard data flow is SSOT compliant.**

| Aspect | Status | Notes |
|--------|--------|-------|
| Raw inputs (Steps 1-4) | ✅ Correct | Only raw data, no calculations stored |
| SSOT calculations | ✅ Correct | Only Step5MagicFit calls generateQuote() |
| Nested structure | ✅ Fixed | Now uses `{ base, selected }` everywhere |
| Persistence | ✅ Correct | bufferService handles localStorage properly |
| Step 4 preview | ⚠️ Acceptable | Local calcs for UI only, not persisted |
| No duplicate calcs | ✅ Verified | Only one calculation path (TrueQuoteEngineV2) |
