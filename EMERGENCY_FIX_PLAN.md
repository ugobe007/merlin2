# Emergency Fix Plan - SmartWizard Not Working

## Problem
The wizard is loading OLD database questions ("Do you have solar?", "Do you have generators?") instead of showing the NEW configuration UI we built.

## Root Cause
Office Building has custom questions in the database that override the new Step 2 (Solar/EV Configuration) UI.

## Immediate Solution
Remove conflicting questions from database:

```sql
-- Remove solar/generator/EV questions from Office Building
DELETE FROM custom_questions 
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'office')
AND question_text ILIKE '%solar%';

DELETE FROM custom_questions 
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'office')
AND question_text ILIKE '%generator%';

DELETE FROM custom_questions 
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'office')
AND question_text ILIKE '%ev%';

DELETE FROM custom_questions 
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'office')
AND question_text ILIKE '%charging%';
```

## Expected Flow After Fix
1. Step 1: Only operational questions (building size, occupancy, etc.)
2. Step 2: NEW Solar/EV Configuration UI (toggles, sliders)
3. Step 3: Location
4. Step 4: Power Gap Resolution (with Accept Recommendation button)
5. Step 5: Quote
6. Step 6: Complete

## Why This Happened
We built NEW UI but database still has OLD questions. They conflict with each other.

## Permanent Solution
Move solar/EV/generator configuration OUT of custom_questions and INTO the wizard's built-in Step 2 UI for ALL use cases.
