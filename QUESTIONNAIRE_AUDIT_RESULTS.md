# Questionnaire Data Flow Audit Results

## Executive Summary

**Date:** January 20, 2026
**Status:** ✅ SIGNIFICANTLY IMPROVED

The audit found and fixed significant mismatches between database `custom_questions` field names and the power calculation code in `WizardV6.tsx`.

### Key Metrics - AFTER FIX

| Metric | Before | After |
|--------|--------|-------|
| Total Active Industries | 23 | 23 |
| Industries WITH code handlers | 16 | **23** ✅ |
| Industries WITHOUT handlers | 7 | **0** ✅ |
| Average Match Rate | ~5% | **~15%** |
| Restaurant Match Rate | 31% | **54%** |

### Top Performers (After Fix)

| Industry | Match Rate | Matched Fields |
|----------|------------|----------------|
| **Restaurant** | 54% | squareFootage, restaurantType, seatCount, hasWalkInFreezer, hasKitchenHood, kitchenEquipment, refrigerationCount |
| **Truck Stop** | 27% | mcsChargers, level2, serviceBays, truckWashBays, peakDemandKW, gridCapacityKW |
| **EV Charging** | 19% | level2Count, dcfc50Count, dcfcHighCount, dcFastCount, ultraFastCount, megawattCount |
| **Casino** | 17% | gamingFloorSqFt, totalSqFt, hotelRooms, slotMachines, gamingFloorSize |
| **Cold Storage** | 16% | totalSqFt, storageCapacity, refrigeratedSqFt, palletCapacity, squareFootage |

### NEW Industries Now Supported

These 7 industries previously had NO power calculation handler:

1. ✅ **agricultural** - Uses: totalAcres, irrigationType, majorEquipment
2. ✅ **cold-storage** - Uses: refrigeratedSqFt, totalSqFt, storageCapacity
3. ✅ **gas-station** - Uses: dispenserCount, storeSqFt, stationType
4. ✅ **government** - Uses: totalSqFt, buildingCount, facilitySqFt
5. ✅ **heavy_duty_truck_stop** - Uses: mcsChargers, truckWashBays, peakDemandKW
6. ✅ **indoor-farm** - Uses: growingAreaSqFt, growingLevels, lightingLoadPercent
7. ✅ **microgrid** - Uses: sitePeakLoad, criticalLoadPercent, existingCapacity

### Field Name Mismatches (Code vs Database)

The following field names are expected in code but **don't exist in the database**:

| Industry | Code Expects | DB Has Instead |
|----------|--------------|----------------|
| apartment | `unitCount` | `totalUnits` |
| car-wash | `washType` | `facilityType` |
| data-center | `totalITLoad` | `itLoadKW` |
| data-center | `pue` | `currentPUE` |
| ev-charging | `level2Chargers` | `level2Count` |
| ev-charging | `dcfcChargers` | `dcfc50Count`, `dcfcHighCount` |
| hospital | `numberOfBeds` | `bedCount` |
| hotel | `hotelClass` | `hotelCategory` |
| restaurant | `primaryCookingEquipment` | `kitchenEquipment` |
| office | `squareFootage` | `officeSqFt`, `totalSqFt` |
| warehouse | `hasColdStorage` | (missing) |

### Restaurant-Specific Issues

The restaurant use case has the most complete matching (31% match rate), but still has issues:

**DB has:** `squareFootage`, `seatCount`, `hasWalkInFreezer`, `hasKitchenHood`
**Code expects but missing:** `primaryCookingEquipment` (DB uses `kitchenEquipment`)

## Recommended Actions

### Priority 1: Fix Field Name Mappings (Quick Win)

Update `WizardV6.tsx` to check for **both** the expected field name AND the actual DB field name:

```typescript
// Example: apartment units
const units = Number(
  inputs.unitCount ||       // Original code expectation
  inputs.totalUnits ||      // Actual DB field name
  inputs.numberOfUnits ||   // Fallback
  100                       // Default
);
```

### Priority 2: Add Missing Industry Handlers

Add power calculation handlers for:
- agricultural (use `totalAcres`, `irrigationType`)
- cold-storage (use `refrigeratedSqFt`, `storageCapacity`)
- gas-station (use `dispenserCount`, `storeSqFt`)
- government (use `totalSqFt`, `buildingCount`)
- heavy_duty_truck_stop (use `mcsChargers`, `truckWashBays`)
- indoor-farm (use `growingAreaSqFt`, `lightingLoadPercent`)
- microgrid (use `sitePeakLoad`, `criticalLoadPercent`)

### Priority 3: Restaurant Kitchen Equipment

The restaurant calculation needs to read `kitchenEquipment` instead of `primaryCookingEquipment`.

## Run the Audit

```bash
node scripts/audit-questionnaire-data-flow.mjs
```

## Related Files

- `src/components/wizard/v6/WizardV6.tsx` - Power calculation handlers (lines 266-445)
- `src/services/useCaseService.ts` - Database query for custom_questions
- `database/migrations/20260115_fix_step3_issues.sql` - Restaurant questions migration
