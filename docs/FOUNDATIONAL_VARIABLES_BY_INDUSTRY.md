# Foundational Variables by Industry

## Critical Variables That MUST Be Captured

These are the foundation for all energy calculations. Without them, quotes will be inaccurate.

### Hotel (`hotel`)
- **Primary**: `roomCount` (number, required)
  - Example: 150 rooms vs 350 rooms = 2.3x difference in energy needs
  - Saudi Arabia hotels: 500+ rooms common
  - Database field: `roomCount`, `is_required: true`
  - UI: Step3HotelEnergy slider (lines 511-519)

### Car Wash (`car-wash`)
- **Primary**: `bayCount` or `tunnelCount` (number, required)
  - Determines equipment load (pumps, dryers, etc.)
  - Database field: `bayCount`, `tunnelCount`
  - UI: Step3Details number input

### Data Center (`data-center`)
- **Primary**: `rackCount` OR `itLoadKW` (number, required)
  - IT load drives all power calculations
  - Database field: `rackCount`, `itLoadKW`
  - UI: Step3Details number input

### Hospital (`hospital`)
- **Primary**: `bedCount` (number, required)
  - Bed count determines base load, critical for backup sizing
  - Database field: `bedCount`
  - UI: Step3Details number input

### EV Charging (`ev-charging`)
- **Primary**: `level2Count`, `dcFastCount`, `ultraFastCount` (numbers, required)
  - Charger count × power rating = total demand
  - Database fields: `level2Count`, `dcFastCount`, `ultraFastCount`
  - UI: Step3Details or Step4Opportunities

### Apartment (`apartment`)
- **Primary**: `unitCount` (number, required)
  - Number of units drives base load
  - Database field: `unitCount`
  - UI: Step3Details number input

### Warehouse (`warehouse`)
- **Primary**: `warehouseSqFt` (number, required)
  - Square footage determines lighting/HVAC load
  - Database field: `warehouseSqFt`, `squareFeet`
  - UI: Step3Details number input

### Manufacturing (`manufacturing`)
- **Primary**: `facilitySqFt` OR production metrics (number, required)
  - Size drives all facility systems
  - Database field: `facilitySqFt`, `squareFeet`
  - UI: Step3Details number input

### Retail (`retail`)
- **Primary**: `storeSqFt` (number, required)
  - Square footage determines base load
  - Database field: `storeSqFt`, `squareFeet`
  - UI: Step3Details number input

### Office (`office`)
- **Primary**: `buildingSqFt` (number, required)
  - Square footage determines base load
  - Database field: `buildingSqFt`, `squareFeet`
  - UI: Step3Details number input

## Current Status

### Hotel
- ❌ `roomCount` not being saved to `useCaseData`
- ✅ Question exists in database (`roomCount`, `is_required: true`)
- ✅ Rendered in Step3HotelEnergy (slider)
- ❌ Not syncing to state properly

### Action Items

1. **Fix roomCount sync in Step3HotelEnergy**
   - Verify database question has `default_value`
   - Ensure defaults are properly initialized
   - Verify sync to `useCaseData` works

2. **Audit all industries**
   - Verify foundational variables exist in database
   - Verify they're rendered in Step 3
   - Verify they sync to `useCaseData`
   - Verify they're passed to TrueQuote Engine

3. **Make foundational variables required**
   - UI should prevent proceeding without them
   - Clear error messages if missing
   - Prominent placement in form

4. **Remove all silent defaults**
   - Don't default to 150 rooms for hotels
   - Don't default to any foundational variables
   - Force user to provide actual values
