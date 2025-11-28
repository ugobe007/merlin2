# Use Case Slug Audit - Nov 28, 2025

## Summary

✅ **ALL DATABASE SLUGS NOW HAVE HANDLERS**

Audited the complete data flow from database → wizard → calculation service.

## Audit Process

1. **Extracted all database slugs** from `add_all_custom_questions_fast.sql`
2. **Compared with switch cases** in `calculateUseCasePower()` 
3. **Identified 4 missing handlers** that were falling to default case
4. **Added dedicated handlers** for all missing slugs

## Database Slugs (18 unique)

| Slug | Status | Handler |
|------|--------|---------|
| apartment-building | ✅ FIXED | `calculateApartmentPower()` |
| car-wash | ✅ | `calculateCarWashPower()` |
| distribution-center | ✅ FIXED | `calculateWarehousePower()` |
| edge-data-center | ✅ FIXED | `calculateDatacenterPower()` |
| ev-charging | ✅ | `calculateEVChargingPower()` |
| gas-station | ✅ | `calculateGasStationPower()` |
| hospital | ✅ | `calculateHospitalPower()` |
| hotel | ✅ | `calculateHotelPower()` |
| hotel-hospitality | ✅ | `calculateHotelPower()` |
| indoor-farm | ✅ | `calculateIndoorFarmPower()` |
| manufacturing | ✅ | `calculateManufacturingPower()` |
| microgrid | ✅ | Custom inline (EV + fallback) |
| office | ✅ | `calculateOfficePower()` |
| public-building | ✅ | `calculateGovernmentPower()` |
| residential | ✅ FIXED | Custom inline (residential benchmark) |
| retail | ✅ | `calculateRetailPower()` |
| shopping-center | ✅ | `calculateShoppingCenterPower()` |
| university | ✅ | `calculateCollegePower()` |

## Previously Handled (before this audit)

These slugs were already handled:

- **Airport**: `case 'airport'` → `calculateAirportPower()`
- **Datacenter**: `case 'datacenter'`, `case 'data-center'` → `calculateDatacenterPower()`
- **Hotel**: `case 'hotel'`, `case 'hotel-hospitality'` → `calculateHotelPower()`
- **Office**: `case 'office'`, `case 'office-building'` → `calculateOfficePower()`
- **EV Charging**: `case 'ev-charging'`, `case 'ev-charging-station'` → `calculateEVChargingPower()`

## Fixes Applied (Nov 28, 2025)

### 1. `edge-data-center` (NEW)
```typescript
case 'edge-data-center':
  // Alias for datacenter (same calculation)
  return calculateDatacenterPower(
    parseInt(useCaseData.itLoadKW) || undefined,
    parseInt(useCaseData.rackCount) || undefined,
    parseFloat(useCaseData.rackDensityKW) || 8
  );
```

### 2. `distribution-center` (NEW)
```typescript
case 'distribution-center':
  // Alias for warehouse/logistics (same calculation)
  return calculateWarehousePower(
    parseInt(useCaseData.warehouseSqFt || useCaseData.sqFt) || 250000,
    useCaseData.isColdStorage === true || useCaseData.warehouseType === 'cold-storage'
  );
```

### 3. `apartment-building` (NEW)
```typescript
case 'apartment-building':
  // Alias for apartment/apartments
  return calculateApartmentPower(
    parseInt(useCaseData.unitCount || useCaseData.units) || 100,
    parseInt(useCaseData.commonAreaSqFt || useCaseData.sqFt) || 10000
  );
```

### 4. `residential` (NEW)
```typescript
case 'residential':
  // Residential is different from commercial - use residential benchmark
  // Average US home: ~1.2 kW average, 5-10 kW peak
  const homeSqFt = parseInt(useCaseData.sqFt || useCaseData.homeSize) || 2000;
  const homes = parseInt(useCaseData.homeCount || useCaseData.units) || 1;
  const resWattsPerSqFt = 5; // Residential benchmark (lower than commercial)
  const resPowerKW = (homeSqFt * resWattsPerSqFt * homes) / 1000;
  const resPowerMW = resPowerKW / 1000;
  
  return {
    powerMW: Math.max(0.01, Math.round(resPowerMW * 100) / 100),
    durationHrs: 4,
    description: `Residential: ${homes} home(s) × ${homeSqFt.toLocaleString()} sq ft × ${resWattsPerSqFt} W/sqft = ${resPowerKW.toFixed(1)} kW`,
    calculationMethod: 'Residential benchmark (5 W/sq ft peak)',
    inputs: { homes, homeSqFt, resWattsPerSqFt }
  };
```

## All Slug Handlers in `calculateUseCasePower()` (54 total)

```
agricultural, agriculture, airport, apartment, apartment-building, apartments,
automatic, car-wash, casino, cold-storage, college, college-university, dairy,
data-center, datacenter, distribution-center, edge-data-center, electronics,
ev-charging, ev-charging-station, flex-serve, food, fuel-station, gas-station,
government, greenhouse, heavy, hospital, hotel, hotel-hospitality, indoor-farm,
light, logistics, logistics-center, manufacturing, microgrid, mixed, office,
office-building, orchard, processing, public-building, residential, retail,
retail-commercial, row-crop, self-service, shopping-center, shopping-mall,
tribal-casino, tunnel, university, vineyard, warehouse
```

## Previous Bugs Fixed (same session)

1. **Microgrid slug not handled** → Added dedicated handler with EV detection + fallback
2. **Default case math bug** → Fixed `Math.round(x / 10) / 100` to correct division
3. **EV field name mismatch** → Added aliases for `level2Chargers`/`numberOfLevel2Chargers`

## Testing Recommendations

Test these use cases after deployment:

1. **Edge Data Center** - Should use datacenter calculation (~150 W/sq ft)
2. **Distribution Center** - Should use warehouse calculation (~15 W/sq ft for regular, ~50 W/sq ft for cold)
3. **Apartment Building** - Should use apartment calculation (unit-based)
4. **Residential** - Should use residential benchmark (5 W/sq ft peak)

## Architecture Notes

### Single Source of Truth
File: `src/services/useCasePowerCalculations.ts`

### Field Name Conventions
Always support multiple field name formats to handle variations:
```typescript
parseInt(useCaseData.numberOfLevel2Chargers || useCaseData.level2Chargers) || 0
parseInt(useCaseData.unitCount || useCaseData.units) || 100
parseInt(useCaseData.warehouseSqFt || useCaseData.sqFt) || 250000
```

### Adding New Use Cases
1. Add slug to database `use_cases` table
2. Add `case 'slug-name':` handler in `calculateUseCasePower()`
3. Create or reuse calculation function
4. Test with actual wizard flow
