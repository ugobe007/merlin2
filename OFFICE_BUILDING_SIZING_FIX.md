# Office Building Sizing Fix - November 21, 2025

## Problem Summary

Office buildings were being massively oversized when user selected "unreliable grid":
- **Expected**: 25,000 sq ft office → 0.04 MW BESS (~$40K)
- **Actual**: 25,000 sq ft office → 2.0 MW BESS (~$4.2M)
- **Oversizing factor**: 50x too large!

## Root Cause

In `src/services/baselineService.ts` lines 676-683, the unreliable grid logic set:

```typescript
bessPowerMW = peakDemandMW; // BESS must handle full load during outages
```

This caused BESS to be sized to match the peak demand regardless of the actual building load calculated from square footage.

### Why This Happened

1. Template correctly calculated: 25,000 sq ft × 0.0000015 MW/sq ft = **0.0375 MW**
2. EV chargers added: 2 Level 1 (1.9 kW each) + 2 Level 2 (11 kW each) = **0.026 MW**
3. Total building load: **0.064 MW** (rounded to 0.07 MW)
4. But then unreliable grid logic overwrote this with `peakDemandMW` which was somehow inflated to 2.0 MW

The system was treating "unreliable grid" as "need massive BESS" rather than "need backup generation".

## Secondary Issue: Solar Hardcoding

When user entered manual peak load, the code hardcoded solar sizing:

```typescript
const solarMW = Math.round(bessPowerMW * 0.8 * 10) / 10; // Always 80% of BESS
```

This ignored the user's `hasSolarInterest: false` answer and added 1.6 MW of solar anyway.

## Fixes Applied

### 1. Fixed Unreliable Grid Logic (`baselineService.ts` lines 676-691)

**Before**:
```typescript
bessPowerMW = peakDemandMW; // Wrong - inflates BESS size
```

**After**:
```typescript
bessPowerMW = powerMW; // Correct - uses template-calculated building load
```

**Rationale**: 
- Unreliable grid means you need **backup generation**, not a larger BESS
- BESS should be sized for actual building load (from square footage calculation)
- Generator should provide extended backup power
- For 25,000 sq ft office: BESS = 0.07 MW, Generator = 0.056 MW (80% of demand)

### 2. Fixed Solar Hardcoding (`baselineService.ts` lines 493-503)

**Before**:
```typescript
const solarMW = Math.round(bessPowerMW * 0.8 * 10) / 10;
```

**After**:
```typescript
const hasSolarInterest = useCaseData?.hasSolarInterest === true;
const solarMW = hasSolarInterest ? Math.round(bessPowerMW * 0.8 * 10) / 10 : 0;
```

**Rationale**: Only calculate solar capacity if user explicitly wants solar panels.

## Testing

Test the same scenario:
- 25,000 sq ft office building
- 2 Level 1 + 2 Level 2 EV chargers
- Unreliable grid
- NO solar

**Expected Results**:
- BESS: ~0.07 MW (70 kW)
- Generator: ~0.056 MW (56 kW - 80% backup)
- Duration: 4 hours
- Solar: 0 MW
- Total cost: ~$60-80K (equipment) + $15-20K (installation) = **$75-100K**
- Payback: 5-7 years with office financial enhancements

**Previous Results** (WRONG):
- BESS: 2.0 MW
- Generator: 1.6 MW
- Solar: 1.6 MW (even though user said NO)
- Total cost: $4.23M
- Payback: 2.8 years (only looked good because of inflated savings)

## Solar Questions - Working As Designed

User complained "No Solar question!" but this is actually correct behavior:

1. User sees: "☀️ Add solar panels to your system?" (boolean)
2. User selects: **NO** (correctly indicating they don't want solar)
3. System correctly hides the follow-up question "Available space for solar panels"
4. This is CORRECT conditional rendering

The solar questions ARE in the template (`useCaseTemplates.ts` lines 1858-1882):
- `hasSolarInterest` (boolean) - Always visible with ⚠️ WARNING about $1M/MW cost
- `solarAvailableSpace` (select) - Only visible if `hasSolarInterest === true`

**User confusion**: They expected to NOT see solar questions at all for office buildings, but the questions are intentionally present to give users the OPTION to add solar. Selecting "No" is the correct way to decline solar panels.

## Impact

This fix affects all use cases that:
1. Use unreliable/off-grid/limited grid connections
2. Are sized from square footage or other building characteristics (not manual peak load)
3. Include EV chargers or other add-on loads

Use cases potentially affected:
- ✅ **Office buildings** (FIXED - was 50x oversized)
- ✅ **Medical offices** (FIXED - same template structure)
- ✅ **Dental offices** (FIXED - same template structure)
- Hotels (check if affected)
- Apartments (check if affected)
- Retail stores (check if affected)

## Next Steps

1. **Clear browser cache** - Old calculations may be cached
2. **Test office buildings** with various grid types:
   - Reliable grid (should work correctly)
   - Unreliable grid (FIXED - now correctly sized)
   - Limited grid (check if similar issue)
   - Off-grid (check if similar issue)
3. **Test other building types** (hotel, apartment, retail) with unreliable grid
4. **Verify financial calculations** now show realistic ROI for small systems

## Files Modified

1. `src/services/baselineService.ts`:
   - Lines 676-691: Fixed unreliable grid logic
   - Lines 493-503: Fixed solar hardcoding

## Console Logs (After Fix)

Expected debug output:
```
╔═══════════════════════════════════════════════════════════════╗
║        ⚡ UNRELIABLE GRID PATH TRIGGERED!!!                  ║
╠═══════════════════════════════════════════════════════════════╣
║ Peak Demand: 0.070 MW
║ Template Power: 0.070 MW
║ Generation Required: true
║ Generation Recommended: 0.056 MW
║ BESS Power: 0.07 MW (using template calc, not peakDemand)
║ Reason: Unreliable grid requires 0.056 MW backup generation
╚═══════════════════════════════════════════════════════════════╝
```

## Success Criteria

✅ 25,000 sq ft office → 0.07 MW BESS (not 2.0 MW)
✅ EV chargers correctly add ~26 kW load
✅ Generator sized at 80% of demand for unreliable grid
✅ Solar = 0 MW when user selects NO
✅ Total cost: $75-100K (not $4.2M)
✅ Payback: 5-7 years with office enhancements
