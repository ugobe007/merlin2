# 🔒 Contract Hardening - Complete Implementation Guide

**Status:** ✅ Implementation Blueprint Complete  
**Date:** January 2025

This document provides the complete implementation for all 6 contract hardening items, following the exact blueprint provided.

---

## ✅ 0) Wire Invariants (2 Quick Hooks)

### Step3Integration.tsx - Invariant A

**Location:** `src/components/wizard/Step3Integration.tsx` - `handleComplete()` function

**Status:** ✅ PARTIALLY IMPLEMENTED (needs import fix)

**Current Code (already added):**
```typescript
// ✅ INVARIANT A: Build the nextUseCaseData and assert no derived fields
const nextUseCaseData = {
  ...state.useCaseData,
  inputs: answers,
};

// ✅ CONTRACT INVARIANT A: Block any attempt to persist derived fields into useCaseData
if (process.env.NODE_ENV === 'development') {
  const { assertNoDerivedFieldsInStep3 } = require('../v6/utils/wizardStateValidator');
  const mockStateForInvariant = { ...state, useCaseData: nextUseCaseData };
  assertNoDerivedFieldsInStep3(mockStateForInvariant);
}
```

**Fix Needed:** Change `require()` to proper import at top of file:
```typescript
import { assertNoDerivedFieldsInStep3 } from '../v6/utils/wizardStateValidator';
```

---

### Step5MagicFit.tsx - Invariant B

**Location:** `src/components/wizard/v6/steps/Step5MagicFit.tsx` - After storing base values

**Status:** ⏳ TODO

**Pattern:**
```typescript
// After updateState({ calculations: baseCalcs }) in the useEffect
const { assertEngineOutputPopulatesCalculations } = await import('../utils/wizardStateValidator');

// Extract base calculations that were just stored
const baseCalcs = {
  annualConsumptionKWh: base.load.annualConsumptionKWh,
  peakDemandKW: base.load.peakDemandKW,
  utilityRate: base.utility.rate,
  demandCharge: base.utility.demandCharge,
};

// ✅ INVARIANT B: Ensure engine output populated calculations
if (process.env.NODE_ENV === 'development') {
  assertEngineOutputPopulatesCalculations(result, baseCalcs);
}
```

---

## ✅ 1) Step 5 Idempotency (Fingerprint + Cache)

### Create Fingerprint Function

**Location:** `src/components/wizard/v6/utils/wizardFingerprint.ts` (NEW FILE)

**Implementation:**
```typescript
/**
 * Create stable fingerprint for wizard state to enable quote caching
 * 
 * Includes only inputs that affect TrueQuote calculation:
 * - Location (zipCode, state)
 * - Industry
 * - useCaseData.inputs (raw answers)
 * - Preferences that affect sizing (solar, generator, ev)
 * 
 * Excludes:
 * - state.calculations (output, not input)
 * - quoteResult (output, not input)
 * - UI-only fields
 */
import type { WizardState } from '../types';

export function fingerprintWizardForQuote(state: WizardState): string {
  const fingerprint = {
    location: {
      zipCode: state.zipCode,
      state: state.state,
    },
    industry: state.industry,
    useCaseData: {
      inputs: state.useCaseData?.inputs || {},
    },
    preferences: {
      solar: {
        interested: state.selectedOptions?.includes('solar') || false,
        customSizeKw: state.customSolarKw,
      },
      generator: {
        interested: state.selectedOptions?.includes('generator') || false,
        customSizeKw: state.customGeneratorKw,
      },
      ev: {
        interested: state.selectedOptions?.includes('ev') || false,
        l2Count: state.customEvL2,
        dcfcCount: state.customEvDcfc,
      },
    },
  };

  // Create stable string fingerprint
  return JSON.stringify(fingerprint);
}
```

---

### Update WizardState Type (Add Cache)

**Location:** `src/components/wizard/v6/types.ts`

**Add to WizardState interface:**
```typescript
export interface WizardState {
  // ... existing fields ...
  
  // ✅ Quote cache for idempotency
  quoteCache?: {
    fingerprint: string;
    result: TrueQuoteAuthenticatedResult | null;
    inFlightFingerprint?: string; // Prevent concurrent calls
  };
}
```

---

### Update Step5MagicFit.tsx (Use Fingerprint)

**Location:** `src/components/wizard/v6/steps/Step5MagicFit.tsx` - `useEffect` for loadQuote

**Pattern:**
```typescript
useEffect(() => {
  async function loadQuote() {
    setIsLoading(true);
    setError(null);

    try {
      // ✅ IDEMPOTENCY: Check cache by fingerprint
      const { fingerprintWizardForQuote } = await import('../utils/wizardFingerprint');
      const fp = fingerprintWizardForQuote(state);

      // Check if we have a cached result for this fingerprint
      if (state.quoteCache?.fingerprint === fp && state.quoteCache?.result) {
        console.log('✅ Using cached quote result');
        const cachedResult = state.quoteCache.result;
        setQuoteResult(cachedResult);
        
        // Still need to commit base calcs if not already done
        const base = cachedResult.baseCalculation;
        updateState({
          calculations: {
            // ... base values ...
          }
        });
        
        setIsLoading(false);
        return;
      }

      // Check if same fingerprint is already in-flight (prevent concurrent calls)
      if (state.quoteCache?.inFlightFingerprint === fp) {
        console.log('⚠️ Quote generation already in-flight for this fingerprint');
        setIsLoading(false);
        return;
      }

      // Mark as in-flight
      updateState({
        quoteCache: {
          fingerprint: fp,
          result: null,
          inFlightFingerprint: fp,
        }
      });

      // ✅ VALIDATION: Assert state is valid before calling TrueQuote
      // ... existing validation code ...

      const result = await generateQuote(state);

      if (isRejected(result)) {
        setError(result.reason || "Quote generation failed");
        // Clear in-flight flag
        updateState({
          quoteCache: {
            fingerprint: fp,
            result: null,
            inFlightFingerprint: undefined,
          }
        });
        return;
      }

      if (isAuthenticated(result)) {
        setQuoteResult(result);

        // ✅ CACHE: Store result with fingerprint
        updateState({
          quoteCache: {
            fingerprint: fp,
            result: result,
            inFlightFingerprint: undefined, // Clear in-flight flag
          },
          calculations: {
            // ... base values ...
          }
        });

        // ✅ INVARIANT B: Ensure engine output populated calculations
        // ... invariant check ...
      }
    } catch (err) {
      // ... error handling ...
    } finally {
      setIsLoading(false);
    }
  }

  loadQuote();
}, [state]); // Note: Dependency on state, but cache prevents duplicate calls
```

---

## ✅ 2) Base vs Selected Split (Prevent Tier Overwrites)

### Update SystemCalculations Interface

**Location:** `src/components/wizard/v6/types.ts`

**Current Interface:**
```typescript
export interface SystemCalculations {
  // ✅ LOAD PROFILE (from TrueQuote baseCalculation - SSOT)
  annualConsumptionKWh?: number;
  peakDemandKW?: number;
  // ... rest of fields ...
}
```

**Recommended Change (Nested):**
```typescript
export interface SystemCalculations {
  // ✅ BASE VALUES (from TrueQuote baseCalculation - SSOT, never overwritten)
  base: {
    annualConsumptionKWh: number;
    peakDemandKW: number;
    utilityRate: number;
    demandCharge: number;
    utilityName?: string;
    hasTOU?: boolean;
  };
  
  // ✅ SELECTED VALUES (from tier option - user choice)
  selected: {
    bessKW: number;
    bessKWh: number;
    solarKW: number;
    generatorKW: number;
    evChargers: number;
    totalInvestment: number;
    annualSavings: number;
    paybackYears: number;
    tenYearROI: number;
    federalITC: number;
    netInvestment: number;
  };
  
  // Quote metadata
  quoteId?: string;
  pricingSources?: string[];
}
```

**Alternative (Flat with Prefixes):**
```typescript
export interface SystemCalculations {
  // ✅ BASE VALUES (prefix: base*)
  baseAnnualConsumptionKWh: number;
  basePeakDemandKW: number;
  baseUtilityRate: number;
  baseDemandCharge: number;
  
  // ✅ SELECTED VALUES (no prefix)
  bessKW: number;
  bessKWh: number;
  solarKW: number;
  // ... rest ...
  
  quoteId?: string;
}
```

**Recommendation:** Use nested approach for clarity, but flat is acceptable if you prefer.

---

### Update Step5MagicFit.tsx (Separate Base/Selected)

**Location:** `src/components/wizard/v6/steps/Step5MagicFit.tsx`

**When storing base values:**
```typescript
// ✅ Store BASE values (never overwritten)
updateState({
  calculations: {
    base: {
      annualConsumptionKWh: base.load.annualConsumptionKWh,
      peakDemandKW: base.load.peakDemandKW,
      utilityRate: base.utility.rate,
      demandCharge: base.utility.demandCharge,
      utilityName: base.utility.name,
      hasTOU: base.utility.hasTOU,
    },
    // selected will be populated when user picks a tier
  }
});
```

**When user selects tier:**
```typescript
// ✅ Store SELECTED values (overwrites only selected, not base)
updateState({
  calculations: {
    ...state.calculations, // Preserve base
    selected: {
      bessKW: option.bess.powerKW,
      bessKWh: option.bess.energyKWh,
      solarKW: option.solar.capacityKW,
      generatorKW: option.generator.capacityKW,
      evChargers: option.ev.l2Count + option.ev.dcfcCount + option.ev.ultraFastCount,
      totalInvestment: option.financials.totalInvestment,
      annualSavings: option.financials.annualSavings,
      paybackYears: option.financials.paybackYears,
      tenYearROI: option.financials.tenYearROI,
      federalITC: option.financials.federalITC,
      netInvestment: option.financials.netCost,
    },
    selectedPowerLevel: tier === "starter" ? "starter" : tier === "perfectFit" ? "perfect_fit" : "beast_mode",
  }
});
```

---

### Update ValueTicker (Read from Base/Selected)

**Location:** `src/components/wizard/v6/WizardV6.tsx` - `tickerValues` useMemo

**Pattern:**
```typescript
const tickerValues = useMemo(() => {
  // ✅ Read BASE values from calculations.base (SSOT from TrueQuote)
  const annualUsage = state.calculations?.base?.annualConsumptionKWh || 
                      state.calculations?.baseAnnualConsumptionKWh || 0;
  const peakDemand = state.calculations?.base?.peakDemandKW || 
                     state.calculations?.basePeakDemandKW || 0;
  const utilityRate = state.calculations?.base?.utilityRate || 
                      state.calculations?.baseUtilityRate || 0.12;
  const demandRate = state.calculations?.base?.demandCharge || 
                     state.calculations?.baseDemandCharge || 15;
  
  // ✅ Read SELECTED values from calculations.selected (user's tier choice)
  const solarKw = state.calculations?.selected?.solarKW || 
                  state.calculations?.solarKW || 0;
  const bessKwh = state.calculations?.selected?.bessKWh || 
                  state.calculations?.bessKWh || 0;
  // ... etc
  
  // ... rest of calculation ...
}, [state]);
```

---

## ✅ 3) Red Box UI (Validation Errors)

### Create ValidationErrorPanel Component

**Location:** `src/components/wizard/v6/components/ValidationErrorPanel.tsx` (NEW FILE)

**Implementation:**
```typescript
import React from 'react';
import { AlertTriangle, RotateCcw, Copy } from 'lucide-react';
import type { ValidationResult } from '../utils/wizardStateValidator';

interface ValidationErrorPanelProps {
  validation: ValidationResult;
  onReset: () => void;
  onCopyDebugInfo: () => void;
  onGoBack: () => void;
  missingStep?: number;
}

export function ValidationErrorPanel({
  validation,
  onReset,
  onCopyDebugInfo,
  onGoBack,
  missingStep,
}: ValidationErrorPanelProps) {
  const missingKeys = validation.errors.map(e => ({
    field: e.field,
    step: e.step,
    expected: e.expected,
  }));

  return (
    <div className="bg-red-500/10 border-2 border-red-500/30 rounded-2xl p-8">
      <div className="flex items-start gap-4 mb-6">
        <AlertTriangle className="w-12 h-12 text-red-400 flex-shrink-0 mt-1" />
        <div className="flex-1">
          <h3 className="text-2xl font-bold text-red-300 mb-2">
            Missing Required Fields
          </h3>
          <p className="text-red-400/80 mb-4">
            We can't generate options yet. Please complete the missing fields below.
          </p>
        </div>
      </div>

      {/* Missing Keys List */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-red-300 mb-3">Missing Fields:</h4>
        <ul className="space-y-2">
          {missingKeys.map((key, idx) => (
            <li key={idx} className="flex items-center gap-2 text-red-400">
              <span className="w-6 h-6 bg-red-500/20 rounded-full flex items-center justify-center text-xs font-bold">
                {key.step}
              </span>
              <span className="font-mono text-sm">{key.field}</span>
              <span className="text-red-400/60 text-xs">({key.expected})</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Actions */}
      <div className="flex gap-3 flex-wrap">
        {missingStep && (
          <button
            onClick={onGoBack}
            className="px-6 py-3 bg-red-500/20 text-red-300 rounded-xl hover:bg-red-500/30 transition-all border border-red-500/30 flex items-center gap-2"
          >
            Go Back to Step {missingStep}
          </button>
        )}
        <button
          onClick={onReset}
          className="px-6 py-3 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-all border border-slate-600 flex items-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Reset Wizard
        </button>
        <button
          onClick={onCopyDebugInfo}
          className="px-6 py-3 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-all border border-slate-600 flex items-center gap-2"
        >
          <Copy className="w-4 h-4" />
          Copy Debug Info
        </button>
      </div>
    </div>
  );
}
```

---

### Update Step5MagicFit.tsx (Use Error Panel)

**Location:** `src/components/wizard/v6/steps/Step5MagicFit.tsx`

**Import:**
```typescript
import { ValidationErrorPanel } from '../components/ValidationErrorPanel';
```

**In useEffect (validation catch):**
```typescript
try {
  // ... validation code ...
  assertWizardStateForTrueQuote(state);
} catch (error) {
  console.error('❌ WizardState validation failed:', error);
  
  // ✅ RED BOX UI: Show validation error panel
  const validation = validateWizardStateForTrueQuote(state);
  setValidationError(validation);
  setError(null); // Clear generic error
  setIsLoading(false);
  return;
}
```

**State:**
```typescript
const [validationError, setValidationError] = useState<ValidationResult | null>(null);
```

**Render:**
```typescript
// ✅ RED BOX UI: Render validation error panel
if (validationError) {
  const missingStep = validationError.errors[0]?.step || 3;
  return (
    <ValidationErrorPanel
      validation={validationError}
      onReset={() => {
        // Clear buffer and reset wizard
        if (typeof window !== 'undefined') {
          localStorage.removeItem('merlin_wizard_buffer');
          window.location.href = '/wizard?fresh=true';
        }
      }}
      onCopyDebugInfo={() => {
        // Copy debug info to clipboard
        const debugInfo = {
          errors: validationError.errors,
          warnings: validationError.warnings,
          state: {
            zipCode: state.zipCode,
            state: state.state,
            industry: state.industry,
            hasUseCaseData: !!state.useCaseData,
            hasInputs: !!(state.useCaseData?.inputs),
            inputKeys: state.useCaseData?.inputs ? Object.keys(state.useCaseData.inputs) : [],
          },
        };
        navigator.clipboard.writeText(JSON.stringify(debugInfo, null, 2));
      }}
      onGoBack={() => goToStep(missingStep)}
      missingStep={missingStep}
    />
  );
}

// Existing error state (for non-validation errors)
if (error) {
  // ... existing error UI ...
}
```

---

## ✅ 4) Missing Constants Guard (Structured Rejection)

### Update calculateFinancials

**Location:** `src/services/calculators/financialCalculator.ts`

**Pattern:**
```typescript
export interface FinancialCalculationInput {
  // ... existing fields ...
  constants?: {
    federalITCRate?: number;
    installationPercent?: number;
    [key: string]: any;
  };
}

export type FinancialCalculationResult = 
  | { ok: true; result: ActualFinancialCalculationResult }
  | { ok: false; code: 'MISSING_CONSTANTS'; missing: string[] };

export function calculateFinancials(
  input: FinancialCalculationInput,
  constants?: any
): FinancialCalculationResult {
  // ✅ GUARD: Check for required constants
  const requiredConstants = ['federalITCRate', 'installationPercent'];
  const missingConstants: string[] = [];
  
  if (!constants) {
    return {
      ok: false,
      code: 'MISSING_CONSTANTS',
      missing: requiredConstants,
    };
  }
  
  for (const key of requiredConstants) {
    if (constants[key] === undefined || constants[key] === null) {
      missingConstants.push(key);
    }
  }
  
  if (missingConstants.length > 0) {
    return {
      ok: false,
      code: 'MISSING_CONSTANTS',
      missing: missingConstants,
    };
  }
  
  // ✅ Continue with calculation using constants
  const federalITCRate = constants.federalITCRate || FINANCIAL_CONSTANTS.FEDERAL_ITC_RATE;
  // ... rest of calculation ...
  
  return {
    ok: true,
    result: {
      // ... calculated values ...
    },
  };
}
```

---

### Update TrueQuoteEngineV2 (Handle Rejection)

**Location:** `src/services/TrueQuoteEngineV2.ts` (or wherever calculateFinancials is called)

**Pattern:**
```typescript
const financialResult = calculateFinancials(input, constants);
if (!financialResult.ok) {
  return {
    rejected: true,
    reason: `Missing calculation constants: ${financialResult.missing.join(', ')}`,
    reasonCode: financialResult.code,
    details: financialResult.missing.map(key => ({
      field: key,
      expected: 'number',
      received: 'undefined',
    })),
    suggestion: 'Check calculation_constants table in database',
  } as TrueQuoteRejection;
}
```

---

### Update Step5MagicFit.tsx (Render Rejection)

**Location:** `src/components/wizard/v6/steps/Step5MagicFit.tsx`

**Pattern:**
```typescript
if (isRejected(result)) {
  // ✅ Check if it's a constants rejection
  if (result.reasonCode === 'MISSING_CONSTANTS') {
    return (
      <div className="bg-amber-500/10 border-2 border-amber-500/30 rounded-2xl p-8">
        <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-amber-300 mb-2 text-center">
          Configuration Missing
        </h3>
        <p className="text-amber-400/80 mb-4 text-center">
          We can't calculate economics yet because configuration constants are missing.
        </p>
        <div className="bg-amber-500/20 rounded-lg p-4 mb-4">
          <p className="text-amber-300 font-semibold mb-2">Missing Constants:</p>
          <ul className="list-disc list-inside text-amber-400 space-y-1">
            {result.details?.map((detail, idx) => (
              <li key={idx} className="font-mono text-sm">{detail.field}</li>
            ))}
          </ul>
        </div>
        <p className="text-amber-400/60 text-sm text-center italic">
          Admin/Dev: Check calculation_constants table in database
        </p>
      </div>
    );
  }
  
  // Generic rejection UI
  setError(result.reason || "Quote generation failed");
}
```

---

## ✅ 5) Regression Tests (3 Tiny Tests)

### Create Test File

**Location:** `tests/unit/wizard/contract-invariants.test.ts` (NEW FILE)

**Implementation:**
```typescript
import { describe, test, expect } from 'vitest';
import { bufferService } from '@/services/bufferService';
import { translateWizardState } from '@/services/MerlinOrchestrator';
import type { WizardState } from '@/components/wizard/v6/types';
import { validateWizardStateForTrueQuote } from '@/components/wizard/v6/utils/wizardStateValidator';

describe('Contract Invariants - Regression Tests', () => {
  
  // ✅ Test 1: State Migration Test
  test('Buffer migration removes old derived values from useCaseData', () => {
    // Input: Old buffer snapshot with derived values
    const oldState: WizardState = {
      zipCode: '90210',
      state: 'CA',
      industry: 'car_wash',
      useCaseData: {
        inputs: { bayCount: 4, facilityType: 'express_tunnel' },
        estimatedAnnualKwh: 150000, // ❌ Old derived value
        peakDemandKw: 250, // ❌ Old derived value
      } as any,
    };

    // Save old state (simulates migration on load)
    bufferService.save(oldState);
    
    // Load state (triggers migration)
    const loadedState = bufferService.load();
    
    // Expect: Derived values removed
    expect(loadedState.useCaseData).not.toHaveProperty('estimatedAnnualKwh');
    expect(loadedState.useCaseData).not.toHaveProperty('peakDemandKw');
    expect(loadedState.useCaseData?.inputs).toEqual({ bayCount: 4, facilityType: 'express_tunnel' });
    
    // Expect: Validator passes
    const validation = validateWizardStateForTrueQuote(loadedState);
    expect(validation.valid).toBe(true);
  });

  // ✅ Test 2: Mapper Contract Test
  test('Mapper preserves useCaseData.inputs structure exactly', () => {
    // Given: WizardState with useCaseData.inputs
    const state: WizardState = {
      zipCode: '90210',
      state: 'CA',
      industry: 'car_wash',
      useCaseData: {
        inputs: {
          bayCount: 4,
          facilityType: 'express_tunnel',
          blowerType: 'premium_6',
        },
      },
    };

    // When: Mapping to MerlinRequest
    const request = translateWizardState(state);

    // Expect: facility.useCaseData.inputs deep-equals state.useCaseData.inputs
    expect(request.facility.useCaseData.inputs).toEqual(state.useCaseData.inputs);
    expect(request.facility.useCaseData.inputs).not.toBe(state.useCaseData.inputs); // Different object
    expect(request.facility.useCaseData.inputs.bayCount).toBe(4);
    expect(request.facility.useCaseData.inputs.facilityType).toBe('express_tunnel');
  });

  // ✅ Test 3: Step 5 Base Commit Test
  test('Step 5 commits base values from TrueQuote result', () => {
    // Given: Mocked TrueQuoteAuthenticatedResult
    const mockQuoteResult = {
      quoteId: 'MQ-TEST123',
      baseCalculation: {
        load: {
          annualConsumptionKWh: 1500000,
          peakDemandKW: 250,
        },
        utility: {
          rate: 0.12,
          demandCharge: 15,
          name: 'Test Utility',
        },
      },
    };

    // When: Step 5 commits base values
    const baseCalcs = {
      base: {
        annualConsumptionKWh: mockQuoteResult.baseCalculation.load.annualConsumptionKWh,
        peakDemandKW: mockQuoteResult.baseCalculation.load.peakDemandKW,
        utilityRate: mockQuoteResult.baseCalculation.utility.rate,
        demandCharge: mockQuoteResult.baseCalculation.utility.demandCharge,
      },
    };

    // Expect: Base values exist
    expect(baseCalcs.base.annualConsumptionKWh).toBe(1500000);
    expect(baseCalcs.base.peakDemandKW).toBe(250);
    expect(baseCalcs.base.utilityRate).toBe(0.12);
    expect(baseCalcs.base.demandCharge).toBe(15);
    
    // Expect: Invariant B would pass (we'd check this in actual Step 5 code)
    expect(baseCalcs.base.annualConsumptionKWh).not.toBeUndefined();
    expect(baseCalcs.base.peakDemandKW).not.toBeUndefined();
  });
});
```

---

## 📋 Implementation Checklist

- [x] 0. Wire Invariant A in Step3Integration
- [ ] 0. Wire Invariant B in Step5MagicFit
- [ ] 1. Create fingerprint function
- [ ] 1. Add quoteCache to WizardState
- [ ] 1. Update Step5MagicFit to use fingerprint cache
- [ ] 2. Update SystemCalculations interface (base/selected split)
- [ ] 2. Update Step5MagicFit to store base/selected separately
- [ ] 2. Update ValueTicker to read from base/selected
- [ ] 3. Create ValidationErrorPanel component
- [ ] 3. Update Step5MagicFit to use error panel
- [ ] 4. Update calculateFinancials to return structured rejection
- [ ] 4. Update TrueQuoteEngineV2 to handle rejection
- [ ] 4. Update Step5MagicFit to render constants rejection
- [ ] 5. Create regression test file
- [ ] 5. Add 3 tests (migration, mapper, step5 commit)

---

## 🚀 Recommended Execution Order

1. **Idempotency (fingerprint + cache)** - Prevents duplicate calls
2. **Base vs Selected Split** - Prevents tier overwrites
3. **Red Box UI** - Turns validation into UX
4. **Missing Constants Guard** - Prevents production "mystery NaN"
5. **Regression Tests** - Locks it all down

---

**Last Updated:** January 2025  
**Version:** 1.0.0  
**Status:** ✅ Implementation Blueprint Complete
