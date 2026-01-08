# Question Database Mapping Guide

## Overview

This document explains how questions from the database are mapped to the UI components, ensuring each use case shows the correct questions.

## Database Schema

### Custom Questions Table Structure

```sql
custom_questions (
  id: UUID (primary key)
  use_case_id: UUID (foreign key to use_cases)
  question_text: TEXT (the question to display)
  question_key: VARCHAR(100) (unique identifier - schema field)
  field_name: VARCHAR(100) (alternative identifier - used in migrations)
  question_type: 'number' | 'select' | 'boolean' | 'percentage' | 'text' | 'range'
  select_options: JSONB (array of {value, label, icon?, description?})
  default_value: JSONB (default answer)
  min_value: DECIMAL (for number/range types)
  max_value: DECIMAL (for number/range types)
  step_value: DECIMAL (for number/range types)
  unit: VARCHAR(20) (e.g., 'kW', 'sq ft', 'hours')
  help_text: TEXT (help text displayed below question)
  section_name: VARCHAR(50) (optional - groups questions by section)
  display_order: INTEGER (sort order)
  is_required: BOOLEAN
  ...
)
```

## Field Name Mapping

**Issue**: Database schema uses `question_key`, but migrations use `field_name`. Both are supported.

**Resolution**:
- Service layer: Maps both `question_key` and `field_name` → `field_name` in transformation
- UI layer: Uses `field_name` (with fallback to `question_key`)

## Question Type Mapping

### Database Types → UI Types

| Database Type | UI Type | Rendering Component | Notes |
|--------------|---------|---------------------|-------|
| `select` | `buttons` | `ButtonsQuestion` | Renders as button cards with icons/descriptions |
| `number` (with min/max) | `slider` | `SliderQuestion` | Shows slider with large value display |
| `number` (without min/max) | `number_buttons` | `NumberButtonsQuestion` | Renders as number input with +/- buttons |
| `range` | `slider` | `SliderQuestion` | Same as number with range |
| `boolean` | `toggle` | `ToggleQuestion` | Yes/No toggle buttons |
| `text` | `buttons` (fallback) | `ButtonsQuestion` | Currently not supported, falls back to buttons |

### Special Cases

- **Area Input**: If field name contains "area" or "square", converts `text` type to `area_input`
- **Number with Options**: If `number` type has `select_options`, uses `buttons` instead of `slider`

## Options Format

### Database Format (JSONB)

```json
[
  {"value": "express_tunnel", "label": "Express Tunnel", "icon": "🚗", "description": "High-volume automated tunnel"},
  {"value": "flex_serve", "label": "Flex Serve", "icon": "🎯", "description": "Combination of tunnel and self-service"}
]
```

### UI Format

```typescript
{
  value: string;
  label: string;
  icon?: string;
  description?: string;
}
```

**Transformation**: Automatically handled in `transformDatabaseQuestion()` function.

## Section Mapping

### Database Section Names → UI Sections

| Database `section_name` | UI `section` | Examples |
|------------------------|--------------|----------|
| "Facility Basics" | `facility` | Facility type, bay count |
| "Operations" | `operations` | Operating hours, days per week, vehicles |
| "Energy Systems" | `energy` | Chargers, heaters, pumps, service bays |
| "Solar Potential" | `solar` | Roof area, carport interest |

### Automatic Section Inference

If `section_name` is not in the database, sections are inferred from field names:

```typescript
// Solar section
fieldName.includes('solar') || fieldName.includes('roof') || fieldName.includes('carport')

// Operations section  
fieldName.includes('hours') || fieldName.includes('vehicles') || fieldName.includes('operating') || fieldName.includes('days')

// Energy section
fieldName.includes('charger') || fieldName.includes('ev') || fieldName.includes('heater') || 
fieldName.includes('pump') || fieldName.includes('service') || fieldName.includes('wash') ||
fieldName.includes('bay') || fieldName.includes('mcs') || fieldName.includes('dcfc')

// Facility section (default)
// All other questions
```

## Use Case → Questions Flow

```
1. User selects industry in Step 2
   └─> state.industry = 'heavy_duty_truck_stop'

2. Step 3 loads
   └─> Step3Details.tsx: useEffect(() => loadQuestions())

3. Normalize industry slug
   └─> 'heavy_duty_truck_stop'.replace(/-/g, '_') = 'heavy_duty_truck_stop'

4. Fetch from database
   └─> UseCaseService.getUseCaseBySlug('heavy_duty_truck_stop')
       └─> SELECT * FROM use_cases WHERE slug = 'heavy_duty_truck_stop'
       └─> SELECT * FROM custom_questions WHERE use_case_id = <id> ORDER BY display_order

5. Transform questions
   └─> transformDatabaseQuestion(q, index) for each question
       └─> Maps database format to UI Question interface

6. Render in UI
   └─> QuestionnaireEngine displays questions one at a time
   └─> QuestionRenderer renders based on question type
   └─> ProgressSidebar shows progress per section
```

## Use Case Examples

### Car Wash

**Database Slug**: `car-wash` or `car_wash`  
**Questions**: 18 questions from `CAR_WASH_QUESTIONS` config (fallback) or database  
**Sections**: 
- Facility Basics (facility type, bay count)
- Operations (hours, vehicles)
- Energy Systems (heaters, pumps, chargers)
- Solar Potential (roof area, carport)

### Truck Stop / Travel Center

**Database Slug**: `heavy_duty_truck_stop`  
**Questions**: 20 questions from database  
**Sections**:
- Facility (facility size, square footage)
- Energy Systems (MCS chargers, DCFC, Level 2, service bays, truck wash)
- Operations (operating hours, monthly bills)
- Solar Potential (existing solar, backup requirements)

### Hotel / Hospitality

**Database Slug**: `hotel` or `hotel-hospitality`  
**Questions**: From database (room count, amenities, etc.)  
**Sections**: Facility, Operations, Energy, Solar

## Merlin Guidance

**Current Status**: `merlinTip` is set to `undefined` in transformation.

**Future Enhancement**: 
- Add `merlin_tip` column to `custom_questions` table
- Store use-case-specific tips in database
- Display tips in `QuestionRenderer` component via `MerlinTip` component

**Example**:
```sql
UPDATE custom_questions 
SET merlin_tip = 'MCS chargers pull extreme power spikes - BESS sizing critical for demand charge management'
WHERE field_name = 'mcsChargers' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'heavy_duty_truck_stop');
```

## Validation Checklist

For each use case, verify:

- [ ] Questions load from database (not hardcoded)
- [ ] Field names match calculation logic (e.g., `mcsChargers` used in `calculateTruckStopLoad()`)
- [ ] Question types render correctly (select → buttons, number → slider/number_buttons)
- [ ] Options parse correctly (JSONB → array)
- [ ] Sections group correctly (facility/operations/energy/solar)
- [ ] Default values pre-fill correctly
- [ ] Help text displays below questions
- [ ] Smart defaults applied based on facility type (if applicable)
- [ ] Conditional questions show/hide correctly (if applicable)

## Current Issues & Fixes

### Issue 1: Field Name Mismatch ✅ FIXED
- **Problem**: Database schema uses `question_key`, migrations use `field_name`
- **Fix**: Service layer now maps both fields, UI uses `field_name` with fallback

### Issue 2: Options Format ✅ FIXED
- **Problem**: Database uses `select_options`, migrations use `options`
- **Fix**: Transformation checks both `select_options` and `options`

### Issue 3: Section Mapping ⚠️ NEEDS IMPROVEMENT
- **Problem**: Truck stop migration doesn't include `section_name`, relies on inference
- **Fix**: Improved inference logic, but should add `section_name` to database

### Issue 4: Question Type Mapping ✅ FIXED
- **Problem**: Database `number` type needs to map to `slider` (if has range) or `number_buttons`
- **Fix**: Transformation checks for `min_value`/`max_value` to determine type

## Testing Recommendations

1. **Test Each Use Case**:
   ```bash
   # Car Wash
   - Select "Car Wash" in Step 2
   - Verify 18 questions load
   - Verify sections: Facility, Operations, Energy, Solar
   
   # Truck Stop
   - Select "Truck Stop / Travel Center" in Step 2
   - Verify 20 questions load from database
   - Verify MCS charger question appears first
   - Verify sections group correctly
   
   # Hotel
   - Select "Hotel / Hospitality" in Step 2
   - Verify questions load from database
   - Verify room count question renders correctly
   ```

2. **Verify Question Rendering**:
   - Select questions render as button cards
   - Number questions render as sliders (if has range) or number inputs
   - Toggle questions render as Yes/No buttons
   - Options display icons and descriptions correctly

3. **Verify Data Flow**:
   - Answers save to `state.useCaseData.inputs`
   - Field names match calculation functions (e.g., `mcsChargers` → `calculateTruckStopLoad()`)
   - Default values pre-fill correctly

## Next Steps

1. **Add `section_name` to truck stop questions** in database migration
2. **Add `merlin_tip` column** to `custom_questions` table
3. **Populate Merlin tips** per use case in database
4. **Test all use cases** to verify questions load correctly
5. **Add conditional logic** support (if needed)
