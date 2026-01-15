# Question Input Type System - Implementation Guide

## Summary

Created a comprehensive system to properly map questionnaire input fields based on the type of data being collected.

## Input Type Guidelines

| Type | Use For | Example Fields |
|------|---------|----------------|
| **range_buttons** | Small to medium discrete counts | numberOfRooms, bedCount, serverRacks, bayCount, chargerCount |
| **slider** | Continuous/operational values | carsPerDay, hoursOfOperation, squareFootage, acreage, kW capacity |
| **multiselect** | Multiple selections allowed | amenities, facilities, services, features |
| **select** | Single choice from options | buildingType, climateZone, gridConnection |
| **toggle** | Yes/No binary choice | hasPool, hasRestaurant, needsBackupPower |
| **number_input** | Direct numeric entry (rare) | exactValues, custom inputs |

## Files Modified

### 1. Input Components (`src/components/wizard/v6/step3/inputs/index.tsx`)

Added:
- `RangeButtonGroup` component for discrete count ranges
- `range_buttons`, `slider`, `toggle` cases in `SmartQuestion`
- Updated type definitions to support new question types

### 2. Step3 Container (`src/components/wizard/v6/step3/Step3Container.tsx`)

Updated `Question` interface to include new types:
```typescript
question_type: 'select' | 'multiselect' | 'number' | 'boolean' | 'text' | 'range_buttons' | 'slider' | 'toggle'
```

### 3. Audit Script (`scripts/audit-question-input-types.ts`)

Created comprehensive audit script that:
- Analyzes all custom_questions across all use cases
- Classifies each question based on field name patterns
- Generates migration SQL
- Outputs JSON with full audit results

## Generated Files

### `audit-results/question-input-audit.json`
Full audit results in JSON format with:
- Current question type
- Recommended question type
- Configuration (min/max/step/ranges/suffix)
- Reason for recommendation

### `audit-results/question-input-migration.sql`
Ready-to-run SQL migration that updates:
- `question_type` column
- `options` column with proper config JSON

## How the System Works

### Database Schema

The `options` column in `custom_questions` stores configuration as JSONB:

**For range_buttons:**
```json
{
  "ranges": [
    { "label": "1-5", "min": 1, "max": 5 },
    { "label": "6-10", "min": 6, "max": 10 },
    { "label": "11-20", "min": 11, "max": 20 },
    { "label": "21-50", "min": 21, "max": 50 },
    { "label": "50+", "min": 51, "max": null }
  ],
  "suffix": "rooms"
}
```

**For slider:**
```json
{
  "min": 1000,
  "max": 500000,
  "step": 1000,
  "suffix": " sq ft"
}
```

### Frontend Rendering

`SmartQuestion` component reads `question_type` and `options` from the database and renders the appropriate component:

```tsx
case "range_buttons": {
  const rangeConfig = config as RangeConfig;
  return (
    <RangeButtonGroup
      ranges={rangeConfig.ranges}
      value={value}
      onChange={onChange}
      suffix={rangeConfig.suffix}
    />
  );
}

case "slider": {
  const sliderConfig = config as SliderConfig;
  return (
    <SliderWithButtons
      value={value}
      onChange={onChange}
      min={sliderConfig.min}
      max={sliderConfig.max}
      step={sliderConfig.step}
      suffix={sliderConfig.suffix}
    />
  );
}
```

## Audit Summary

```
SUMMARY: 253/655 questions need updates
```

### By Use Case

| Use Case | Needs Update / Total |
|----------|---------------------|
| agricultural | 10/31 |
| airport | 10/30 |
| apartment | 12/30 |
| car-wash | 17/27 |
| casino | 13/29 |
| cold-storage | 11/32 |
| college | 13/32 |
| data-center | 9/31 |
| ev-charging | 15/30 |
| gas-station | 10/29 |
| government | 12/31 |
| **heavy_duty_truck_stop** | **13/19** |
| hospital | 12/30 |
| hotel | 14/36 |
| indoor-farm | 9/30 |
| manufacturing | 10/31 |
| microgrid | 9/32 |
| office | 12/30 |
| residential | 9/24 |
| retail | 10/29 |
| shopping-center | 12/31 |
| warehouse | 11/31 |

## Next Steps

1. **Review Migration SQL**: Check `audit-results/question-input-migration.sql`
2. **Run Migration**: Apply the SQL to update the database
3. **Test UI**: Verify questions render correctly with new input types
4. **Fine-tune**: Adjust ranges/configs as needed for specific use cases

## Example: Truck Stop Questions (After Migration)

| Field | Type | Config |
|-------|------|--------|
| mcsChargers | range_buttons | 0, 1-2, 3-4, 5-8, 8+ |
| dcfc350 | range_buttons | 0-4, 5-10, 11-20, 21-40, 40+ |
| level2 | range_buttons | 0-5, 6-15, 16-30, 31-50, 50+ |
| serviceBays | range_buttons | 0-2, 3-6, 7-10, 11-15, 15+ |
| truckWashBays | range_buttons | 0, 1, 2, 3-4, 5+ |
| restaurantSeats | range_buttons | 0-50, 51-100, 101-200, 201-400, 400+ |
| hasShowers | toggle | Yes/No |
| hasLaundry | toggle | Yes/No |
| parkingLotAcres | slider | 0.5-20 acres, step 0.5 |
| climateZone | select | Hot/Arid, Hot/Humid, Temperate, Cold, Mountain |
