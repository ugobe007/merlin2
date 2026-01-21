## 🎯 STEP 3 → INTELLIGENCE HEADER DATA FLOW FIX

**Date**: January 20, 2026  
**Issue**: User inputs in Step 3 have NO effect on intelligence header numbers  
**Root Cause**: Header reads from `state.calculations.selected` which is null until Step 5  

### Problem Analysis

**Current Data Flow (BROKEN):**
```
User answers Step 3 questions → useCaseData.inputs updated
                                          ↓
Intelligence header reads state.calculations.selected.bessKW → NULL
                                          ↓
Header shows "80-120 kW est." hardcoded fallback ❌
```

**Expected Data Flow (FIXED):**
```
User answers Step 3 questions → useCaseData.inputs updated
                                          ↓
useEffect calculates power from inputs using SSOT functions
                                          ↓
Intelligence header shows REAL calculated values ✅
```

### Solution

Add a `useEffect` that:
1. Watches `state.useCaseData.inputs` for changes
2. When inputs change, calculates power metrics using SSOT (`calculateUseCasePower`)
3. Stores calculated values in a separate state variable (`estimatedMetrics`)
4. Intelligence header reads from `estimatedMetrics` OR `state.calculations` (whichever is available)

### Files Modified

1. **WizardV6.tsx** - Add useEffect to calculate power from Step 3 inputs
2. **Intelligence Header** - Update to show real calculated values

### Implementation

See commit for details.

### Testing

Test all industries to verify:
- ✅ Numbers update immediately when answering Step 3 questions
- ✅ Header shows real facility power (not estimates)
- ✅ Hospital: bedCount → peak demand updates
- ✅ Hotel: roomCount → peak demand updates
- ✅ Car Wash: bayCount → peak demand updates
- ✅ Data Center: rackCount → peak demand updates
- ✅ All industries: operatingHours → annual kWh updates
