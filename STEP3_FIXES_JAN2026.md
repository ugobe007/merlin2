# Step 3 Questionnaire Critical Fixes - Jan 14, 2026

## Summary

Multiple critical bugs were found in the Step 3 questionnaire data capture that affected energy load calculations.

## Issues Fixed

### 1. ❌ CRITICAL: Question ID Not Matching Field Name

**Before:** `id: (dbQuestion.question_key || dbQuestion.field_name || ...)`
**After:** `id: (dbQuestion.field_name || dbQuestion.question_key || ...)`

**Impact:** Calculations look up values by field_name (e.g., `answers.bedCount`). If the ID was `question_key` instead, the calculation would fail to find the value.

### 2. ❌ CRITICAL: Slider Range Not Extracted from Database

**Before:** Range always defaulted to `min: 0, max: 1000, step: 1`

**After:** 
```typescript
const optionsObj = (!Array.isArray(dbOptions) && dbOptions) ? dbOptions : null;
const rangeMin = optionsObj?.min ?? dbQuestion.min_value ?? 0;
const rangeMax = optionsObj?.max ?? dbQuestion.max_value ?? 1000;
const rangeStep = optionsObj?.step ?? 1;
```

**Impact:** Database stores `options = '{"min":0,"max":500,"step":10,"suffix":" kW"}'` but sliders were ignoring this and using hardcoded defaults.

### 3. ❌ HIGH: Toggle Values Inconsistent

**Before:** Toggle could store `true`, `'true'`, `'yes'` - inconsistent
**After:** `onChange={(v) => onChange(Boolean(v))}`

**Impact:** Conditional logic like `if (hasExistingSolar === true)` would fail if value was `'true'` string.

### 4. ❌ MEDIUM: Missing Type Mappings

**Before:** `'text': 'buttons'` - wrong!
**After:** 
```typescript
'text': 'number_input',  // Most "text" in our DB are actually numeric
'number_input': 'number_input',
'yes_no': 'toggle',
```

### 5. ✅ Added Suffix Support

**Added:** `suffix?: string` property to Question interface
**Usage:** Sliders now display units (e.g., "500 kW", "10,000 sq ft")

### 6. ✅ Added Debug Logging

In development mode, you'll see console logs:
```
📝 Answer captured: bedCount = 200 (type: number)
📊 State updated with 5 answers: { bedCount: 200, squareFeet: 50000, ... }
```

## Files Modified

1. `src/components/wizard/CompleteStep3Component.tsx`
   - Fixed `transformDatabaseQuestion()` to extract range from options JSON
   - Fixed question ID to use field_name first
   - Added debug logging

2. `src/components/wizard/CompleteQuestionRenderer.tsx`
   - Fixed slider to use database range and suffix
   - Fixed toggle to always return boolean

3. `src/data/carwash-questions-complete.config.ts`
   - Added `suffix?: string` to Question interface

## Testing Required

1. Open a use case wizard (e.g., Hospital, Car Wash, Truck Stop)
2. Answer questions and check browser console for:
   - `📝 Answer captured` logs with correct field names
   - Values should be correct types (numbers, booleans)
3. Verify sliders show correct min/max ranges
4. Proceed to quote generation - verify energy calculations use the captured values

## Known Remaining Issues

1. Some database questions may still have wrong `question_type` values
2. Need to run the migration SQL to update question types
3. Some use cases may have duplicate questions (deduplication added)
