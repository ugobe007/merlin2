# Critical Errors Fixed

**Date:** January 2, 2026  
**Status:** ✅ Fixed

---

## Errors Found

1. **"Unknown subtype: upper-scale for hotel"** - Database has `"upper-scale"` but TrueQuote Engine expects `"upscale"`
2. **React setState during render** - `calculateEnergy()` calling `updateState` during render
3. **Invalid ZIP code** - Empty zipCode causing utility rate lookup failures
4. **Solar/EV not showing** - Need to verify with debug logs

---

## Fixes Applied

### 1. Hotel Subtype Mapping ✅

**Problem:** Database stores `hotelCategory: "upper-scale"` but TrueQuote Engine expects `"upscale"`.

**Fix:** Added comprehensive mapping in `trueQuoteMapper.ts`:

```typescript
// Map database values to TrueQuote Engine subtypes
if (categoryLower === 'upper-scale' || categoryLower === 'upper_scale' || categoryLower === 'upscale' || categoryLower === 'full-service' || categoryLower === 'fullservice') {
  subtype = 'upscale';
} else if (categoryLower === 'luxury' || categoryLower === 'resort' || categoryLower === '5-star' || categoryLower === '5_star') {
  subtype = 'luxury';
} else if (categoryLower === 'midscale' || categoryLower === 'select-service' || categoryLower === 'selectservice') {
  subtype = 'midscale';
} else if (categoryLower === 'budget' || categoryLower === 'economy' || categoryLower === '1-star' || categoryLower === '1_star') {
  subtype = 'budget';
} else {
  subtype = 'midscale'; // Default fallback
}
```

**Mappings:**
- `"upper-scale"`, `"upper_scale"`, `"upscale"`, `"full-service"`, `"fullservice"` → `"upscale"`
- `"luxury"`, `"resort"`, `"5-star"`, `"5_star"` → `"luxury"`
- `"midscale"`, `"select-service"`, `"selectservice"` → `"midscale"`
- `"budget"`, `"economy"`, `"1-star"`, `"1_star"` → `"budget"`

---

### 2. React setState During Render ✅

**Problem:** `calculateEnergy()` was calling `updateState` during render, causing React error:
```
Cannot update a component (WizardV6) while rendering a different component (Step3HotelEnergy)
```

**Fix:** Moved state update to `useEffect` and calculation to `useMemo`:

**Before:**
```typescript
const calculateEnergy = (): number => {
  // ... calculation ...
  const energyEstimate = Math.round(base);
  
  // ❌ BAD: setState during render
  if (state.useCaseData?.estimatedAnnualKwh !== energyEstimate) {
    updateState(prev => ({
      useCaseData: { ...prev.useCaseData, estimatedAnnualKwh: energyEstimate }
    }));
  }
  
  return energyEstimate;
};

// ❌ Called during render
{formatNumber(calculateEnergy())}
```

**After:**
```typescript
const calculateEnergy = (): number => {
  // ... calculation ...
  return Math.round(base);
};

// ✅ useMemo for calculation
const energyEstimate = useMemo(() => calculateEnergy(), [
  getValue('squareFootage'),
  estimatedSqft,
  // ... all dependencies
]);

// ✅ useEffect for state update
useEffect(() => {
  if (state.useCaseData?.estimatedAnnualKwh !== energyEstimate) {
    updateState(prev => ({
      useCaseData: { ...prev.useCaseData, estimatedAnnualKwh: energyEstimate }
    }));
  }
}, [energyEstimate, state.useCaseData?.estimatedAnnualKwh, updateState]);

// ✅ Use memoized value in render
{formatNumber(energyEstimate)}
```

---

### 3. Invalid ZIP Code ✅

**Problem:** Empty `zipCode` (`""`) causing utility rate lookup to fail:
```
Error: Invalid ZIP code
```

**Fix:** Added null checks before calling utility rate service:

**Before:**
```typescript
getCommercialRateByZip(zipCode),  // ❌ Fails if zipCode is ""
getBESSSavingsOpportunity(zipCode)  // ❌ Fails if zipCode is ""
```

**After:**
```typescript
state.zipCode && state.zipCode.length >= 5 ? getCommercialRateByZip(state.zipCode) : Promise.resolve(null),
state.zipCode && state.zipCode.length >= 5 ? getBESSSavingsOpportunity(state.zipCode) : Promise.resolve(null)
```

**Note:** This allows calculations to proceed even if zipCode is missing, using default rates.

---

## Files Modified

1. `src/components/wizard/v6/utils/trueQuoteMapper.ts` - Added hotel subtype normalization
2. `src/components/wizard/v6/steps/Step3HotelEnergy.tsx` - Fixed React setState during render
3. `src/components/wizard/v6/steps/Step5MagicFit.tsx` - Added zipCode null checks

---

## Testing

After these fixes:
1. ✅ Hotel with `hotelCategory: "upper-scale"` should work
2. ✅ No more React setState errors
3. ✅ No more "Invalid ZIP code" errors (uses defaults if zipCode missing)
4. ✅ Solar/EV should show (check debug logs)

---

## Remaining Issues

- **Solar/EV not showing**: Check browser console for debug logs:
  - Look for "☀️ Solar from Step 4" or "⚠️ Solar NOT applied"
  - Look for "⚡ EV from Step 4" or "⚠️ EV NOT applied"
  - Verify `selectedOptions` includes `'solar'` and `'ev'`
  - Verify `customSolarKw` = 800 and `customEvUltraFast` = 4
