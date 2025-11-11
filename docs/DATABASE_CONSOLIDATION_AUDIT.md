# Database Consolidation Audit & Cleanup Plan

**Date:** November 10, 2025  
**Priority:** CRITICAL - Prevents conflicts and performance issues

## Problem Discovered

You're absolutely right! The database structure has **OVERLAPPING and CONFLICTING** schemas that will cause bugs and confusion.

## Current Database Schemas (CONFLICTS FOUND)

### ❌ DUPLICATE: Pricing Configurations

**Schema 1:** `/docs/supabase_pricing_schema.sql` (OLD - 328 lines)
- Table: `pricing_configurations`
- Structure: Flat columns (bess_small_system_per_kwh, solar_utility_scale_per_watt, etc.)
- Created: Earlier version
- Used by: `supabaseClient.ts` (legacy methods)

**Schema 2:** `/docs/PRICING_CONFIG_SCHEMA.sql` (NEW - 200 lines)
- Table: `pricing_configurations` ⚠️ **SAME NAME!**
- Structure: JSONB config_data column
- Created: Today (November 10, 2025)
- Used by: `useCaseService.ts` (new methods), `databaseCalculations.ts`

**CONFLICT:** Both create a table named `pricing_configurations` with different structures!

### ✅ VALID: Use Case Schemas

**Schema:** `/docs/USE_CASE_SCHEMA.sql` (637 lines)
- Tables: `use_cases`, `use_case_configurations`, `equipment_templates`, etc.
- Created: November 9, 2025
- Used by: `useCaseService.ts`, Smart Wizard
- Status: ✅ ACTIVE and working

**Migration:** `/docs/USE_CASE_DATA_MIGRATION.sql`
- Populates initial use case data
- Status: ✅ Should be kept

### ✅ VALID: Main Schema

**Schema:** `/docs/SUPABASE_SCHEMA.sql` (403 lines)
- Tables: `user_profiles`, `saved_projects`, `vendors`, `rfqs`, etc.
- Includes: `calculation_cache`, `system_config`
- Status: ✅ Core tables, must keep

### ❓ QUESTIONABLE: Other Schemas

**Schema:** `/docs/industry_baselines_schema.sql`
- Purpose: Unknown without inspection
- Potential: Redundant with use_case tables

**Schema:** `/docs/VENDOR_PORTAL_SCHEMA.sql`
- Purpose: Vendor-specific tables
- Status: Check if already in SUPABASE_SCHEMA.sql

## Code References Audit

### Services Using Databases

1. **`useCaseService.ts`** (950 lines)
   - Uses: `use_cases`, `use_case_configurations`
   - Uses: `pricing_configurations` (NEW structure - JSONB)
   - Uses: `calculation_formulas` (NEW table)
   - Status: ✅ Points to correct new tables

2. **`supabaseClient.ts`** 
   - Uses: `pricing_configurations` (OLD structure - flat columns)
   - Methods: `getPricingConfiguration()`, `updatePricingConfiguration()`, etc.
   - Status: ⚠️ LEGACY - conflicts with new structure

3. **`databaseCalculations.ts`** (NEW - created today)
   - Uses: `pricing_configurations` (NEW structure via useCaseService)
   - Uses: `calculation_formulas` (NEW table via useCaseService)
   - Status: ✅ Correct

## Issues & Risks

### 🔴 CRITICAL Issues

1. **Table Name Collision**: Two different `pricing_configurations` schemas
2. **Migration Conflict**: Running both schemas will cause errors
3. **Data Inconsistency**: Old code uses flat columns, new code uses JSONB
4. **Code Confusion**: Developers won't know which structure to use

### 🟡 Medium Issues

5. **Orphaned Code**: `supabaseClient.ts` has methods for OLD pricing schema
6. **Redundant Files**: Multiple schema files doing similar things
7. **Documentation Debt**: No clear "master" schema file
8. **Migration Order**: Unclear which migrations to run first

### 🟢 Low Issues

9. **File Clutter**: 17 SQL files in /docs directory
10. **Naming Inconsistency**: Some use snake_case, some CAPS

## Recommended Solution: MERGE & CONSOLIDATE

### Step 1: Create Unified Master Schema

Merge all valid schemas into ONE master file:

**`/docs/MASTER_SCHEMA.sql`** (NEW - will contain):
1. Core tables from `SUPABASE_SCHEMA.sql`
2. Use case tables from `USE_CASE_SCHEMA.sql`
3. NEW pricing_configurations (JSONB structure from PRICING_CONFIG_SCHEMA.sql)
4. NEW calculation_formulas table
5. NEW market_pricing_data table

### Step 2: Remove Conflicts

**Delete these files** (redundant/conflicting):
- ❌ `/docs/supabase_pricing_schema.sql` (OLD flat structure)
- ❌ `/docs/industry_baselines_schema.sql` (check first - may be redundant)
- ❌ `/docs/PRICING_CONFIG_SCHEMA.sql` (merge into master)
- ❌ `/docs/RUN_MIGRATION.sql` (replace with comprehensive migration)

**Keep these files**:
- ✅ `/docs/MASTER_SCHEMA.sql` (NEW - comprehensive)
- ✅ `/docs/USE_CASE_DATA_MIGRATION.sql` (data population)
- ✅ `/docs/VENDOR_PORTAL_SCHEMA.sql` (if not in main schema)
- ✅ `/docs/customer_leads_migration.sql` (specific migration)

### Step 3: Update Code References

**Remove legacy methods from `supabaseClient.ts`**:
```typescript
// DELETE these OLD methods (they use flat pricing_configurations):
- getPricingConfiguration()
- updatePricingConfiguration()
- createPricingConfiguration()
- deletePricingConfiguration()
```

**All code should now use**:
- `useCaseService.getPricingConfig()` (JSONB structure)
- `useCaseService.updatePricingConfig()` (JSONB structure)
- `databaseCalculations.ts` functions

### Step 4: Clean Database

If you've already run conflicting migrations:

```sql
-- Check which pricing_configurations structure exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'pricing_configurations';

-- If OLD structure (flat columns), drop and recreate:
DROP TABLE IF EXISTS pricing_configurations CASCADE;
DROP TABLE IF EXISTS calculation_formulas CASCADE;
DROP TABLE IF EXISTS market_pricing_data CASCADE;

-- Then run master schema
```

## Consolidated File Structure (After Cleanup)

```
/docs/
  ├── MASTER_SCHEMA.sql ⭐ NEW - All table definitions
  ├── MASTER_MIGRATION.sql ⭐ NEW - One migration to rule them all
  ├── USE_CASE_DATA_MIGRATION.sql ✅ Data population
  ├── SINGLE_SOURCE_IMPLEMENTATION.md ✅ Documentation
  └── [ARCHIVE]/
      ├── supabase_pricing_schema.sql (OLD - for reference)
      ├── PRICING_CONFIG_SCHEMA.sql (merged into master)
      └── industry_baselines_schema.sql (check if needed)
```

## Migration Path

### For Fresh Databases

```sql
-- 1. Run master schema (creates all tables)
\i docs/MASTER_SCHEMA.sql

-- 2. Populate use case data
\i docs/USE_CASE_DATA_MIGRATION.sql

-- 3. Verify
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

### For Existing Databases

```sql
-- 1. Backup existing data
CREATE TABLE pricing_configurations_backup AS SELECT * FROM pricing_configurations;

-- 2. Check structure
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'pricing_configurations';

-- 3. If OLD structure (bess_small_system_per_kwh exists):
--    Drop and recreate with new structure

-- 4. If NEW structure (config_data JSONB exists):
--    You're good! Just run data migration if needed
```

## Action Items (Priority Order)

### 🔴 IMMEDIATE (Do First)

1. ✅ Audit complete (this document)
2. [ ] Create MASTER_SCHEMA.sql (merge all valid schemas)
3. [ ] Test master schema in fresh Supabase instance
4. [ ] Remove legacy pricing methods from supabaseClient.ts
5. [ ] Move old schemas to /docs/ARCHIVE/

### 🟡 SHORT TERM (This Week)

6. [ ] Create MASTER_MIGRATION.sql with proper drop/recreate logic
7. [ ] Update all documentation to reference master schema
8. [ ] Add schema version tracking
9. [ ] Create schema validation tests

### 🟢 LONG TERM (Next Sprint)

10. [ ] Add automated schema sync checks
11. [ ] Implement database versioning (migrations)
12. [ ] Create schema change review process
13. [ ] Document database architecture clearly

## Decision Matrix

| Keep or Remove? | File | Reason |
|----------------|------|--------|
| ✅ MERGE INTO MASTER | SUPABASE_SCHEMA.sql | Core tables |
| ✅ MERGE INTO MASTER | USE_CASE_SCHEMA.sql | Active use case system |
| ✅ MERGE INTO MASTER | PRICING_CONFIG_SCHEMA.sql | New pricing structure (JSONB) |
| ❌ ARCHIVE | supabase_pricing_schema.sql | OLD flat structure - conflicts |
| ❓ CHECK | industry_baselines_schema.sql | May be redundant with use_cases |
| ✅ KEEP SEPARATE | USE_CASE_DATA_MIGRATION.sql | Data population script |
| ✅ KEEP | VENDOR_PORTAL_SCHEMA.sql | If not in main schema |
| ❌ REMOVE | RUN_MIGRATION.sql | Replace with comprehensive version |
| ✅ KEEP | SINGLE_SOURCE_IMPLEMENTATION.md | Documentation |

## Testing Checklist

After consolidation:

- [ ] Fresh database: Run master schema - no errors
- [ ] All use case queries work
- [ ] Pricing configurations accessible via useCaseService
- [ ] Calculation formulas accessible
- [ ] Smart Wizard loads use cases
- [ ] Advanced Config calculates prices
- [ ] No "table does not exist" errors
- [ ] No duplicate table warnings
- [ ] All TypeScript compiles
- [ ] Browser console clean

## Questions to Answer

1. **Has `industry_baselines_schema.sql` been replaced by `use_cases` table?**
   - Need to check if it's still referenced
   
2. **Is VENDOR_PORTAL_SCHEMA.sql already in SUPABASE_SCHEMA.sql?**
   - Check for duplicate vendor table definitions

3. **Have you run any of these migrations in your live database?**
   - Determines if we need migration or fresh start

4. **What data currently exists in your database?**
   - Determines backup/migration strategy

## Immediate Next Step

**I recommend I now create the MASTER_SCHEMA.sql that merges everything correctly. Should I proceed?**

This will:
1. Combine all valid table definitions
2. Remove conflicts
3. Use correct structure (JSONB for pricing_configurations)
4. Add clear comments about table purposes
5. Proper ordering (dependencies first)

Say "yes" and I'll create the clean, consolidated master schema immediately.
