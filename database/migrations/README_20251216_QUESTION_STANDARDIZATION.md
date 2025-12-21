# Question Standardization - December 16, 2025

## Overview

This migration standardizes all use cases to have **16-18 standard questions** with optional **advanced questions** shown in a collapsible "Additional Details" section.

## Standard Question Template (16 questions)

1. **Industry-specific primary** (e.g., `roomCount`, `bedCount`, `bayCount`, `squareFeet`)
2. **Square footage** (`squareFeet`)
3. **Grid capacity** (`gridCapacityKW`)
4. **Monthly electric bill** (`monthlyElectricBill`)
5. **Operating hours** (`operatingHours`)
6. **Peak demand** (`peakDemandKW`) - Optional, some industries calculate from other fields
7. **Facility subtype** (`facilitySubtype`) - If applicable
8. **Equipment tier** (`equipmentTier`)
9. **Has existing solar** - Implied by `existingSolarKW > 0`
10. **Existing solar capacity** (`existingSolarKW`)
11. **Wants solar** (`wantsSolar`)
12. **Has existing EV charging** - Implied by `existingEVChargers > 0`
13. **Existing EV chargers count** (`existingEVChargers`)
14. **Wants EV charging** (`wantsEVCharging`)
15. **Needs backup power** (`needsBackupPower`) - Optional
16. **Primary BESS application** (`primaryBESSApplication`)

## Advanced Questions (17-18+)

- **Data Center**: Questions 19-21 marked as advanced (PUE details, cooling specifics, etc.)
- **Hospital**: Questions 19-22 marked as advanced (trauma level, specific equipment details, etc.)
- **Manufacturing**: Questions 19-21 marked as advanced (will be consolidated to 18 total)
- **Warehouse**: Question 19 marked as advanced (will be consolidated to 18 total)
- **Other 18-question use cases**: Questions 17-18 marked as advanced

## Migration Order

1. **Run `20251216_add_is_advanced_column.sql`** first
   - Adds `is_advanced` column to `custom_questions` table
   - Creates index for performance

2. **Run `20251216_standardize_questions_to_16.sql`** second
   - Marks advanced questions for data-center, hospital, and 18-question use cases
   - Fills missing questions for use cases with < 16 questions:
     - apartment (10 → 16)
     - car-wash (11 → 16)
     - cold-storage (11 → 16)
     - college (11 → 16)
     - office (12 → 16)
     - airport (14 → 16)
     - hotel (14 → 16)
   - Marks manufacturing and warehouse extra questions as advanced (consolidate to 18)
   - Ensures all use cases have `primaryBESSApplication`
   - Reorders all questions to ensure proper sequencing

## Design Consistency

All questions must use the same design elements:

### Number Inputs
- Use `question_type = 'number'` with `min_value` and `max_value`
- Use `step` for decimal increments (if needed)
- Use `unit` for display units (kW, kWh, hours, etc.)

### Select Dropdowns
- Use `question_type = 'select'` with `options` JSONB array
- Format: `[{"label": "Display Text", "value": "actual_value"}]`
- Use for: Bill ranges, equipment tiers, facility subtypes, BESS applications

### Boolean (Yes/No)
- Use `question_type = 'boolean'`
- Default: `'false'` for optional questions
- Use for: `wantsSolar`, `wantsEVCharging`, `needsBackupPower`, amenity flags

### Text Inputs
- Use `question_type = 'text'` for free-form text
- Use sparingly - prefer dropdowns or numbers

## UI Implementation

### Step 3 Component Changes Needed

The `Step3FacilityDetails.tsx` component should:

1. **Display standard questions (1-16)** - Always visible
2. **Show "Additional Details" collapsible section** - If `advancedQuestions.length > 0`
3. **Collapsed by default** - Advanced questions hidden initially
4. **Same design elements** - All questions use consistent styling:
   - Number inputs with sliders (if applicable)
   - Dropdowns for select fields
   - Yes/No buttons for boolean fields
   - Same card styling, spacing, and typography

### Filtering Logic

```typescript
const standardQuestions = customQuestions.filter(
  (q: any) => !q.is_advanced && !excludedFields.includes(q.field_name)
);

const advancedQuestions = customQuestions.filter(
  (q: any) => q.is_advanced === true && !excludedFields.includes(q.field_name)
);
```

## Verification

After running migrations, verify with:

```sql
-- Check question counts
SELECT 
    uc.slug,
    COUNT(CASE WHEN cq.is_advanced = false OR cq.is_advanced IS NULL THEN 1 END) as standard,
    COUNT(CASE WHEN cq.is_advanced = true THEN 1 END) as advanced,
    COUNT(cq.id) as total
FROM use_cases uc
LEFT JOIN custom_questions cq ON cq.use_case_id = uc.id
WHERE uc.is_active = true
GROUP BY uc.id, uc.slug
ORDER BY uc.slug;

-- All should show 16-18 standard questions
```

## Expected Results

- ✅ All use cases: 16-18 standard questions
- ✅ Data center & Hospital: 2-6 advanced questions (collapsible)
- ✅ Manufacturing & Warehouse: 18 total (2 advanced)
- ✅ Other 18-question use cases: 2 advanced questions
- ✅ All questions use consistent design elements
- ✅ All use cases have `primaryBESSApplication` question

