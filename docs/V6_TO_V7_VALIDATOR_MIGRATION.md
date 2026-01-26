# V6 → V7 Validator Migration (Jan 26, 2026)

## Problem Statement

WizardV6 had **3 competing validation systems** built at different times:

1. **Hardcoded Validator** (2024) - `validateStep3Contract.ts`
   - TypeScript logic checking specific fields per industry
   - Example: "Car wash MUST have `facility.bayCount` and `facility.operatingHours`"
   - **Problem:** Doesn't scale - requires code changes for every new industry

2. **Database-Driven Questionnaire** (Mid-2025) - `custom_questions` table
   - Questions loaded dynamically from database
   - Fields marked `is_required: true` in DB
   - **Problem:** Validator doesn't respect database schema

3. **Progressive Model Intelligence** (Jan 2026) - TrueQuote™ system
   - Infers values from user behavior
   - Can estimate load without asking every field
   - **Problem:** Validator still blocks even when model has high confidence

**Result:** User fills out questionnaire, but Continue button stays disabled because hardcoded validator expects different fields than database provides.

## Solution: Database-Driven Validator (V7 Architecture)

### New Files

1. **`src/services/validationSchemaService.ts`**
   - Fetches required fields from database
   - Caches schemas to avoid repeated queries
   - Provides `getIndustryValidationSchema(slug)` API

2. **`src/components/wizard/v6/step3/validateStep3Dynamic.ts`**
   - Database-driven validator
   - Only checks fields marked `is_required: true` in DB
   - Progressive model override: If `modelConfidence >= 75%`, bypass validation

### Migration Strategy

**Phase 1: Feature Flag (Current)**
- V6 (hardcoded) and V7 (database) validators coexist
- Toggle via `VITE_USE_DATABASE_VALIDATOR=true` environment variable
- Default: V6 (no breaking changes)

**Phase 2: Testing**
- Enable V7 in development: `VITE_USE_DATABASE_VALIDATOR=true npm run dev`
- Test all 21 active industries
- Verify Continue button enables when database says it should

**Phase 3: Rollout**
- Enable V7 in production (February 2026)
- Monitor for issues
- Keep V6 code as fallback

**Phase 4: Cleanup (V7 Official)**
- Remove `validateStep3Contract.ts` (old hardcoded validator)
- Remove feature flag
- `validateStep3Dynamic` becomes `validateStep3Contract`

## Key Differences

| Aspect | V6 (Hardcoded) | V7 (Database) |
|--------|----------------|---------------|
| **Required Fields** | Hardcoded in TypeScript | Loaded from `custom_questions.is_required` |
| **Industry Logic** | `industryNeeds()` function checks industry name | No hardcoded logic - all from DB |
| **Scalability** | Requires code changes for new industries | Scales infinitely - just add DB rows |
| **Progressive Model** | Ignores model confidence | Bypasses validation if confidence >= 75% |
| **Operating Hours** | Always required for ALL industries | Only required if DB says so |
| **Example Check** | `if (needs.needsBays) { check facility.bayCount }` | `for (field of schema.requiredFields) { check }` |

## Usage

### For Developers

**Enable V7 in local development:**
```bash
echo "VITE_USE_DATABASE_VALIDATOR=true" >> .env
npm run dev
```

**Check which validator is active:**
- Console will show: `📋 Step 3 Contract (V7 Database)` or `📋 Step 3 Contract (V6 Hardcoded)`

### For Database Changes

**To add a required field:**
```sql
INSERT INTO custom_questions (use_case_id, field_name, question_text, is_required, ...)
VALUES (..., 'newField', 'What is...?', true, ...);
```

Validator will automatically check it - no code changes needed!

**To make a field optional:**
```sql
UPDATE custom_questions 
SET is_required = false 
WHERE use_case_id = '...' AND field_name = 'oldField';
```

### Progressive Model Override

If `state.modelConfidence.score >= 75`, validator allows proceeding even with missing fields.

**Example:**
- User answers 3 questions
- Progressive model infers the other 5 with high confidence
- Validator: "Model is 85% confident → allow"
- User proceeds without answering all 8 questions

## Testing Checklist

- [ ] Enable V7: `VITE_USE_DATABASE_VALIDATOR=true`
- [ ] Test all 21 active industries
- [ ] Verify Continue button enables when ALL required fields answered
- [ ] Verify Progressive Model bypass works (high confidence → proceed)
- [ ] Verify missing required fields block Continue button
- [ ] Test edge cases:
  - [ ] Industry with no required fields (should pass immediately)
  - [ ] All fields optional (should pass with just location + industry + goal)
  - [ ] Field with min/max validation (e.g., `operatingHours` must be 1-24)

## Architecture Benefits

1. **Single Source of Truth:** Database is authority for validation
2. **No Code Changes:** Add/remove required fields via SQL, not TypeScript
3. **Progressive Enhancement:** Intelligence layer can override for better UX
4. **Scalability:** Supports 100+ industries without code bloat
5. **Testability:** Can test validation logic by changing DB, not recompiling

## Migration Timeline

- **Jan 26, 2026:** V7 created, feature flag added
- **Feb 2026:** Enable in production, monitor
- **Mar 2026:** Remove V6 code, V7 becomes default
- **Apr 2026:** Delete `validateStep3Contract.ts`, rename `validateStep3Dynamic` → `validateStep3Contract`

## Related Files

- `/src/services/validationSchemaService.ts` - Schema loader
- `/src/components/wizard/v6/step3/validateStep3Dynamic.ts` - New validator
- `/src/components/wizard/v6/step3/validateStep3Contract.ts` - Old validator (deprecated)
- `/src/components/wizard/v6/WizardV6.tsx` - Uses validator
- `/database/migrations/*` - Database schema definitions
