# Missing 6 Industries - Audit and Implementation Plan

**Date:** January 2, 2026  
**Status:** 🔍 **AUDIT COMPLETE - READY TO IMPLEMENT**

---

## Industries to Add (6):

1. **casino** 
2. **apartment** (apartment building)
3. **cold-storage** (cold storage)
4. **shopping-center** (shopping mall - NOT same as retail)
5. **indoor-farm** (indoor farm)
6. **government** (government buildings)

---

## Current Status:

### Calculation Functions Exist:
- ✅ `calculateCasinoPower(gamingFloorSqFt)` - Uses 18 W/sqft
- ✅ `calculateApartmentPower(unitCount, avgUnitSqFt)` - Uses 1.8 kW/unit
- ✅ `calculateShoppingCenterPower(sqFt)` - Uses 10 W/sqft
- ✅ `calculateIndoorFarmPower(growingAreaSqFt, ledWattagePerSqFt)` - Uses 50 W/sqft base + 30% HVAC
- ❓ `calculateColdStoragePower` - Need to check
- ❓ Government - Need to check

### Database Field Names (from migrations):
- ✅ **casino**: `gamingFloorSize` (sq ft)
- ✅ **apartment**: `unitCount` (number of units)
- ✅ **cold-storage**: `storageVolume` (cubic feet - NOT sq ft!)
- ✅ **shopping-center**: `retailSqFt` (sq ft)
- ❓ **indoor-farm**: Need to check
- ❓ **government**: Need to check

---

## Implementation Plan:

1. Check cold storage calculation function
2. Check government calculation function/field names
3. Check indoor farm field names
4. Add TrueQuote Engine configs for all 6 industries
5. Update Step5MagicFit.tsx to handle field mappings
6. Run tests
