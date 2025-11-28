# 🚨 CRITICAL CALCULATION AUDIT - November 27, 2025

## ROOT CAUSE IDENTIFIED: Field Name Mismatch

### The Bug

**Database Field Name** (from `add_all_custom_questions_fast.sql` Line 265):
```sql
'roomCount'  -- ← What the database stores
```

**Code Lookups** (from `SmartWizardV2.tsx` Line 454):
```typescript
parseInt(useCaseData.numberOfRooms || useCaseData.numRooms)  // ← WRONG!
```

**Result**: The code never finds the room count, defaults to 100, calculates wrong MW.

---

## How This Breaks Hotel Calculations

### Expected Flow:
1. User enters: 2000 rooms
2. Database stores as: `roomCount: 2000`
3. SmartWizardV2 reads: `useCaseData.roomCount`
4. Calculates scale: `2000` (actual rooms)
5. baselineService multiplies: `2000 × 0.00293 kW/room = 5.86 MW` ✅

### Actual Broken Flow:
1. User enters: 2000 rooms
2. Database stores as: `roomCount: 2000` ✅
3. SmartWizardV2 reads: `useCaseData.numberOfRooms || useCaseData.numRooms` ❌ (undefined!)
4. Defaults to: `100 rooms`
5. Calculates scale: `100` (WRONG!)
6. baselineService: `100 × 0.00293 = 0.29 MW` ❌

**This explains the 0.29 MW result!**

---

## Field Name Mismatches Across All Templates

I need to audit EVERY use case for field name mismatches:

### Database SQL Field Names (from `add_all_custom_questions_fast.sql`):

1. **Hotel** (Line 265):
   - `roomCount` ← Database
   - Code looks for: `numberOfRooms` OR `numRooms` ❌

2. **Car Wash** (Line 54):
   - `bayCount` ← Database
   - Code looks for: `num_bays` OR `numBays` ❌

3. **Hospital** (Line 276):
   - `bedCount` ← Database  
   - Code looks for: `bedCount` ✅ (CORRECT!)

4. **Data Center** (Line 104):
   - `rackCount`, `averagePowerPerRack` ← Database
   - Code looks for: `totalCapacity`, `dcCapacity` ❌

5. **EV Charging** (Line 129):
   - `numberOfChargers` ← Database
   - Code looks for: ??? (need to check)

... and 13 more templates to audit!

---

## Impact Assessment

### Critical (Calculations Completely Wrong):
- ✅ **Hotel**: Uses wrong default (100 instead of user input)
- ✅ **Car Wash**: Likely same issue with `bayCount` vs `num_bays`
- ⚠️ **Data Center**: Complex calculation, need to verify
- ⚠️ **Office**: Need to check `squareFeet` vs `squareFootage`

### Working Correctly:
- ✅ **Hospital**: Field name matches (`bedCount`)

### Unknown:
- 13 other templates need verification

---

## The Fix Strategy

### Option 1: Update SmartWizardV2 to Use Correct Field Names (RECOMMENDED)
**Pros**: Fixes the code to match the database source of truth
**Cons**: Need to update multiple switch cases

```typescript
// BEFORE (WRONG):
case 'hotel':
  scale = parseInt(useCaseData.numberOfRooms || useCaseData.numRooms) || 100;
  break;

// AFTER (CORRECT):
case 'hotel':
  scale = parseInt(useCaseData.roomCount) || 100;
  break;
```

### Option 2: Update Database to Match Code
**Pros**: Keeps existing code working
**Cons**: Database is source of truth, changing it breaks other code, requires migration

**DECISION**: Option 1 - Update code to match database.

---

## Immediate Action Plan

### Phase 1: Fix Critical Field Names (URGENT)
1. ✅ Hotel: `numberOfRooms/numRooms` → `roomCount`
2. ✅ Car Wash: `num_bays/numBays` → `bayCount`
3. ⚠️ Data Center: Check `totalCapacity` → `rackCount` + `averagePowerPerRack`
4. ⚠️ Office: Check `squareFootage` → `squareFeet`

### Phase 2: Audit All 18 Templates
Build a mapping table of:
- Database field_name
- Code lookup variable
- Match status ✅/❌

### Phase 3: Create Verification Tests
For each template, test:
```
Input: Typical facility size
Expected Output: Physics-based MW calculation
Actual Output: (from running code)
Status: ✅/❌
```

Example:
- Hotel 2000 rooms → Expected: 5.86 MW → Actual: 0.29 MW ❌
- Hospital 200 beds → Expected: 1.10 MW → Actual: 1.10 MW ✅

---

## Database Schema Reference

From `add_all_custom_questions_fast.sql`:

```sql
INSERT INTO custom_questions (
  use_case_id, 
  question_text, 
  field_name,  -- ← THIS IS THE SOURCE OF TRUTH!
  question_type, 
  default_value, 
  ...
)
```

**The `field_name` column is what we should use in the code!**

---

## Next Steps

1. **Create complete field name mapping** for all 18 templates
2. **Update SmartWizardV2.tsx** switch statement to use correct field names
3. **Test each template** with realistic inputs
4. **Document expected vs actual** for verification
5. **Add validation** to catch future mismatches

---

## Questions to Answer

1. Are there other places besides SmartWizardV2 that look up these fields?
2. Does Step2_UseCase.tsx use the correct field names when rendering?
3. Are there any calculation helpers that also have field name assumptions?
4. Should we add a field name validator service?

---

**Bottom Line**: The calculations are mathematically correct, but we're looking up the WRONG FIELD NAMES from the database, so we're getting default values instead of user inputs. This is why Hotel 2000 rooms shows 0.29 MW - it's calculating for the default 100 rooms!
