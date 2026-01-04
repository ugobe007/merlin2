# Foundational Variables Audit Plan

## Overview
Audit all industries to ensure foundational variables are:
1. ✅ Defined in database (`custom_questions` table)
2. ✅ Marked as `is_required: true`
3. ✅ Have appropriate `default_value`
4. ✅ Rendered in Step 3 UI
5. ✅ Synced to `useCaseData` state
6. ✅ Passed to TrueQuote Engine

## Tools Created

### 1. SQL Audit (`database/audit_foundational_variables.sql`)
Quick database verification:
```bash
psql $DATABASE_URL -f database/audit_foundational_variables.sql
```

### 2. TypeScript Audit (`scripts/audit-foundational-variables.ts`)
Comprehensive audit with detailed output:
```bash
npx tsx scripts/audit-foundational-variables.ts
```

### 3. Quick Hotel Check (`database/verify_roomcount_question.sql`)
Verify hotel roomCount specifically:
```bash
psql $DATABASE_URL -f database/verify_roomcount_question.sql
```

## Foundational Variables by Industry

| Industry | Primary Field(s) | Status | Notes |
|----------|------------------|--------|-------|
| Hotel | `roomCount` | ⏳ TO AUDIT | Fixed sync logic, need to verify DB |
| Car Wash | `bayCount`, `tunnelCount` | ⏳ TO AUDIT | |
| Data Center | `rackCount`, `itLoadKW` | ⏳ TO AUDIT | |
| Hospital | `bedCount` | ⏳ TO AUDIT | |
| EV Charging | `level2Count`, `dcFastCount`, `ultraFastCount` | ⏳ TO AUDIT | |
| Apartment | `unitCount` | ⏳ TO AUDIT | |
| Warehouse | `warehouseSqFt` | ⏳ TO AUDIT | |
| Manufacturing | `facilitySqFt` | ⏳ TO AUDIT | |
| Retail | `storeSqFt` | ⏳ TO AUDIT | |
| Office | `buildingSqFt` | ⏳ TO AUDIT | |

## Audit Checklist

For each industry:

- [ ] **Database**
  - [ ] Foundational field exists in `custom_questions`
  - [ ] Field marked as `is_required: true`
  - [ ] Has appropriate `default_value` (for UI initialization)
  - [ ] `display_order` is early (1-5)

- [ ] **Step 3 UI**
  - [ ] Field is rendered (Step3Details or industry-specific component)
  - [ ] Field is prominent/visible (not hidden in advanced section)
  - [ ] Field has appropriate input type (number, select, etc.)

- [ ] **State Management**
  - [ ] Default values initialized from database
  - [ ] Values synced to `useCaseData` state
  - [ ] Values persist when navigating between steps

- [ ] **TrueQuote Engine**
  - [ ] `mapWizardStateToTrueQuoteInput` maps field correctly
  - [ ] TrueQuote Engine receives field in `facilityData`
  - [ ] TrueQuote Engine calculates properly with field

## Next Steps

1. **Run Audit**
   ```bash
   npx tsx scripts/audit-foundational-variables.ts
   ```

2. **Review Results**
   - Identify missing fields
   - Identify fields missing `is_required: true`
   - Identify fields without `default_value`

3. **Fix Issues**
   - Add missing questions to database
   - Update existing questions (is_required, default_value)
   - Fix UI rendering if needed
   - Fix state syncing if needed

4. **Test**
   - Test each industry in wizard
   - Verify foundational variables are captured
   - Verify TrueQuote Engine receives them
   - Verify calculations are correct

5. **Documentation**
   - Update `FOUNDATIONAL_VARIABLES_BY_INDUSTRY.md` with results
   - Document any issues found
   - Document fixes applied

## Priority Order

Based on user feedback:
1. **Hotel** (roomCount) - Already fixed sync, verify DB ✅
2. **Car Wash** (bayCount/tunnelCount) - Similar to hotel
3. **Data Center** (rackCount/itLoadKW) - High-value industry
4. **Hospital** (bedCount) - Critical infrastructure
5. **EV Charging** (charger counts) - Growing industry
6. **Others** - Audit and fix as needed
