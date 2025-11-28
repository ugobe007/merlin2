# Power Calculation & Display Fixes

**Date:** November 12, 2025  
**Status:** ✅ Deployed  
**Build Time:** 3.46s  
**Deploy Time:** 28.0s

## Issues Fixed

### 1. ✅ Rounding Precision Issue (150 rooms = 0.4MW → 0.44MW)

**Problem:**
- 150-room hotel should be 440kW (2.93 kW/room × 150 rooms)
- System was rounding to nearest 0.1MW
- Result: 440kW → 0.4MW (wrong!) instead of 0.44MW

**Root Cause:**
```typescript
// OLD (baselineService.ts line 130)
const powerMW = Math.max(0.2, Math.round(basePowerMW * 10) / 10);
// 0.44 × 10 = 4.4 → round(4.4) = 4 → 4/10 = 0.4 ❌
```

**Solution:**
```typescript
// NEW - Round to 0.01MW precision (10kW)
const powerMW = Math.max(0.2, Math.round(basePowerMW * 100) / 100);
// 0.44 × 100 = 44 → round(44) = 44 → 44/100 = 0.44 ✅
```

**Impact:**
- 150-room hotel now correctly shows **0.44MW** instead of 0.4MW
- Better precision for all facility sizes
- Added logging: `📊 [Power Calculation] Raw: X.XXX MW → Rounded: X.XX MW`

### 2. ✅ Dashboard Header Shows Total Power (not just battery)

**Problem:**
- Header showed "System Size: 0.4MW" (battery only)
- User adds 0.1MW solar
- Header still shows "0.4MW" (confusing! where's the solar?)
- Expected: 0.4MW battery + 0.1MW solar = **0.5MW total**

**Root Cause:**
```typescript
// OLD (InteractiveConfigDashboard.tsx line 687)
<div className="text-lg font-bold text-purple-800">{storageSizeMW}MW</div>
<div className="text-xs text-purple-600">{durationHours}hr duration</div>
```

**Solution:**
```typescript
// NEW - Show TOTAL power with breakdown
<div className="text-xs text-gray-600 mb-1">Total Power</div>
<div className="text-lg font-bold text-purple-800">
  {(storageSizeMW + solarMW + windMW + generatorMW).toFixed(2)}MW
</div>
<div className="text-xs text-purple-600">
  Battery: {storageSizeMW}MW • {durationHours}hr
</div>
```

**Impact:**
- Header now shows **total system power** (all sources combined)
- Battery capacity shown separately below
- User can see solar/wind/generator contributing to total
- Example: 0.44MW battery + 0.1MW solar = **0.54MW** total ✅

## Files Modified

### `/src/services/baselineService.ts`
- **Line 130:** Changed rounding from `* 10 / 10` to `* 100 / 100`
- **Line 133:** Added logging for power calculation visibility

### `/src/components/wizard/InteractiveConfigDashboard.tsx`
- **Lines 686-692:** Changed "System Size" to "Total Power"
- **Line 688:** Calculate total: `(storageSizeMW + solarMW + windMW + generatorMW)`
- **Line 691:** Show battery breakdown separately

## Testing Scenarios

### Scenario 1: 150-Room Hotel (No Renewables)
- **Input:** 150 rooms
- **Expected:** 0.44MW battery
- **Dashboard Shows:** "Total Power: 0.44MW" ✅
- **Breakdown:** "Battery: 0.44MW • 4hr" ✅

### Scenario 2: 150-Room Hotel + 0.1MW Solar
- **Input:** 150 rooms + 0.1MW solar
- **Expected:** 0.44MW battery + 0.1MW solar = 0.54MW total
- **Dashboard Shows:** "Total Power: 0.54MW" ✅
- **Breakdown:** "Battery: 0.44MW • 4hr" ✅
- **Equipment Card:** Shows solar configuration ✅

### Scenario 3: Multiple Power Sources
- **Input:** 0.4MW battery + 0.1MW solar + 0.05MW wind
- **Expected:** 0.55MW total
- **Dashboard Shows:** "Total Power: 0.55MW" ✅
- **All sources visible** in equipment summary card

## User Impact

**Before:**
- ❌ 150 rooms showed 0.4MW (should be 0.44MW)
- ❌ Adding solar didn't change total power display
- ❌ Confusion: "Where did my solar go?"
- ❌ No visibility into power composition

**After:**
- ✅ 150 rooms shows correct 0.44MW
- ✅ Adding 0.1MW solar increases total to 0.54MW
- ✅ Clear breakdown: total power + battery details
- ✅ Equipment summary shows all power sources

## Deployment

- **Build:** ✅ 3.46s (no errors)
- **Deploy:** ✅ 28.0s to Fly.io
- **Image:** `registry.fly.io/merlin2:deployment-01K9WQED1E0GN8WN1BC08BGK0P`
- **Live:** https://merlin2.fly.dev/

## Console Logging Added

```
📊 [Power Calculation] Raw: 0.440 MW → Rounded: 0.44 MW
```

This helps debugging future power calculation issues.

## Next Steps

1. ✅ Scrolling issue reverted (need proper fix later)
2. ✅ Power precision fixed (0.01MW instead of 0.1MW)
3. ✅ Dashboard header shows total power
4. ⏳ Address scrolling properly (separate ticket)
5. ⏳ Verify all power sources sum correctly in quote

## Notes

- Scrolling fix was reverted because `overflow-y-auto` on main container broke the entire layout
- Original issue remains: user cannot scroll to see sliders at bottom of dashboard
- Need to investigate proper scrolling solution without breaking flex layout
- Current workaround: left panel scrolls independently with `overflow-y-auto`
