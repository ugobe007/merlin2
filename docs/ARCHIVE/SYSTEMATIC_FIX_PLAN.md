# Systematic Fix Plan - SmartWizard Architecture
**Date:** November 25, 2025

## Problem Statement
SmartWizard has architectural inconsistencies between:
- Hardcoded templates (`useCaseTemplates.ts`)
- Database-driven questions (`custom_questions` table)
- Validation logic (checking for fields that don't exist)

## Root Causes
1. **Incomplete database migration** - Office questions in DB don't match hardcoded template structure
2. **Field name mismatches** - Validation expects `facilitySize` + `gridConnection`, DB has `buildingType` + `utilityRateType`
3. **Dual architecture** - Some use cases load from database, others from hardcoded templates
4. **Question misalignment** - `utilityRateType` asks about BILLING, not GRID QUALITY

## Systematic Solution (Fixes ALL Use Cases)

### Phase 1: Standardize Grid Question Across ALL Use Cases
**Impact:** Hotel, Data Center, EV Charging, Manufacturing, etc.

**Action:** Replace `utilityRateType` with proper `gridConnection` question in database

```sql
-- This fixes EVERY use case that uses custom_questions
UPDATE custom_questions 
SET 
  field_name = 'gridConnection',
  question_text = 'Grid connection quality',
  question_type = 'select',
  options = '[
    {"value": "reliable", "label": "Reliable Grid - Stable power, rare outages"},
    {"value": "unreliable", "label": "Unreliable Grid - Frequent outages, needs backup"},
    {"value": "limited", "label": "Limited Capacity - Grid undersized, may need microgrid"},
    {"value": "off_grid", "label": "Off-Grid - No utility connection, full microgrid needed"},
    {"value": "microgrid", "label": "Microgrid - Independent power system with grid backup"}
  ]'::jsonb,
  help_text = 'Grid quality determines backup power needs and solar/battery sizing'
WHERE field_name = 'utilityRateType';
```

**Why This Works:**
- ✅ Single update fixes ALL use cases
- ✅ Matches hardcoded template structure
- ✅ PowerMeter can properly show RED/GREEN based on grid quality
- ✅ Validation logic can check for `gridConnection` consistently

### Phase 2: Update Validation Logic
**Impact:** All use case types

**Action:** Make validation DYNAMIC based on actual questions returned from database

```typescript
// Instead of hardcoded field checks:
const hasFacilitySize = useCaseData.facilitySize !== undefined; // ❌ BREAKS

// Use dynamic validation:
const requiredFields = useCaseConfig.questions
  .filter(q => q.required)
  .map(q => q.id);
const allRequiredFilled = requiredFields.every(field => 
  useCaseData[field] !== undefined && useCaseData[field] !== ''
);
```

**Why This Works:**
- ✅ Works for ANY use case with ANY questions
- ✅ No hardcoded field names
- ✅ Automatically adapts when database questions change
- ✅ Future-proof for new use cases

### Phase 3: PowerMeter Integration
**Status:** Already complete! PowerMeterWidget exists and works.

**What It Needs:**
```typescript
<PowerMeterWidget
  peakDemandMW={baselineResult?.peakDemandMW || 0}
  totalGenerationMW={solarMW + windMW + generatorMW}
  gridAvailableMW={baselineResult?.gridCapacity || 0}
  gridConnection={useCaseData.gridConnection} // ← Now from database!
  compact={true}
/>
```

**Grid Connection Logic:**
- `reliable` → GREEN (grid available, just need batteries for savings)
- `unreliable` → ORANGE (grid unstable, need backup)
- `limited` → YELLOW (grid undersized, may need generation)
- `off_grid` → RED (no grid, MUST have solar/wind/generator)
- `microgrid` → BLUE (independent system with optional grid tie)

## Implementation Order

### 1. Database Migration (5 min)
```sql
-- Fix office questions (add gridConnection)
-- Update ALL use cases that have utilityRateType
```

### 2. Validation Refactor (10 min)
```typescript
// Make validation dynamic, not hardcoded
// Works for office, hotel, data center, EV, etc.
```

### 3. Test & Verify (5 min)
```bash
npm run build
# Test office building flow
# Verify Next button works
# Confirm PowerMeter shows correct color
```

## Benefits of This Approach

### ✅ **Fixes Current Bugs**
- Next button works (validation checks actual fields)
- PowerMeter shows correct status
- No more hardcoded field mismatches

### ✅ **Scales to All Use Cases**
- Hotel, Data Center, EV Charging all work the same way
- Add new use case? Just add database questions
- No code changes needed for new industries

### ✅ **Maintainable Architecture**
- Single source of truth (database)
- Dynamic validation
- Consistent UX across all templates

### ✅ **Future-Proof**
- Add/remove questions without code changes
- Validation automatically adapts
- PowerMeter works for any grid scenario

## What NOT To Do (Avoids Spaghetti Code)

❌ **Don't** hardcode specific field names in validation
❌ **Don't** have different validation logic per use case
❌ **Don't** mix database questions with hardcoded templates
❌ **Don't** create separate components for each industry
❌ **Don't** add band-aid fixes that only work for one use case

✅ **Do** use database-driven questions
✅ **Do** validate dynamically based on `required` flag
✅ **Do** use consistent `gridConnection` field name everywhere
✅ **Do** make PowerMeter work off standard field names

## Next Steps

1. Create comprehensive database migration
2. Refactor validation to be dynamic
3. Test with multiple use cases (office, hotel, data center)
4. Document the pattern for future use cases

---

**Philosophy:** Fix the architecture, not the symptoms. One change should fix all use cases.
