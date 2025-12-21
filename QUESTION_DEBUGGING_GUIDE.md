# Custom Questions Debugging Guide

## Overview
This document explains how to debug missing custom questions in the wizard Step 3.

## Question Loading Flow

1. **Industry Selection** (`handleIndustrySelect` in `useStreamlinedWizard.ts`)
   - Fetches questions from database using `useCaseService.getCustomQuestionsByUseCaseId(useCaseId)`
   - Stores in `wizardState.customQuestions`

2. **Database Query** (`useCaseService.ts`)
   - Queries `custom_questions` table filtered by `use_case_id`
   - Filters out inactive questions (`is_active = false`)
   - Orders by `display_order`

3. **Step 3 Display** (`Step3FacilityDetails.tsx`)
   - Filters out certain fields (grid/EV questions handled elsewhere)
   - Displays remaining questions

## Debugging Steps

### 1. Check Console Logs

When you select an industry, look for these console messages:

```
🎯 [handleIndustrySelect] Loaded X questions for [Industry Name]
```

**What to check:**
- Is the question count 0? → Questions not in database or wrong `useCaseId`
- Is the question count lower than expected? → Some questions might be inactive

### 2. Check Step 3 Debug Logs

When Step 3 loads, you'll see:

```
🔍 [Step3] Question Debug for [industry]:
  - totalInDatabase: X
  - excluded: Y (filtered out)
  - displayed: Z
```

**What to check:**
- `totalInDatabase` should match expected count
- `excluded` shows which questions are filtered (normal for grid/EV)
- `displayed` should match visible questions

### 3. Check Database Query Logs

Look for:

```
📋 [useCaseService] Fetched X active custom questions (out of Y total)
```

**What to check:**
- Are there inactive questions? → Check `is_active` flag in database
- Is `useCaseId` correct? → Verify in database

## Common Issues

### Issue: No Questions Loading

**Possible causes:**
1. Wrong `useCaseId` - check if industry has correct `useCaseId` in `use_cases` table
2. No questions in database - verify `custom_questions` table has rows for this `use_case_id`
3. Network error - check console for connection errors
4. All questions inactive - check `is_active` flag

**Fix:**
- Verify `useCaseId` matches between `use_cases` and `custom_questions` tables
- Check database connection
- Verify questions exist and are active

### Issue: Missing Specific Questions

**Possible causes:**
1. Questions filtered by `excludedFields` array
2. Questions marked as inactive in database
3. Questions not assigned to correct `use_case_id`

**Fix:**
- Check console logs for excluded field names
- Review `excludedFields` array in `Step3FacilityDetails.tsx`
- Verify question's `use_case_id` in database

## Excluded Fields (Normal)

These fields are intentionally excluded from Step 3 as they're handled elsewhere:

- Grid-related: `gridCapacityKW`, `gridSavingsGoal`, `gridImportLimit`, etc.
- EV-related: `hasEVCharging`, `evChargerCount`, `existingEVChargers`, etc.
- Solar-related: `existingSolarKW`, `wantsSolar`

## Verification Checklist

- [ ] Console shows questions loaded (count > 0)
- [ ] Step 3 debug log shows correct counts
- [ ] Database has questions for this `use_case_id`
- [ ] Questions have `is_active = true` (or null)
- [ ] Questions have correct `display_order`
- [ ] `useCaseId` matches between `use_cases` and `custom_questions`

## Database Query to Check Questions

```sql
SELECT 
  id,
  field_name,
  question_text,
  question_type,
  is_required,
  is_active,
  display_order,
  use_case_id
FROM custom_questions
WHERE use_case_id = '[YOUR_USE_CASE_ID]'
ORDER BY display_order;
```

Replace `[YOUR_USE_CASE_ID]` with the actual UUID from the `use_cases` table.

