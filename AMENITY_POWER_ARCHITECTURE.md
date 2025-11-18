# Amenity Power Calculation Architecture

## Overview
Fixed hotel undersizing bug (400 rooms showing 0.3 MW instead of 1.8+ MW) by implementing proper architecture for amenity power calculations that follows the **single source of truth** principle.

## Architecture Principles

### ❌ WRONG APPROACH (What Was Done Initially)
```typescript
// baselineService.ts - HARDCODED VALUES (VIOLATES ARCHITECTURE)
const restaurantLoads: Record<string, number> = {
  'continental_breakfast': 15,
  'cafe_bistro': 40,
  // ... hardcoded values
};
```

**Problems:**
- Power values hardcoded in calculation logic
- Duplicate data (template has values in helpText, service has different values)
- No single source of truth
- Changes require editing multiple files
- Violates DRY principle

### ✅ CORRECT APPROACH (Implemented Solution)

#### 1. **Single Source of Truth: useCaseTemplates.ts**

Power values are defined ONCE in the template options:

```typescript
// useCaseTemplates.ts - SINGLE SOURCE OF TRUTH
{
  id: 'hasRestaurant',
  type: 'select',
  options: [
    { value: 'none', label: 'No food service', powerKw: 0 },
    { value: 'continental_breakfast', label: 'Continental breakfast only', powerKw: 15 },
    { value: 'cafe_bistro', label: 'Cafe or bistro', powerKw: 40 },
    { value: 'full_kitchen', label: 'Full restaurant kitchen', powerKw: 115 },
    { value: 'multiple_restaurants', label: 'Multiple restaurants', powerKw: 250 },
  ],
  impactType: 'power_add',
}
```

#### 2. **Type Safety: useCase.types.ts**

Extended CustomQuestion interface to support power data:

```typescript
export interface CustomQuestion {
  // ... existing fields
  options?: (string | { value: string; label: string; powerKw?: number })[];
  additionalLoadKw?: number; // For number inputs (e.g., 10 kW per EV port)
  // ...
}
```

#### 3. **Generic Calculation Logic: baselineService.ts**

Reads power values FROM the template (no hardcoding):

```typescript
// Find template from USE_CASE_TEMPLATES (single source of truth)
const templateObj = USE_CASE_TEMPLATES.find(
  (t: UseCaseTemplate) => t.slug === templateKey || t.id === templateKey
);

if (templateObj?.customQuestions) {
  for (const question of templateObj.customQuestions) {
    if (question.impactType !== 'power_add') continue;
    
    // Read user's selection
    const userValue = useCaseData[question.id];
    
    // Find the power value from template options
    const selectedOption = question.options.find((opt: any) => 
      typeof opt === 'object' && opt.value === userValue
    );
    
    if (selectedOption && 'powerKw' in selectedOption) {
      amenityLoadKW += selectedOption.powerKw; // Use template data
    }
  }
}
```

## Hotel Template Power Values

### Restaurant/Kitchen Loads
| Option | Power (kW) | Description |
|--------|------------|-------------|
| none | 0 | No food service |
| continental_breakfast | 15 | Minimal kitchen |
| cafe_bistro | 40 | Small cafe/bistro |
| full_kitchen | 115 | Full restaurant kitchen |
| multiple_restaurants | 250 | Multiple dining venues |

### Amenities (Multiselect)
| Amenity | Power (kW) | Description |
|---------|------------|-------------|
| pool | 55 | Swimming pool (heating/pumps/lighting) |
| indoor_pool | 75 | Indoor pool with HVAC |
| hot_tub | 30 | Hot tub/jacuzzi |
| fitness | 27 | Fitness center |
| full_spa | 115 | Full spa facility |
| conference | 70 | Conference/meeting rooms |
| ballroom | 90 | Ballroom/event space |
| business_center | 15 | Business center |
| laundry_valet | 75 | Valet laundry service |
| casino | 350 | Casino gaming floor |

### EV Charging
| Option | Power (kW) | Description |
|--------|------------|-------------|
| none | 0 | No EV charging |
| planning | 0 | Planning to add |
| level2_few | 30 | Few Level 2 chargers (2-4 ports) |
| level2_many | 120 | Many Level 2 chargers (5-20 ports) |
| dcfast | 150 | DC fast charging |
| tesla_destination | 80 | Tesla Destination Charging |

### EV Charging Ports (Number Input)
- **Type**: Number input
- **additionalLoadKw**: 10 kW per port
- **Calculation**: `numberOfPorts × 10 kW`

## Example Calculation

### 400-Room Luxury Hotel with Full Amenities

**Base Load:**
- 400 rooms × 2.93 kW/room = **1,172 kW = 1.17 MW**

**Amenity Loads:**
- Multiple restaurants: +250 kW
- Indoor pool: +75 kW
- Full spa: +115 kW
- Fitness center: +27 kW
- Conference rooms: +70 kW
- Ballroom: +90 kW
- 20 EV charging ports: +200 kW (20 × 10 kW)

**Total Amenity Load:** 827 kW = 0.83 MW

**Final Recommendation:**
```
Base (1.17 MW) + Amenities (0.83 MW) = 2.0 MW ✅
```

## Benefits of This Architecture

### 1. **Single Source of Truth**
- All power values defined ONCE in `useCaseTemplates.ts`
- Changes to power values only require editing one file
- No risk of inconsistent values across codebase

### 2. **Scalability**
- Works for ALL use cases (hotel, apartment, datacenter, etc.)
- Same logic applies to any template with `impactType: 'power_add'`
- Easy to add new amenities - just add to template options

### 3. **Maintainability**
- Clear separation of concerns:
  - **Data**: useCaseTemplates.ts
  - **Logic**: baselineService.ts
  - **Types**: useCase.types.ts
- Business logic (power values) lives with business data (questions)

### 4. **Type Safety**
- TypeScript enforces structure
- IntelliSense shows available fields
- Compile-time errors catch mistakes

### 5. **Reusability**
- Generic algorithm works for:
  - Select questions with `powerKw` in options
  - Multiselect questions (sums all selected powerKw)
  - Number inputs with `additionalLoadKw` multiplier

## Usage Pattern for New Use Cases

To add amenity calculations to any use case:

1. **Add power data to template options:**
```typescript
{
  id: 'buildingAmenities',
  type: 'multiselect',
  options: [
    { value: 'gym', label: 'Fitness Center', powerKw: 50 },
    { value: 'pool', label: 'Swimming Pool', powerKw: 75 },
    { value: 'theater', label: 'Home Theater', powerKw: 20 },
  ],
  impactType: 'power_add', // Mark for calculation
}
```

2. **That's it!** baselineService automatically:
   - Finds questions with `impactType: 'power_add'`
   - Reads user selections from `useCaseData`
   - Looks up power values from template options
   - Adds to base calculation

## Files Modified

1. **useCaseTemplates.ts** - Added `powerKw` to hotel question options
2. **useCase.types.ts** - Extended `CustomQuestion.options` type
3. **baselineService.ts** - Generic amenity calculation logic
4. **QuestionRenderer.tsx** - Already supports object options (no changes needed)

## Testing Checklist

- [x] TypeScript compiles without errors
- [ ] 400-room hotel with no amenities → 1.17 MW
- [ ] 400-room hotel + full kitchen → 1.29 MW
- [ ] 400-room hotel + all amenities → ~2.0 MW
- [ ] Apartment template (verify compatibility)
- [ ] Datacenter template (verify no conflicts)
- [ ] Console logs show amenity breakdown

## Related Documents

- `ARCHITECTURE_GUIDE.md` - Overall system architecture
- `CALCULATION_CENTRALIZATION_PLAN.md` - Centralized calculations strategy
- `useCaseTemplates.ts` - Single source of truth for all use case data
- `baselineService.ts` - Centralized BESS sizing logic

---

**Date:** November 17, 2025  
**Issue:** Hotel undersizing bug (400 rooms → 0.3 MW instead of 2.0 MW)  
**Resolution:** Implemented proper architecture with single source of truth for amenity power calculations
