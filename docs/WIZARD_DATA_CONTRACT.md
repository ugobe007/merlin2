# 🔒 Wizard Data Contract

**Non-Negotiable Contract Between UI and Engine**

This document defines the exact data contract between the Wizard UI and the TrueQuote engine. Violations of this contract will cause bugs.

---

## 📋 **Data Flow Contract**

### **WizardState → MerlinRequest → TrueQuote**

```
WizardState (UI State)
  ↓ mapWizardStateToMerlinRequest()
MerlinRequest (Engine Request)
  ↓ processQuote()
TrueQuoteAuthenticatedResult (Engine Result)
```

---

## 🔑 **Required Fields (Non-Negotiable)**

### **Step 1: Location & Goals**
- ✅ `zipCode` (string, 5 digits)
- ✅ `state` (string, 2-letter code)
- ✅ `goals` (array, minimum 2 items)

### **Step 2: Industry**
- ✅ `industry` (string, e.g., "car_wash", "hotel")
- ⚠️ `industryName` (string, recommended but optional)

### **Step 3: Use Case Data (CRITICAL)**
- ✅ `useCaseData.inputs` (object, raw question answers)
  - **This is what TrueQuote reads**
  - Must contain industry-specific fields (e.g., `facilityType`, `bayCount` for car wash)
  - Must not be empty object

### **Step 4: Preferences (Optional)**
- `selectedOptions` (array, e.g., ["solar", "generator"])
- `customSolarKw` (number, optional)
- `customGeneratorKw` (number, optional)

---

## ⚠️ **Derived Values Rule (CRITICAL)**

**Option A (RECOMMENDED): TrueQuote is SSOT**

- ✅ Step 3 stores ONLY raw inputs (`useCaseData.inputs`)
- ✅ Step 5 calls TrueQuote engine FIRST
- ✅ TrueQuote computes ALL derived values:
  - `estimatedAnnualKwh`
  - `peakDemandKw`
  - `load.peakDemandKW`
  - `load.annualConsumptionKWh`
  - `financials.*`
- ✅ ValueTicker reads from `state.calculations.*` (filled by Step 5)

**Why?**
- Prevents "two competing calculation sources"
- Makes TrueQuote the single source of truth
- Easier to debug (one calculation path)
- Consistent results

**Option B (DEPRECATED): UI Computes Derived Values**

- ❌ Step 3 computes `estimatedAnnualKwh` and `peakDemandKw`
- ❌ TrueQuote might recalculate or use different formulas
- ❌ Results can differ between Step 3 and Step 5
- ❌ Makes debugging harder

---

## 🔍 **Validation Checkpoints**

### **Before Step 5 (MagicFit/TrueQuote)**

Use `validateWizardStateForTrueQuote()`:

```typescript
import { validateWizardStateForTrueQuote, assertWizardStateForTrueQuote } from '../utils/wizardStateValidator';

// Validate before calling TrueQuote
const validation = validateWizardStateForTrueQuote(state);
if (!validation.valid) {
  // Show error, don't proceed to Step 5
  console.error('Validation failed:', validation.errors);
  return;
}

// Or use assert (throws in development)
assertWizardStateForTrueQuote(state);
```

**Required Checks:**
1. ✅ `zipCode` exists and is 5 digits
2. ✅ `state` exists
3. ✅ `industry` exists
4. ✅ `useCaseData.inputs` exists and is non-empty
5. ✅ Industry-specific required fields present

---

## 📊 **Mapping Function Contract**

### **WizardState → MerlinRequest**

```typescript
// In trueQuoteMapper.ts
export function mapWizardStateToMerlinRequest(state: WizardState): MerlinRequest {
  return {
    location: {
      zipCode: state.zipCode,      // ✅ Must exist
      state: state.state,           // ✅ Must exist
      city: state.city,
      country: state.country || 'US',
    },
    facility: {
      industry: state.industry,     // ✅ Must exist
      industryName: state.industryName || state.industry,
      useCaseData: state.useCaseData || {},  // ✅ Must have inputs
    },
    preferences: {
      solar: { interested: state.selectedOptions?.includes('solar') || false },
      generator: { interested: state.selectedOptions?.includes('generator') || false },
      ev: { interested: state.selectedOptions?.includes('ev') || false },
    },
  };
}
```

**Critical Path:**
- `state.useCaseData.inputs` → `request.facility.useCaseData.inputs`
- TrueQuote reads from `request.facility.useCaseData.inputs`

---

## 🐛 **Common Bugs & Fixes**

### **Bug #1: "Step 5 shows blanks/NaNs"**

**Cause:** `useCaseData.inputs` missing or wrong path

**Check:**
```typescript
// Before Step 5
console.log('useCaseData:', state.useCaseData);
console.log('useCaseData.inputs:', state.useCaseData?.inputs);
console.log('Input keys:', Object.keys(state.useCaseData?.inputs || {}));
```

**Fix:** Ensure Step 3 writes to `state.useCaseData.inputs = answers`

---

### **Bug #2: "Numbers change between Step 3 and Step 5"**

**Cause:** Two competing calculation sources

**Check:**
```typescript
// Step 3
if (state.useCaseData.estimatedAnnualKwh) {
  console.warn('❌ Step 3 computed derived value - violates SSOT!');
}

// Step 5
if (state.useCaseData.estimatedAnnualKwh && result.baseCalculation.load.annualConsumptionKWh !== state.useCaseData.estimatedAnnualKwh) {
  console.warn('❌ Values differ - two calculation sources!');
}
```

**Fix:** Remove derived calculations from Step 3, let TrueQuote compute everything

---

### **Bug #3: "Step 5 works sometimes"**

**Cause:** Race condition - `generateQuote()` called with stale state

**Check:**
```typescript
// Step 5 - BEFORE calling generateQuote
console.log('State before generateQuote:', state);
console.log('useCaseData.inputs exists?', !!state.useCaseData?.inputs);

// Use functional update to ensure latest state
const result = await generateQuote(state);
```

**Fix:** 
- Ensure state is fully updated before Step 5
- Use validation to confirm required fields exist
- Don't call `generateQuote()` immediately after `setState()`

---

### **Bug #4: "ValueTicker inconsistent"**

**Cause:** Reading from two different branches

**Check:**
```typescript
// ❌ BAD: Reading from Step 3 computed values
const annualUsage = state.useCaseData?.estimatedAnnualKwh || 0;

// ✅ GOOD: Reading from Step 5 calculations
const annualUsage = state.calculations?.annualConsumptionKWh || 
                    state.quoteResult?.baseCalculation.load.annualConsumptionKWh || 0;
```

**Fix:** ValueTicker should read from `state.calculations.*` (filled by Step 5), not `state.useCaseData.*` (Step 3)

---

## ✅ **Quick Fix Checklist**

If wizard is unstable, do this:

1. ✅ **Remove derived calculations from Step 3**
   - Stop computing `estimatedAnnualKwh`, `peakDemandKw` in Step 3
   - Only store raw inputs: `state.useCaseData.inputs = answers`

2. ✅ **Add validation before Step 5**
   - Use `assertWizardStateForTrueQuote(state)` before calling `generateQuote()`
   - This catches missing fields early

3. ✅ **Make Step 5 the first real calculation**
   - TrueQuote computes ALL derived values
   - Store results in `state.calculations` or `state.quoteResult`

4. ✅ **Update ValueTicker to read from Step 5 results**
   - Read from `state.calculations.*`
   - NOT from `state.useCaseData.*` (except raw inputs)

5. ✅ **Log state schema for debugging**
   - Use `logWizardStateSchema(state)` before Step 5
   - This shows exactly what data exists

---

## 🎯 **Single Event Pipeline Pattern**

**Conceptual Flow:**

```
Step 3: User answers questions
  ↓
Step3Integration: onAnswersChange(answers)
  ↓
WizardV6: updateState({ useCaseData: { inputs: answers } })
  ↓
Step 4: User selects preferences
  ↓
WizardV6: updateState({ selectedOptions: [...] })
  ↓
Step 5: User clicks "Continue"
  ↓
WizardV6: validateWizardStateForTrueQuote(state)
  ↓
WizardV6: generateQuote(state)
  ↓
TrueQuote: processQuote(request)
  ↓
TrueQuote: Returns TrueQuoteAuthenticatedResult
  ↓
WizardV6: updateState({ calculations: result, quoteResult: result })
  ↓
ValueTicker: Reads from state.calculations.*
```

**Key Rule:** Each step emits ONE event, WizardV6 updates state ONCE, TrueQuote computes EVERYTHING in Step 5.

---

## 📝 **Schema Validation**

**Runtime Schema Assert (Before TrueQuote):**

```typescript
// In Step5MagicFit.tsx, before generateQuote()
assertWizardStateForTrueQuote(state);

// This checks:
// ✅ request.facility.useCaseData.inputs exists
// ✅ Expected keys exist for that industry
// ✅ zipCode, state, industry present
```

**If assert fails:** You've found your bug in 2 minutes.

---

## 🔗 **Related Documents**

- `TRUEQUOTE_ARCHITECTURE_DIAGRAM.md` - Complete data flow diagram
- `wizardStateValidator.ts` - Validation functions
- `trueQuoteMapper.ts` - Mapping function

---

**Last Updated:** January 2025  
**Version:** 1.0.0  
**Status:** ✅ Active Contract
