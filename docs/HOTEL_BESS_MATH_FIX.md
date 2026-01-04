# Hotel BESS Math Fix - Subtype-Aware Power Calculation

**Date:** January 2, 2026  
**Status:** ✅ Fixed

---

## Issue

User reported:
- 400-room hotel with full amenities
- BESS power too small (showing ~600 kW)
- Should be ~1,100 kW for upscale hotel

---

## Root Cause

The `HOTEL_CONFIG` in `TrueQuoteEngine.ts` used a flat **3 kW/room** for all hotel subtypes:
- Budget: 3 kW/room
- Midscale: 3 kW/room  
- Upscale: 3 kW/room ❌ (should be 5.5 kW/room)
- Luxury: 3 kW/room ❌ (should be 7.0 kW/room)

This resulted in:
- 400 rooms × 3 kW = 1,200 kW peak
- BESS = 1,200 × 0.50 = 600 kW (too small!)

---

## Fix

Made `calculatePeakDemand` subtype-aware for hotels:

**Before:**
```typescript
basePowerKW = (unitCount * powerCalc.wattsPerUnit) / 1000; // Always 3 kW/room
```

**After:**
```typescript
// Special handling for hotels: wattsPerUnit varies by subtype
let effectiveWattsPerUnit = powerCalc.wattsPerUnit;
if (config.slug === 'hotel' && facilityData.hotelCategory) {
  const category = facilityData.hotelCategory.toLowerCase();
  if (category === 'upscale' || category === 'full-service') {
    effectiveWattsPerUnit = 5500; // 5.5 kW/room
  } else if (category === 'luxury' || category === 'resort' || category === '5-star') {
    effectiveWattsPerUnit = 7000; // 7 kW/room
  } else if (category === 'midscale' || category === 'select-service') {
    effectiveWattsPerUnit = 4000; // 4 kW/room
  } else {
    effectiveWattsPerUnit = 3000; // 3 kW/room (budget/economy)
  }
}
basePowerKW = (unitCount * effectiveWattsPerUnit) / 1000;
```

---

## New Calculations

### 400-Room Upscale Hotel (Full Amenities)
- **Peak Demand:** 400 × 5.5 kW = **2,200 kW**
- **BESS (50% multiplier):** 2,200 × 0.50 = **1,100 kW** ✅
- **BESS Energy (4 hours):** 1,100 × 4 = **4,400 kWh**

### 400-Room Luxury/Resort Hotel
- **Peak Demand:** 400 × 7.0 kW = **2,800 kW**
- **BESS (50% multiplier):** 2,800 × 0.50 = **1,400 kW**
- **BESS Energy (4 hours):** 1,400 × 4 = **5,600 kWh**

### 400-Room Midscale Hotel
- **Peak Demand:** 400 × 4.0 kW = **1,600 kW**
- **BESS (40% multiplier):** 1,600 × 0.40 = **640 kW**
- **BESS Energy (4 hours):** 640 × 4 = **2,560 kWh**

---

## Hotel Category Mapping

The fix recognizes these hotel category values:
- **Upscale:** `'upscale'`, `'full-service'`, `'fullservice'` → 5.5 kW/room
- **Luxury:** `'luxury'`, `'resort'`, `'5-star'` → 7.0 kW/room
- **Midscale:** `'midscale'`, `'select-service'`, `'selectservice'` → 4.0 kW/room
- **Budget:** Everything else → 3.0 kW/room

---

## Sources

- **Upscale (5.5 kW/room):** Saudi Arabia Market Entry Strategy report, ASHRAE 90.1
- **Luxury (7.0 kW/room):** Resort hotel benchmarks, high-end hospitality standards
- **Midscale (4.0 kW/room):** CBECS 2018, Marriott energy benchmarks
- **Budget (3.0 kW/room):** Economy hotel standards, minimal amenities

---

## Files Modified

- `src/services/TrueQuoteEngine.ts` - Added subtype-aware wattsPerUnit logic

---

## Testing

To verify:
1. Select hotel industry
2. Enter 400 rooms
3. Select "Upscale" or "Full-Service" category
4. Go to Step 5
5. BESS should show ~1,100 kW (not 600 kW)

---

## Additional Debug Logging

Also added detailed logging for solar/EV to help diagnose why they might not be showing:
- Logs `selectedOptions`, `customSolarKw`, `customEvUltraFast`
- Logs whether conditions are met
- Helps identify data flow issues
