# Apply EV Charging Database Fix

## How to Apply

Since we're using Supabase, you need to apply the SQL migration:

### Method 1: Supabase Dashboard (Recommended)
1. Go to https://fvmpmozybmtzjvikrctq.supabase.co/project/fvmpmozybmtzjvikrctq/sql
2. Create new query
3. Copy contents of `database/fix_ev_charging_questions.sql`
4. Click "Run"

### Method 2: psql (if you have connection string)
```bash
psql "postgresql://postgres:[password]@db.fvmpmozybmtzjvikrctq.supabase.co:5432/postgres" -f database/fix_ev_charging_questions.sql
```

### Method 3: Supabase CLI
```bash
supabase db push
```

## What This Does

1. ✅ Adds Level 1 charger question (1.4-1.9kW)
2. ✅ Updates Level 2 help text (now shows 19.2kW)
3. ✅ Moves charger questions to top (display_order 0, 1, 2)
4. ✅ Adds grid connection dropdown
5. ✅ Adds grid capacity input (conditional on "limited")
6. ✅ Adds peak concurrency factor

## Verification

After running, check in Supabase:
```sql
SELECT field_name, question_text, display_order, help_text
FROM custom_questions
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'ev-charging')
ORDER BY display_order;
```

Should show:
```
field_name                  | display_order | help_text
---------------------------|--------------|----------------------------------
numberOfLevel1Chargers     | 0            | Level 1 chargers (1.4-1.9kW...)
numberOfLevel2Chargers     | 1            | Level 2 chargers (7-19.2kW...)
numberOfDCFastChargers     | 2            | DC fast chargers (50-350kW...)
gridConnection             | 3            | Grid reliability affects...
gridCapacity               | 4            | Maximum power available...
peakConcurrency            | 5            | Percentage of chargers...
```
