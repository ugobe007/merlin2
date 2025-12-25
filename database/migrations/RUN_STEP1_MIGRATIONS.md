# Run Step 1 Data Migrations

**Created:** January 3, 2025  
**Status:** Ready to Execute

---

## Quick Start

### Option 1: Combined File (Recommended) ✅

1. Open Supabase Dashboard → **SQL Editor**
2. Click **New Query**
3. Copy entire contents of: `20250103_step1_data_migrations_combined.sql`
4. Paste into SQL Editor
5. Click **Run** (▶️ button)
6. Verify "Success" message

**This creates all 4 tables/views in one go.**

---

### Option 2: Individual Files

Run these files **in order** via Supabase SQL Editor:

1. `20250103_create_zip_codes_table.sql`
2. `20250103_create_international_data_tables.sql`
3. `20250103_create_solar_data_cache_table.sql`
4. `20250103_create_utility_rates_view.sql`

---

## What Gets Created

### Tables:
- ✅ `zip_codes` - US ZIP code lookups (~42,000 rows to import)
- ✅ `international_countries` - Country data (100-150 rows to import)
- ✅ `international_cities` - City data (1000-2000 rows to import)
- ✅ `solar_data_cache` - API response cache (populated by API calls)

### Views:
- ✅ `utility_rates_summary` - State-level rate summaries (for dashboard)
- ✅ `utility_rates_detailed` - All utility rates (for detailed views)

**Note:** The `utility_rates` table should already exist from `20251202_utility_rates_table.sql`. If not, run that migration first.

---

## Verification

After running migrations, verify tables exist:

```sql
-- Check all tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('zip_codes', 'international_countries', 'international_cities', 'solar_data_cache')
ORDER BY table_name;

-- Check views were created
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public' 
  AND table_name IN ('utility_rates_summary', 'utility_rates_detailed')
ORDER BY table_name;

-- Test utility rates view (if utility_rates table exists)
SELECT * FROM utility_rates_summary ORDER BY avg_commercial_rate DESC LIMIT 10;
```

---

## Next Steps (After Migrations)

1. **Populate ZIP Codes:**
   - Download USPS ZIP code database
   - Import CSV to `zip_codes` table

2. **Populate International Data:**
   - Import country/city data from Step 1 redesign file
   - Create import script from `INTERNATIONAL_DATA` constant

3. **Test Dashboard:**
   - Navigate to Pricing System Health Dashboard
   - Verify "Utility Rates by State" section displays correctly

---

## Troubleshooting

### Error: "relation utility_rates does not exist"
**Solution:** Run `20251202_utility_rates_table.sql` first to create the base table.

### Error: "relation already exists"
**Status:** ✅ Safe to ignore - migrations are idempotent. Table/view already exists.

### Views return no data
**Status:** ✅ Expected - Views depend on `utility_rates` table being populated. Populate that table first.

---

## Files Ready to Execute

All SQL files are in: `database/migrations/`

- ✅ `20250103_step1_data_migrations_combined.sql` (recommended)
- ✅ `20250103_create_zip_codes_table.sql`
- ✅ `20250103_create_international_data_tables.sql`
- ✅ `20250103_create_solar_data_cache_table.sql`
- ✅ `20250103_create_utility_rates_view.sql`

