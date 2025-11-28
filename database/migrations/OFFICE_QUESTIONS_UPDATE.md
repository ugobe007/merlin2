# Office Building Questions Update

**Date:** November 25, 2025  
**Status:** Ready to Apply ✅

## What Changed

The Office Building use case questions have been completely redesigned based on your feedback to focus on essential decision-making factors without overwhelming users.

## Question Structure (14 Total)

### 0. Building Type Classification (FIRST)
- **Building type** - Corporate, Medical, Research, Co-work, Mixed-Use, or General
  - Affects energy patterns and critical load requirements
  - Examples given for each type

### 1. Building Profile (2 questions)
- **Square footage** - Determines baseline energy needs
- **Operating hours** - Daily occupancy patterns

### 2. Energy Usage (2 questions)
- **Monthly electric bill** - Real-world cost baseline
- **Peak demand (optional)** - If customer knows it from utility bill
- **Utility rate structure** - Demand charges, TOU, both, or standard

### 3. Backup Power Needs (2 questions)
- **Critical loads** - What must stay on? (Basic/Partial/Full/Data Critical)
- **Backup duration** - Hours needed (1-24, typical 4)

### 4. Existing Systems (4 questions)
- **Has solar?** - Boolean check
- **Solar size** - Conditional, only if yes
- **Has generator?** - Boolean check  
- **Generator size** - Conditional, only if yes

### 5. Primary Goals (1 question)
- **Top priorities** - Multi-select ranking (cost, backup, sustainability, independence, demand mgmt)

### 6. Installation Constraints (1 question)
- **Available space** - Indoor electrical room, outdoor, rooftop, parking, limited

## Database Impact

All questions are configured with:
- ✅ Proper `impact_type` (factor, multiplier, override, additionalLoad, none)
- ✅ Validation rules (min/max values where appropriate)
- ✅ Help text for user guidance
- ✅ Required vs optional flags
- ✅ Display order for logical flow
- ✅ Conditional rendering (solar/generator details only if applicable)
- ✅ **Building type classification** to tailor recommendations

## How to Apply

### Option 1: Supabase SQL Editor (Recommended)
1. Go to your Supabase Dashboard → SQL Editor
2. Copy contents of `database/migrations/update_office_questions.sql`
3. Run the SQL
4. Verify: Should see **14 rows inserted**

### Option 2: Command Line (if psql configured)
```bash
psql $DATABASE_URL -f database/migrations/update_office_questions.sql
```

### Option 3: Helper Script
```bash
./database/migrations/apply_office_update.sh
```

## Testing After Application

1. **Restart dev server** (if running)
2. **Open Smart Wizard**
3. **Select "Office Building"** use case
4. **Verify questions appear** in correct order
5. **Test conditional logic** (solar/generator fields only show when enabled)

## Expected User Experience

**Old:** Generic questions that didn't capture office-specific needs  
**New:** Streamlined questionnaire focused on:
- Real-world costs (monthly bill vs. complex rate structures)
- Practical backup needs (what stays on + how long)
- Existing infrastructure (solar/generators)
- Clear goals (cost vs. resilience vs. sustainability)
- Installation feasibility (space availability)

## Impact Calculation Mapping

Questions directly affect these baseline calculations:

| Question | Impact Field | Impact Type | Purpose |
|----------|-------------|-------------|---------|
| **Building Type** | `storageSizeMW` | factor | **Adjusts baseline for medical/research/mixed-use** |
| Square Footage | `storageSizeMW` | factor | Base sizing |
| Operating Hours | `durationHours` | factor | Duration calc |
| Monthly Bill | `electricityRate` | multiplier | Cost baseline |
| Peak Demand | `storageSizeMW` | override | Direct override if known |
| Rate Type | `electricityRate` | factor | Savings multiplier |
| Critical Loads | `storageSizeMW` | factor | Capacity adjustment |
| Backup Hours | `durationHours` | override | Duration override |
| Solar Size | `solarMW` | additionalLoad | Add solar capacity |
| Generator Size | `generatorMW` | additionalLoad | Add generator capacity |
| Primary Goals | `storageSizeMW` | factor | Design optimization |
| Install Space | - | none | For quote/proposal only |

## Files Modified

- ✅ `database/migrations/update_office_questions.sql` - Migration script
- ✅ `database/migrations/apply_office_update.sh` - Helper script
- ✅ This README

## Next Steps

1. Apply migration to database
2. Test in Smart Wizard
3. If questions work well, consider applying same pattern to other use cases:
   - Hotel & Hospitality
   - Retail & Commercial
   - Manufacturing
   - Data Center

## Notes

- **Building type question comes FIRST** to set context for entire questionnaire
- Building type multipliers:
  - **Medical Office**: Higher capacity factor (critical loads, 24/7 potential)
  - **Research/Lab**: Higher energy density (equipment-intensive)
  - **Mixed-Use**: Variable loads (retail hours + residential/office patterns)
  - **Co-work**: Lower capacity factor (shared spaces, variable occupancy)
  - **Corporate Campus**: Moderate loads (predictable office patterns)
  - **General Office**: Standard baseline
- Questions use `question_key` field for API responses (e.g., `buildingType`, `squareFootage`, `backupHours`)
- All numeric fields have sensible min/max validation
- Boolean questions (hasSolar, hasGenerator) trigger conditional follow-up questions
- Help text provides context without overwhelming users
- Display order ensures logical flow through questionnaire

---

**Ready to deploy!** 🚀
