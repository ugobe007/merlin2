# Step 1 Data Migration Scripts

**Created:** January 3, 2025  
**Purpose:** Database tables for Step 1 location input refactoring

---

## Migration Files

### 1. `20250103_create_zip_codes_table.sql`
Creates `zip_codes` table for US ZIP code lookups.

**Table:** `zip_codes`
- Stores ~42,000 US ZIP codes
- Maps ZIP → city, state
- Includes optional geocoding data (lat/long)

**To Populate:**
```bash
# Download USPS ZIP code database from:
# https://www.unitedstateszipcodes.org/zip-code-database/
# Then import CSV using:
psql -d your_database -c "COPY zip_codes FROM '/path/to/zip_code_database.csv' DELIMITER ',' CSV HEADER;"
```

---

### 2. `20250103_create_international_data_tables.sql`
Creates tables for international location data.

**Tables:**
- `international_countries` - Country-level data (rates, solar, currency)
- `international_cities` - City-level data (organized by tier/population)

**Estimated rows:**
- Countries: ~100-150
- Cities: ~1000-2000

**To Populate:**
Data should be imported from the Step 1 redesign file's `INTERNATIONAL_DATA` constant.
A data import script can be created to populate from the static data.

---

### 3. `20250103_create_solar_data_cache_table.sql`
Creates cache table for solar radiation API responses.

**Table:** `solar_data_cache`
- Caches NREL PVWatts / NASA POWER API responses
- Reduces API calls, improves performance
- Includes expiration timestamps

**Usage:**
- Cache expires after 30-90 days
- Call API → store in cache → reuse cached data
- Run `clean_expired_solar_cache()` function periodically

---

### 4. `20250103_create_utility_rates_view.sql`
Creates views for easy querying of utility rates.

**Views:**
- `utility_rates_summary` - Grouped by state (for dashboard)
- `utility_rates_detailed` - All rates (for detailed views)

**Dependencies:**
- Requires `utility_rates` table (already exists from `20251202_utility_rates_table.sql`)

---

## Execution Order

1. ✅ `20250103_create_zip_codes_table.sql`
2. ✅ `20250103_create_international_data_tables.sql`
3. ✅ `20250103_create_solar_data_cache_table.sql`
4. ✅ `20250103_create_utility_rates_view.sql`

All migrations are idempotent (safe to run multiple times).

---

## Verification Queries

```sql
-- Check ZIP codes table
SELECT COUNT(*) FROM zip_codes;

-- Check international data
SELECT COUNT(*) FROM international_countries;
SELECT COUNT(*) FROM international_cities;

-- Check solar cache
SELECT COUNT(*) FROM solar_data_cache;

-- Check utility rates view
SELECT * FROM utility_rates_summary ORDER BY avg_commercial_rate DESC LIMIT 10;
```

---

## Next Steps

1. Run all migrations
2. Populate `zip_codes` table from USPS data
3. Populate `international_countries` and `international_cities` from Step 1 redesign file
4. Update Step 1 components to use database queries instead of static data

