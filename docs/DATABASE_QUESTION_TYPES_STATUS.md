# Database Question Types Status

## Summary

The Step 3 questions are loaded from the `custom_questions` table in the database. The UI code (`Step3FacilityDetails.tsx`) renders them based on their `question_type`. Here's the current status:

## Question Type Mapping

### 1. Elevator Count (hotel)
- **Database**: `question_type = 'select'` with options 1-25 (from `20250103_update_hotel_elevator_scale.sql`)
- **UI Rendering**: Rendered as **buttons** (handled at line 1218 in `Step3FacilityDetails.tsx`)
- **Status**: ✅ **Correct** - No changes needed
- **Note**: The UI code has special handling for `elevatorCount` in the `select` case that renders buttons instead of a dropdown.

### 2. Food & Beverage (hotel)
- **Database**: `question_type = 'compound'` with multiselect options (from `20251215_hotel_questionnaire_v2.sql`)
- **UI Rendering**: Rendered as **multiselect buttons** (handled at line 1221 in `Step3FacilityDetails.tsx`)
- **Status**: ✅ **Correct** - No changes needed
- **Note**: The `compound` type is specifically handled for multiselect button rendering.

### 3. Square Footage Questions
- **Database**: 
  - `totalFacilitySquareFootage`: `question_type = 'number'`, min=1000, max=500000 (from `20251226_add_rooftop_square_footage.sql`)
  - `rooftopSquareFootage`: `question_type = 'number'`, min=500, max=1000000
- **UI Rendering**: Rendered as **slider with presets** (handled at line 1505-1513 in `Step3FacilityDetails.tsx`)
- **Status**: ✅ **Correct** - Migration `20251226_fix_step3_question_types.sql` ensures consistency
- **Note**: The UI automatically adds presets for square footage fields: [5000, 10000, 25000, 50000, 100000]

### 4. Hours Per Day
- **Database**: `question_type = 'number'`, min=8, max=24 (from `20251226_add_operating_hours_questions.sql`)
- **UI Rendering**: Rendered as **slider** (handled at line 1443+ in `Step3FacilityDetails.tsx`)
- **Status**: ✅ **Correct** - Max is set to 24 hours as requested
- **Note**: The migration already sets max=24, verified by `20251226_fix_step3_question_types.sql`

## Migration File Created

`database/migrations/20251226_fix_step3_question_types.sql`:
- Verifies/updates square footage questions to use `number` type with proper min/max
- Ensures hours per day questions use `number` type with max=24
- Documents the expected question types for each field
- Includes a verification query at the end

## How to Apply

Run the migration to ensure consistency:
```sql
\i database/migrations/20251226_fix_step3_question_types.sql
```

This migration is **safe** - it only:
1. Updates square footage questions that might still be `select` type from older migrations
2. Ensures hours per day max value is 24
3. Documents the expected configuration (doesn't change elevatorCount or foodBeverage since they're already correct)

## UI Code Notes

- **Elevator Count**: The UI code checks for `elevatorCount` in the `select` case (line 1218) and renders buttons. It will NOT use the stepper control even if the type was `number` because it's handled earlier in the switch statement.
- **Food & Beverage**: The UI code checks for `compound` type (line 1221) and renders multiselect buttons.
- **Square Footage**: The UI code uses `number` type with slider, and automatically adds presets based on field name matching 'square' or 'footage'.
- **Hours Per Day**: The UI code uses `number` type with slider (no special handling, so it uses the standard slider).

