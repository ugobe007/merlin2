# 6 Missing Industries - Implementation Plan

**Date:** January 2, 2026  
**Status:** ✅ **READY TO IMPLEMENT**

---

## Summary:

From user's list: **18 industries total**
- ✅ **12 already have TrueQuote Engine configs**
- ❌ **6 missing**: casino, apartment, cold-storage, shopping-center, indoor-farm, government

---

## Industry Details:

### 1. **Casino**
- **Function**: `calculateCasinoPower(gamingFloorSqFt)` - 18 W/sqft
- **Database field**: `gamingFloorSize` (sq ft)
- **Method**: `per_sqft`
- **Subtypes**: None (single type)
- **Duration**: 4 hours
- **BESS Multiplier**: 0.50 (24/7 operation, critical backup)

### 2. **Apartment Building**
- **Function**: `calculateApartmentPower(unitCount, avgUnitSqFt)` - 1.8 kW/unit
- **Database field**: `unitCount` (number of units)
- **Method**: `per_unit` (unitName: 'units')
- **Subtypes**: None (single type)
- **Duration**: 4 hours
- **BESS Multiplier**: 0.35 (lower priority, shorter backup)

### 3. **Cold Storage**
- **Function**: `calculateWarehousePower(sqFt, isColdStorage=true)` - 8 W/sqft
- **Database field**: `storageVolume` (cubic feet) → Convert to sqft (divide by 30)
- **Method**: `per_sqft` (but need to handle cubic feet conversion)
- **Subtypes**: None (single type)
- **Duration**: 8 hours (longer backup for refrigeration)
- **BESS Multiplier**: 0.60 (critical for product preservation)

### 4. **Shopping Center/Mall**
- **Function**: `calculateShoppingCenterPower(sqFt)` - 10 W/sqft
- **Database field**: `retailSqFt` (sq ft)
- **Method**: `per_sqft`
- **Subtypes**: None (single type)
- **Duration**: 4 hours
- **BESS Multiplier**: 0.45 (moderate priority)

### 5. **Indoor Farm**
- **Function**: `calculateIndoorFarmPower(growingAreaSqFt, ledWattagePerSqFt)` - 50 W/sqft + 30% HVAC = 65 W/sqft
- **Database field**: `growingAreaSqFt` (need to verify)
- **Method**: `per_sqft`
- **Subtypes**: None (single type)
- **Duration**: 6 hours (longer for plant growth cycles)
- **BESS Multiplier**: 0.55 (high priority, grow lights critical)

### 6. **Government Building**
- **Function**: Likely similar to office (6 W/sqft)
- **Database field**: `buildingSqFt` (sq ft)
- **Method**: `per_sqft`
- **Subtypes**: None (single type) - or maybe by facility type (courthouse, office, etc.)
- **Duration**: 8 hours (critical infrastructure backup)
- **BESS Multiplier**: 0.60 (critical facilities)

---

## Implementation Steps:

1. Add TrueQuote Engine configs for all 6 industries
2. Handle special cases:
   - Cold storage: Convert `storageVolume` (cu ft) → sqft
   - Apartment: Use `per_unit` method with 'units'
   - Indoor farm: Check database field name
3. Update `mapWizardStateToTrueQuoteInput` in Step5MagicFit.tsx
4. Run tests
5. Update documentation

---

## Next: Start Implementation
