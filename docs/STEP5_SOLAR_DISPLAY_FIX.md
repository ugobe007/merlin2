# Step 5 Solar Display Fix

**Date:** January 2, 2026  
**Status:** ✅ Fixed

---

## Issue

User reported:
- Added solar in Step 4 for a 400+ room hotel
- Solar showing as "-" (dash) in Step 5 cards
- No backup storage currently, so BESS should be recommended (which it is)

---

## Root Cause

The `useEffect` in Step5MagicFit.tsx that loads calculations was missing `state.customSolarKw` and custom EV fields in its dependency array. This meant:

1. When user selects solar in Step 4, `state.customSolarKw` gets updated
2. Step 5 calculations don't reload because `customSolarKw` isn't in dependencies
3. Solar shows as "-" because `calc.solarKW` remains 0

---

## Fix

Added missing dependencies to the `useEffect` hook:

**Before:**
```typescript
}, [state.zipCode, state.industry, state.useCaseData, state.selectedOptions, state.solarTier, state.evTier]);
```

**After:**
```typescript
}, [state.zipCode, state.industry, state.useCaseData, state.selectedOptions, state.solarTier, state.evTier, state.customSolarKw, state.customEvL2, state.customEvDcfc, state.customEvUltraFast]);
```

---

## Solar Logic (Already Correct)

The solar calculation logic in Step5MagicFit.tsx is correct:

1. **PRIORITY 1:** Use `state.customSolarKw` if `selectedOptions` includes 'solar' and `customSolarKw > 0`
2. **PRIORITY 2:** Use `solarTier` if set (legacy path)
3. **PRIORITY 3:** Use TrueQuote Engine result

The issue was just that calculations weren't reloading when `customSolarKw` changed.

---

## BESS Recommendation

**No change needed** - BESS is always included in all configurations (per user requirement). The system doesn't need to "recommend" BESS because it's always part of the solution.

---

## Testing

To verify:
1. Go to Step 4
2. Select "Add Solar Array" → YES
3. Choose recommended or custom size
4. Go to Step 5
5. Solar should now show the kW value (not "-")

---

## Files Modified

- `src/components/wizard/v6/steps/Step5MagicFit.tsx`
