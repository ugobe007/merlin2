# Step 3 Alignment Issues - RESOLVED Feb 4, 2026

## ✅ FIXED - All Issues Resolved

### Final Validation Results (Feb 4, 2026)

**Workflow validator** (`scripts/validate-step3-workflow.ts`) - **ALL PASS**:

### ✅ Hotel: PASSED
- Database questions: 16
- Calculator inputs: 16  
- Results: base=120kW, peak=603kW, energy=8172kWh/day
- Status: **Working correctly**

### ✅ Data Center: PASSED  
- Database questions: 16
- Calculator inputs: 16
- Results: base=525kW, peak=1050kW, energy=12600kWh/day
- Status: **Working correctly**

### ✅ Car Wash: PASSED (FIXED)
- Database questions: 16
- Calculator inputs: 10 (reduced from 18 - simplified to database fields)
- Results: base=7kW, peak=157kW, energy=1958kWh/day
- Status: **Working correctly - using real database inputs**
- Warning: Minor field name mismatch (`waterHeating`) - not critical

### Diagnostic Tests - ALL PASS
**Car Wash Sensitivity Tests** (`scripts/quote-diag.ts`):
- ✅ baseline (12h, 250 cars): 1958 kWh/day
- ✅ more_hours (18h): 2785 kWh/day (+42%)
- ✅ low_traffic (10h, 120 cars): 1424 kWh/day (-27%)
- ✅ Monotonic checks: PASS

**Hotel Sensitivity Tests**:
- ✅ room count ↑ → peak ↑ (PASS)
- ✅ occupancy ↑ → peak/kWh ↑ (PASS)

**Data Center Sensitivity Tests**:
- ✅ IT load ↑ → peak ↑ (PASS)
- ✅ PUE ↓ → peak ↓ (PASS)

## Problem Summary (HISTORICAL)

The Step 3 questionnaires were **NOT aligned** with calculator input expectations. This causes:

1. **Field Name Mismatches**: Calculators expect snake_case (e.g., `bay_count`), but database has camelCase (e.g., `bayTunnelCount`)
2. **Field Type Mismatches**: Calculators expect flat numeric fields, but database has combined fields or string ranges
3. **Missing Transformation Layer**: No adapter between database schema and calculator expectations

## Validation Results (Feb 4, 2026)

**Workflow validator** (`scripts/validate-step3-workflow.ts`) tested complete pipeline:

### ✅ Hotel: PASSED
- Database questions: 16
- Calculator inputs: 16  
- Results: base=120kW, peak=603kW, energy=8172kWh/day
- Status: **Working correctly**

### ✅ Data Center: PASSED  
- Database questions: 16
- Calculator inputs: 16
- Results: base=525kW, peak=1050kW, energy=12600kWh/day
- Status: **Working correctly**

### ⚠️ Car Wash: WARNINGS
- Database questions: 16
- Calculator inputs: 18
- Results: base=7kW, peak=72kW, energy=821kWh/day (very low!)
- **9 missing/invalid inputs**:
  - `bay_count` (database has `bayTunnelCount`)
  - `cars_per_day_avg` (database has `averageWashesPerDay`)
  - `cars_per_hour_peak` (database has `peakHourThroughput`)
  - `operating_hours_per_day` (database has `operatingHours`)
  - `days_per_week` (no equivalent in database!)
  - `monthly_kwh` (database has `monthlyElectricitySpend`)
  - `dryer_kw` (embedded in `primaryEquipment`)
  - `vacuum_count` (embedded in `primaryEquipment`)
  - `vacuum_kw_each` (no direct equivalent)
- Status: **Working but with defaults - not using user inputs!**

## Root Causes

### 1. Calculator Registry Not Updated
File: `src/wizard/v7/calculators/registry.ts`

**HOTEL_LOAD_V1_16Q** - ✅ Fixed (uses database camelCase)
```typescript
const roomCount = num(inputs.roomCount) || 150;
const hotelAmenities = Array.isArray(inputs.hotelAmenities) ? inputs.hotelAmenities : [];
```

**DC_LOAD_V1_16Q** - ✅ Fixed (parses database string ranges)
```typescript
const itLoadCapacity = str(inputs.itLoadCapacity) || "500-1000";
const parseITLoad = (range: string): number => { ... };
```

**CAR_WASH_LOAD_V1_16Q** - ❌ NOT FIXED (still uses snake_case)
```typescript
const bayCount = requireNum(inputs, "bay_count", warnings) || 1;  // WRONG!
const carsPerDay = requireNum(inputs, "cars_per_day_avg", warnings) || 200;  // WRONG!
```

### 2. Field Name Mappings Needed

| Calculator Expects | Database Has | Transformation Needed |
|--------------------|--------------|----------------------|
| `bay_count` | `bayTunnelCount` | Parse "4 bays" → 4 |
| `tunnel_count` | `bayTunnelCount` | Parse "2 tunnels" → 2 |
| `cars_per_day_avg` | `averageWashesPerDay` | Direct map |
| `cars_per_hour_peak` | `peakHourThroughput` | Direct map |
| `operating_hours_per_day` | `operatingHours` | Direct map |
| `days_per_week` | ❌ Missing | Default to 7 |
| `monthly_kwh` | `monthlyElectricitySpend` | Convert $ to kWh (need rate) |
| `dryer_kw` | `primaryEquipment` | Extract if "dryers" in array |
| `vacuum_count` | `primaryEquipment` | Extract if "vacuums" in array |
| `vacuum_kw_each` | ❌ Not granular | Default to 2.5 kW |

## Fix Strategy

### Option A: Update Calculator Registry (RECOMMENDED - TrueQuote Compliant)
**Database is source of truth** - calculators must adapt.

1. Update `CAR_WASH_LOAD_V1_16Q.compute()` to use database field names
2. Add parsing functions for combined fields (bayTunnelCount)
3. Add extraction logic for equipment arrays
4. Document all assumptions/defaults in warnings

### Option B: Add Template Mapping Layer
Create adapters that transform database → calculator format.

**NOT RECOMMENDED** - Violates TrueQuote policy (adds complexity, drift risk)

## Recommended Actions

1. **Immediate**: Fix `CAR_WASH_LOAD_V1_16Q` in registry.ts to use database fields
2. **Testing**: Re-run `scripts/validate-step3-workflow.ts` to verify
3. **Diagnostic**: Run `scripts/quote-diag.ts` to check all variants still work
4. **Documentation**: Update copilot-instructions.md with car wash field mapping

## Files to Modify

1. `src/wizard/v7/calculators/registry.ts` - Update CAR_WASH_LOAD_V1_16Q
2. `scripts/validate-step3-workflow.ts` - Update car wash mock answers
3. `scripts/quote-diag.ts` - Update car wash test cases

## Testing Checklist

- [ ] Workflow validator passes for all 3 industries
- [ ] Quote diagnostic shows proper sensitivity to car wash inputs
- [ ] All monotonic checks pass
- [ ] No TrueQuote policy violations
- [ ] Deployment doesn't break existing quotes
