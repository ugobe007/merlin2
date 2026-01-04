# SSOT & TrueQuote Audit Guide

## Purpose

Find and fix all violations before testing to ensure:
1. **SSOT Compliance**: Database (user-provided values) is the Single Source of Truth
2. **TrueQuote Integration**: All foundational variables flow correctly to TrueQuote Engine
3. **Data Completeness**: All required fields are captured from users

## Running the Audit

```bash
npx tsx scripts/audit-ssot-truequote-violations.ts
```

## What It Checks

### 1. Missing Foundational Variables
- Verifies each industry has its critical foundational variables in database
- Example: Hotel must have `roomCount`

### 2. SSOT Violations
- Missing `default_value` for UI initialization (warning - not critical, but helpful)
- Foundational variables not marked as `is_required: true` (critical)
- Using defaults instead of user-provided values (code review needed)

### 3. TrueQuote Engine Mapping Violations
- Field names don't match TrueQuote Engine's `extractUnitCount` expectations
- Example: TrueQuote Engine looks for `['roomCount', 'rooms', 'numberOfRooms', 'numRooms']` for hotels

### 4. Field Name Compatibility
- Database field names match TrueQuote Engine field mappings
- Step5MagicFit mappings align with database fields

## TrueQuote Engine Field Mappings

From `TrueQuoteEngine.extractUnitCount()`:

| unitName | Expected Fields |
|----------|----------------|
| `rooms` | `roomCount`, `rooms`, `numberOfRooms`, `numRooms` |
| `racks` | `rackCount`, `racks`, `numberOfRacks` |
| `beds` | `bedCount`, `beds`, `numberOfBeds` |
| `bays` | `bayCount`, `bays`, `numberOfBays`, `washBays`, `tunnelCount` |

## Industry to unitName Mapping

| Industry | unitName | Expected Field |
|----------|----------|----------------|
| hotel | `rooms` | `roomCount` |
| hospital | `beds` | `bedCount` |
| data-center | `racks` | `rackCount` |
| car-wash | `bays` | `bayCount` or `tunnelCount` |

## Fixing Violations

### Critical Violations (Must Fix)

1. **Missing Foundational Variable**
   - Add question to database via migration
   - Mark as `is_required: true`
   - Add appropriate `default_value` for UI initialization

2. **Required Field Not Marked Required**
   - Update database: `UPDATE custom_questions SET is_required = true WHERE field_name = '...'`

3. **TrueQuote Engine Mapping Mismatch**
   - Ensure database field name matches one of the expected field names
   - Or update Step5MagicFit to map correctly

### Warnings (Should Fix)

1. **Missing default_value**
   - Add default for UI initialization (not SSOT - user values take precedence)
   - Helps users see a starting value in the form

2. **Field Not in Foundational Variables List**
   - Add to `FOUNDATIONAL_VARIABLES` in audit script
   - Ensures it's tracked as critical

## After Running Audit

1. **Review Results**
   - Fix all critical violations first
   - Address warnings

2. **Run Migration** (if needed)
   ```bash
   psql $DATABASE_URL -f database/migrations/20260102_add_missing_foundational_variables.sql
   ```

3. **Re-run Audit**
   ```bash
   npx tsx scripts/audit-ssot-truequote-violations.ts
   ```
   Should show 0 critical violations

4. **Test in Wizard**
   - Test each industry
   - Verify foundational variables appear
   - Verify values flow to TrueQuote Engine
   - Verify calculations are accurate

## Success Criteria

✅ All foundational variables exist in database  
✅ All foundational variables are `is_required: true`  
✅ All foundational variables have `default_value` for UI initialization  
✅ All TrueQuote Engine mappings are correct  
✅ 0 critical violations  
✅ 0 warnings (ideally)  
