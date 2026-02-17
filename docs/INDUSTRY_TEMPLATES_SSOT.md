# Industry Templates SSOT System

## Overview

The `industryTemplates.ts` system provides a **Single Source of Truth (SSOT)** for all industry-specific calculation factors, similar to how `solarTemplates.ts` works for solar calculations.

## Architecture

### Database-Driven SSOT

All industry calculation factors are stored in the `calculation_constants` table and pulled dynamically:

```
Database (calculation_constants) → industryTemplates.ts → Calculation Services
```

### Priority Order

1. **Database** (`calculation_constants` table) - Admin-configurable, no deploy needed
2. **Code Fallback** (`FALLBACK_TEMPLATES`) - Hardcoded values if DB unavailable

## Supported Industries

### ✅ Currently Implemented

- **Hotels** - Room-based factors, amenity multipliers
- **Data Centers** - PUE by tier, kW per sqft
- **Hospitals** - Bed-based factors, department multipliers
- **EV Charging** - Charger type factors, concurrency factors
- **Truck Stops** - Equipment factors, load profile factors
- **Manufacturing** - Sqft-based factors, process-specific factors
- **Retail** - Sqft-based factors
- **Warehouse** - Sqft-based factors
- **Office** - Sqft-based factors
- **Car Wash** - Equipment-based factors
- **Airport** - Tier-based factors
- **College/University** - Sqft-based factors

## Usage

### Basic Usage

```typescript
import { getIndustryTemplate, getIndustryBaseFactor } from '@/services/industryTemplates';

// Get full template
const template = await getIndustryTemplate('hotel');
console.log(template.baseFactor); // 2.5 kW per room
console.log(template.amenityMultipliers?.restaurant); // 0.15

// Get specific factor
const kwPerRoom = await getIndustryBaseFactor('hotel'); // 2.5
const loadFactor = await getIndustryLoadFactor('hotel'); // 0.45

// Get multipliers
const restaurantMultiplier = await getHotelAmenityMultiplier('restaurant'); // 0.15
const tier3PUE = await getDatacenterTierMultiplier('tier3'); // 1.98
const icuMultiplier = await getHospitalDepartmentMultiplier('icu'); // 0.15
```

### Integration with Load Calculator

The `loadCalculator.ts` should be updated to use `industryTemplates.ts`:

```typescript
// OLD (hardcoded):
const config = INDUSTRY_LOAD_FACTORS[input.industry];

// NEW (database-driven):
const template = await getIndustryTemplate(input.industry);
const config = {
  method: template.calculationMethod,
  baseFactor: template.baseFactor,
  loadFactor: template.loadFactor,
  // ... etc
};
```

## Database Schema

### calculation_constants Table

All industry factors are stored with the following key format:

```
{industry}_{factor}
```

Examples:
- `hotel_kw_per_room` = 2.5
- `datacenter_pue_tier3` = 1.98
- `hospital_icu_multiplier` = 0.15
- `ev_dcfc350_kw` = 350
- `truck_stop_mcs_kw` = 1000

### Migration

Run the migration to populate factors:

```sql
-- Run this migration
\i database/migrations/20260107_add_industry_calculation_factors.sql
```

## Benefits

### ✅ SSOT Compliance

- **One place to update**: Change factors in database, no code deploy needed
- **Version controlled**: Database changes are tracked
- **Admin-editable**: Non-developers can update factors via admin panel

### ✅ Consistency

- **Same pattern as solar**: Mirrors `solarTemplates.ts` architecture
- **Unified approach**: All industries use same template system
- **Database-driven**: Factors can be updated without code changes

### ✅ Maintainability

- **Centralized**: All industry factors in one place
- **Documented**: Each factor has description and source
- **Testable**: Easy to test with mock database values

## Migration Path

### Phase 1: Create Templates ✅

- [x] Create `industryTemplates.ts`
- [x] Create database migration
- [x] Define all industry templates

### Phase 2: Update Services (In Progress)

- [ ] Update `loadCalculator.ts` to use `industryTemplates.ts`
- [ ] Update `baselineService.ts` to use templates
- [ ] Update `useCasePowerCalculations.ts` to use templates

### Phase 3: Database Population

- [ ] Run migration: `20260107_add_industry_calculation_factors.sql`
- [ ] Verify all factors are in database
- [ ] Test with real database values

### Phase 4: Remove Legacy Code

- [ ] Remove `INDUSTRY_LOAD_FACTORS_LEGACY` from `loadCalculator.ts`
- [ ] Remove hardcoded factors from other services
- [ ] Update all calculation services to use templates

## Example: Hotel Calculation

### Before (Hardcoded)

```typescript
const hotelConfig = {
  method: 'per_unit',
  wattsPerUnit: 2500, // Hardcoded
  loadFactor: 0.45,   // Hardcoded
};
```

### After (Database-Driven)

```typescript
const template = await getIndustryTemplate('hotel');
// template.baseFactor = 2.5 (from DB: hotel_kw_per_room)
// template.loadFactor = 0.45 (from DB: hotel_load_factor)
// template.amenityMultipliers.restaurant = 0.15 (from DB: hotel_restaurant_multiplier)
```

## Database Factors Reference

### Hotel Factors

| Key | Value | Description |
|-----|-------|-------------|
| `hotel_kw_per_room` | 2.5 | Peak kW per room |
| `hotel_load_factor` | 0.45 | Load factor (average vs peak) |
| `hotel_restaurant_multiplier` | 0.15 | Restaurant adds 15% to base |
| `hotel_pool_multiplier` | 0.08 | Pool adds 8% to base |
| `hotel_spa_multiplier` | 0.05 | Spa adds 5% to base |
| `hotel_conference_multiplier` | 0.10 | Conference rooms add 10% to base |

### Data Center Factors

| Key | Value | Description |
|-----|-------|-------------|
| `datacenter_kw_per_sqft` | 150 | Peak kW per sqft |
| `datacenter_load_factor` | 0.85 | Load factor (high utilization) |
| `datacenter_pue_tier1` | 1.67 | PUE for Tier I |
| `datacenter_pue_tier2` | 1.75 | PUE for Tier II |
| `datacenter_pue_tier3` | 1.98 | PUE for Tier III |
| `datacenter_pue_tier4` | 2.50 | PUE for Tier IV |

### Hospital Factors

| Key | Value | Description |
|-----|-------|-------------|
| `hospital_kw_per_bed` | 8.0 | Peak kW per bed |
| `hospital_load_factor` | 0.65 | Load factor (high utilization) |
| `hospital_icu_multiplier` | 0.15 | ICU adds 15% to base |
| `hospital_or_multiplier` | 0.10 | Operating rooms add 10% to base |
| `hospital_imaging_multiplier` | 0.05 | Imaging equipment adds 5% to base |

### EV Charging Factors

| Key | Value | Description |
|-----|-------|-------------|
| `ev_charging_load_factor` | 0.25 | Load factor (utilization + diversity) |
| `ev_level2_kw` | 19.2 | Level 2 charger power (kW) |
| `ev_dcfc50_kw` | 50 | 50kW DCFC power (kW) |
| `ev_dcfc150_kw` | 150 | 150kW DCFC power (kW) |
| `ev_dcfc350_kw` | 350 | 350kW HPC power (kW) |
| `ev_megawatt_kw` | 1000 | Megawatt charger power (kW) |

### Truck Stop Factors

| Key | Value | Description |
|-----|-------|-------------|
| `truck_stop_load_factor` | 0.65 | Load factor (equipment diversity) |
| `truck_stop_mcs_kw` | 1000 | MCS charger power (kW) |
| `truck_stop_dcfc350_kw` | 350 | 350kW DCFC power (kW) |
| `truck_stop_level2_kw` | 19.2 | Level 2 charger power (kW) |
| `truck_stop_service_bay_kw` | 50 | Service bay power (kW) |
| `truck_stop_wash_bay_kw` | 100 | Wash bay power (kW) |
| `truck_stop_restaurant_kw_per_seat` | 0.5 | Restaurant power per seat (kW) |

### Other Industries

See `database/migrations/20260107_add_industry_calculation_factors.sql` for complete list.

## Testing

### Unit Tests

```typescript
import { getIndustryTemplate, getIndustryBaseFactor } from '@/services/industryTemplates';

test('hotel template loads from database', async () => {
  const template = await getIndustryTemplate('hotel');
  expect(template.baseFactor).toBe(2.5);
  expect(template.amenityMultipliers?.restaurant).toBe(0.15);
});

test('falls back to hardcoded if DB unavailable', async () => {
  // Mock DB failure
  const template = await getIndustryTemplate('hotel');
  expect(template.baseFactor).toBeGreaterThan(0); // Should have fallback
});
```

## Next Steps

1. ✅ Create `industryTemplates.ts` - DONE
2. ✅ Create database migration - DONE
3. ⏳ Update `loadCalculator.ts` to use templates
4. ⏳ Update `baselineService.ts` to use templates
5. ⏳ Run migration on production database
6. ⏳ Remove legacy hardcoded factors

## Related Files

- `src/services/industryTemplates.ts` - Main template system
- `src/services/solarTemplates.ts` - Solar template system (similar pattern)
- `src/services/calculationConstantsService.ts` - Database constant fetcher
- `src/services/centralizedCalculations.ts` - Financial calculations (uses DB constants)
- `database/migrations/20260107_add_industry_calculation_factors.sql` - Database migration
