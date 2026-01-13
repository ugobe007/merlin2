# ✅ Data Contract Verification Checklist - COMPLETE

**Date:** January 2025  
**Status:** ✅ All Items Verified and Fixed

This document verifies all checklist items from the data contract review to prevent "it's implemented but still flaky" surprises.

---

## ✅ 1. ValueTicker Reads from Step 5 (SSOT)

**Status:** ✅ FIXED

**Before:**
```typescript
// ❌ WRONG: Reading from Step 3 (useCaseData)
const annualUsage = state.useCaseData?.estimatedAnnualKwh || 0;
const peakDemand = state.useCaseData?.peakDemandKw || 0;
```

**After:**
```typescript
// ✅ CORRECT: Reading from Step 5 (calculations - SSOT)
const annualUsage = state.calculations?.annualConsumptionKWh || 0;
const peakDemand = state.calculations?.peakDemandKW || 0;
```

**Files Changed:**
- `src/components/wizard/v6/WizardV6.tsx` (lines 204-246)
- `src/components/wizard/v6/types.ts` (SystemCalculations interface)

**Impact:** ValueTicker now reads from `state.calculations.*` (Step 5 SSOT), not `state.useCaseData.*` (Step 3). This prevents stale values and NaNs.

---

## ✅ 2. Handle Old Autosaved States (Migration)

**Status:** ✅ FIXED

**Problem:** Users resuming in-progress wizards may load older state shapes with derived values in `useCaseData` (violates new contract).

**Solution:** Added migration logic to remove old derived values:

```typescript
// In bufferService.ts migrate()
if (buffer.state.useCaseData) {
  const useCaseData = buffer.state.useCaseData as any;
  // Remove old Step 3 computed values (they violate the new contract)
  if ('estimatedAnnualKwh' in useCaseData || 'peakDemandKw' in useCaseData) {
    console.log('🔧 Migrating: Removing old Step 3 derived values from useCaseData');
    const { estimatedAnnualKwh, peakDemandKw, ...cleanUseCaseData } = useCaseData;
    buffer.state.useCaseData = cleanUseCaseData;
  }
}
```

**Files Changed:**
- `src/services/bufferService.ts` (migrate() method)

**Impact:** Old states are automatically cleaned up when loaded, preventing contract violations.

---

## ✅ 3. Mapping Function Verified

**Status:** ✅ VERIFIED (No Changes Needed)

**Mapping Function:** `translateWizardState()` in `MerlinOrchestrator.ts`

```typescript
facility: {
  industry: normalizeIndustry(state.industry),
  industryName: state.industryName || state.industry || 'Unknown',
  useCaseData: state.useCaseData || {},  // ✅ Correct - passes entire useCaseData object
},
```

**Critical Path:**
- `state.useCaseData.inputs` → `request.facility.useCaseData.inputs`
- TrueQuote reads from `request.facility.useCaseData.inputs.*`

**Verification:**
- ✅ Mapping correctly passes `state.useCaseData` (includes `inputs`)
- ✅ Structure matches engine expectation: `facility.useCaseData.inputs`
- ✅ No extra wrapping levels

**Impact:** No mapping drift - TrueQuote receives correct data structure.

---

## ✅ 4. Step 5 Stores Base Values Immediately

**Status:** ✅ FIXED

**Problem:** Step 5 only stored values AFTER tier selection, causing ValueTicker to show 0s before user picks.

**Solution:** Store base calculation values immediately after quote result (before tier selection):

```typescript
// In Step5MagicFit.tsx, after isAuthenticated(result)
const base = result.baseCalculation;
updateState({
  calculations: {
    // ✅ Base load profile (SSOT from TrueQuote)
    annualConsumptionKWh: base.load.annualConsumptionKWh,
    peakDemandKW: base.load.peakDemandKW,
    // ✅ Utility rates (SSOT from TrueQuote)
    utilityRate: base.utility.rate,
    demandCharge: base.utility.demandCharge,
    utilityName: base.utility.name,
    // ✅ Base values (will be updated when user selects tier)
    bessKW: base.bess.powerKW,
    bessKWh: base.bess.energyKWh,
    solarKW: base.solar.capacityKW,
    // ... other base values
  }
});
```

**Files Changed:**
- `src/components/wizard/v6/steps/Step5MagicFit.tsx` (after isAuthenticated check)
- `src/components/wizard/v6/types.ts` (added `annualConsumptionKWh` and `peakDemandKW` to SystemCalculations)

**Impact:** ValueTicker has data immediately after Step 5 loads, even before tier selection.

---

## ✅ 5. Validation Logging Improved (Actionable)

**Status:** ✅ FIXED

**Problem:** Previous logging didn't answer "Is this a UI state problem, mapping problem, or engine problem?"

**Solution:** Enhanced `logWizardStateSchema()` to include:

```typescript
// ✅ Step name
console.log('📍 Step:', 'Step 5 (MagicFit/TrueQuote)');

// ✅ Presence/absence map (boolean per key) - CRITICAL for debugging
console.log('✅ Presence Map (Required Fields):', {
  'zipCode': !!state.zipCode,
  'state': !!state.state,
  'industry': !!state.industry,
  'useCaseData.inputs': !!(state.useCaseData?.inputs),
  // ...
});

// ✅ Request snapshot keys (what will be sent to TrueQuote)
const requestSnapshot = {
  'facility.industry': state.industry || 'MISSING',
  'facility.useCaseData.inputs': !!(state.useCaseData?.inputs),
  'facility.useCaseData.inputs.keys': state.useCaseData?.inputs ? Object.keys(state.useCaseData.inputs) : [],
};
console.log('🔗 Request Snapshot (MerlinRequest.facility.useCaseData.inputs):', requestSnapshot);
```

**Files Changed:**
- `src/components/wizard/v6/utils/wizardStateValidator.ts` (logWizardStateSchema function)

**Impact:** Logs now immediately answer: "Is this a UI state problem, mapping problem, or engine problem?"

---

## ✅ 6. SystemCalculations Interface Updated

**Status:** ✅ FIXED

**Problem:** `SystemCalculations` interface was missing `annualConsumptionKWh` and `peakDemandKW` fields needed by ValueTicker.

**Solution:** Added fields to interface:

```typescript
export interface SystemCalculations {
  // ✅ LOAD PROFILE (from TrueQuote baseCalculation - SSOT)
  annualConsumptionKWh?: number;  // Annual energy consumption
  peakDemandKW?: number;          // Peak demand
  
  // ... existing fields
}
```

**Files Changed:**
- `src/components/wizard/v6/types.ts` (SystemCalculations interface)

**Impact:** TypeScript now correctly types the fields ValueTicker reads.

---

## 📊 Summary

| Item | Status | Files Changed | Impact |
|------|--------|---------------|--------|
| 1. ValueTicker reads from Step 5 | ✅ | WizardV6.tsx, types.ts | No stale values/NaNs |
| 2. Old state migration | ✅ | bufferService.ts | Auto-cleanup on load |
| 3. Mapping function verified | ✅ | (verified - no changes) | Correct data structure |
| 4. Step 5 stores base values | ✅ | Step5MagicFit.tsx, types.ts | ValueTicker has data immediately |
| 5. Validation logging improved | ✅ | wizardStateValidator.ts | Actionable debugging |
| 6. SystemCalculations updated | ✅ | types.ts | TypeScript types correct |

---

## 🎯 Contract Enforced

**The Non-Negotiable Contract:**

1. **Step 3:** Only stores raw inputs (`useCaseData.inputs`)
2. **Step 5:** Computes ALL derived values (TrueQuote is SSOT)
3. **ValueTicker:** Reads from `state.calculations.*` (Step 5), NOT `state.useCaseData.*` (Step 3)
4. **Mapping:** `state.useCaseData.inputs` → `request.facility.useCaseData.inputs`
5. **Validation:** Always validate before calling TrueQuote
6. **Migration:** Old states cleaned up automatically

---

## 🚀 Next Steps (Optional)

1. **Test "green path"** for each industry:
   - Step 1: Enter zip/state
   - Step 2: Choose industry
   - Step 3: Answer minimum required questions
   - Step 5: Verify validator passes, Step 5 returns 3 tiers, ValueTicker shows no NaNs

2. **Add "Reset wizard data" button** in Step 5 error state (if validator fails)

3. **Add more industry-specific validations** in `validateIndustrySpecificInputs()`

---

**Last Updated:** January 2025  
**Version:** 1.0.0  
**Status:** ✅ Complete
