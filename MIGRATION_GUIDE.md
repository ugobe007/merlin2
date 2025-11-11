# Database Migration Guide: MASTER_SCHEMA Deployment

## Overview
This guide documents the process of migrating from the fragmented database structure to the unified MASTER_SCHEMA.sql database architecture.

**Status**: Ready for deployment  
**Date**: November 2025  
**Impact**: High - Replaces multiple conflicting schemas with single source of truth

---

## Pre-Migration Checklist

### ✅ Completed Cleanup Tasks
1. **Archived Conflicting Services**
   - `src/services/pricingDatabaseService.ts` → `ARCHIVE/pricingDatabaseService.ts.old`
   - `src/services/dailySyncService.ts` → `ARCHIVE/dailySyncService.ts.old` (replaced with stub)
   
2. **Archived Conflicting Schemas**
   - `docs/supabase_pricing_schema.sql` → `ARCHIVE/supabase_pricing_schema.sql.old` (OLD flat columns)
   - `docs/PRICING_CONFIG_SCHEMA.sql` → `ARCHIVE/PRICING_CONFIG_SCHEMA.sql.old` (merged into MASTER)

3. **Deprecated Legacy Code**
   - `supabaseClient.ts`: PricingClient class methods now show deprecation warnings
   - `PricingAdminDashboard.tsx`: 10 pricingDatabaseService calls commented out with migration TODOs
   - `equipmentCalculations.ts`: 4 pricingConfigService calls replaced with temporary fallbacks
   - `advancedFinancialModeling.ts`: Marked as "migration in progress"

4. **Compilation Tests**
   - ✅ TypeScript compilation successful (`npm run build`)
   - ✅ Fixed syntax errors in BessQuoteBuilder and PricingAdminDashboard
   - ✅ Created stub dailySyncService for compatibility

---

## Database Architecture Changes

### OLD Structure (Conflicting)
```
❌ pricing_configurations (flat columns)
   - bess_small_system_per_kwh: numeric
   - bess_medium_system_per_kwh: numeric
   - generator_diesel_per_kw: numeric
   - [50+ individual columns]

❌ Multiple schema files
   - SUPABASE_SCHEMA.sql (core tables)
   - USE_CASE_SCHEMA.sql (use case specific)
   - PRICING_CONFIG_SCHEMA.sql (pricing only)
```

### NEW Structure (Unified)
```
✅ pricing_configurations (JSONB)
   - config_data: JSONB (flexible structure)
   - name: text
   - is_active: boolean
   - Single row can store entire configuration

✅ Single MASTER_SCHEMA.sql
   - 1000+ lines
   - All tables consolidated
   - Comprehensive indexes
   - Row-level security policies
```

---

## Step-by-Step Deployment

### Step 1: Backup Current Database
```sql
-- Export current pricing_configurations (if exists)
COPY pricing_configurations TO '/tmp/pricing_backup.csv' WITH CSV HEADER;

-- Export use_cases
COPY use_cases TO '/tmp/use_cases_backup.csv' WITH CSV HEADER;

-- Export all critical data
COPY projects TO '/tmp/projects_backup.csv' WITH CSV HEADER;
```

### Step 2: Deploy MASTER_SCHEMA.sql

**Option A: Fresh Database (Recommended for Testing)**
```bash
# Connect to Supabase SQL Editor
# Copy entire contents of docs/MASTER_SCHEMA.sql
# Execute in SQL Editor
```

**Option B: Existing Database (Production)**
```sql
-- 1. Drop old conflicting tables (⚠️ DESTRUCTIVE)
DROP TABLE IF EXISTS pricing_configurations CASCADE;
DROP TABLE IF EXISTS use_cases CASCADE;

-- 2. Run MASTER_SCHEMA.sql
-- This will create:
-- - All tables with new structure
-- - All indexes
-- - All RLS policies
-- - All functions/triggers
```

### Step 3: Data Migration

#### Migrate Pricing Configuration
```sql
-- Insert default pricing configuration with JSONB structure
INSERT INTO pricing_configurations (
  name,
  config_data,
  is_active,
  created_by
) VALUES (
  'Default Configuration',
  '{
    "bess": {
      "small_system_per_kwh": 140,
      "medium_system_per_kwh": 130,
      "large_system_per_kwh": 120
    },
    "generators": {
      "diesel_per_kw": 800,
      "natural_gas_per_kw": 700
    },
    "solar": {
      "utility_scale_per_watt": 0.65,
      "commercial_per_watt": 0.85
    },
    "balanceOfPlant": {
      "bopPercentage": 0.12,
      "epcPercentage": 0.15,
      "contingencyPercentage": 0.05
    },
    "evCharging": {
      "level2ACPerUnit": 8000,
      "dcFastPerUnit": 45000,
      "dcUltraFastPerUnit": 125000
    }
  }'::jsonb,
  true,
  'admin'
);
```

#### Migrate Use Cases (if they exist)
```sql
-- Example: Migrate existing use cases to new structure
-- Adjust based on your current data
INSERT INTO use_cases (
  user_id,
  name,
  industry,
  description,
  configuration
) SELECT
  user_id,
  name,
  industry,
  description,
  row_to_json(old_use_cases.*)::jsonb as configuration
FROM old_use_cases;
```

### Step 4: Verify Migration

```sql
-- Check pricing_configurations
SELECT 
  id, 
  name, 
  is_active,
  jsonb_pretty(config_data) as config
FROM pricing_configurations;

-- Check use_cases
SELECT 
  id,
  name,
  industry,
  created_at
FROM use_cases
ORDER BY created_at DESC
LIMIT 10;

-- Check indexes
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('pricing_configurations', 'use_cases', 'calculation_formulas')
ORDER BY tablename, indexname;
```

### Step 5: Update Application Code

#### Complete These Migrations (Marked as TODO in code)

**PricingAdminDashboard.tsx**
- Replace all commented-out `pricingDatabaseService` calls
- Use `useCaseService.getPricingConfig()` instead
- Update state management to work with JSONB config_data

**equipmentCalculations.ts**
- Make function async
- Replace hardcoded fallbacks with actual database calls
- Use `await useCaseService.getPricingConfig()` 

**advancedFinancialModeling.ts**
- Complete migration from pricingConfigService
- Use database-backed calculations throughout

**Daily Sync Service** (Currently Stubbed)
- Complete rewrite using useCaseService
- Remove archived dependencies
- Implement new sync logic for JSONB structure

---

## Service Usage Patterns

### OLD Pattern (Deprecated)
```typescript
// ❌ Don't use these anymore
import { pricingDatabaseService } from './pricingDatabaseService'; // ARCHIVED
import { pricingClient } from './supabaseClient'; // DEPRECATED
import { pricingConfigService } from './pricingConfigService'; // HARDCODED

const price = pricingConfigService.getBESSCostPerKWh(100); // Hardcoded
```

### NEW Pattern (Database-Backed)
```typescript
// ✅ Use these instead
import { useCaseService } from '../services/useCaseService';

// Get pricing configuration from database
const config = await useCaseService.getPricingConfig();
const bessPricing = config.bess;
const price = bessPricing.large_system_per_kwh; // From database

// Or use the calculation service (wraps useCaseService)
import { calculateBESSPricing } from '../services/databaseCalculations';
const result = await calculateBESSPricing(powerMW, durationHours);
```

---

## Testing Checklist

After deployment, verify:

- [ ] **Database Connection**
  ```typescript
  const config = await useCaseService.getPricingConfig();
  console.log('Config loaded:', config);
  ```

- [ ] **Quote Calculations**
  - Open BessQuoteBuilder
  - Create a quote with 10MW/40MWh
  - Verify pricing matches database values
  - Check calculation breakdown

- [ ] **Admin Panel**
  - Open Admin Dashboard (Vendor Manager)
  - View pricing configurations
  - Attempt to update configuration
  - Verify JSONB structure displays correctly

- [ ] **Use Case Templates**
  - Create new use case
  - Apply template
  - Verify pricing formulas work
  - Check ROI calculations

---

## Rollback Plan

If migration fails:

### Option 1: Restore from Backup
```bash
# Restore tables from CSV backups
psql -h <host> -U <user> -d <database> -c "COPY pricing_configurations FROM '/tmp/pricing_backup.csv' WITH CSV HEADER;"
```

### Option 2: Keep Both Schemas (Temporary)
```sql
-- Rename new tables to avoid conflict
ALTER TABLE pricing_configurations RENAME TO pricing_configurations_new;

-- Restore old table
-- (restore from backup)

-- Application can use old table while debugging
```

---

## Known Issues & Limitations

### Current State
1. **PricingAdminDashboard** - Currently displays deprecation warnings, database sync disabled
2. **equipmentCalculations.ts** - Using temporary hardcoded fallbacks
3. **dailySyncService** - Completely stubbed, non-functional
4. **pricingConfigService** - Still in use, needs gradual migration

### Post-Migration TODO
1. Rewrite PricingAdminDashboard UI for JSONB editing
2. Make equipmentCalculations async and use database
3. Rebuild dailySyncService for new schema
4. Phase out pricingConfigService completely

---

## Support & Troubleshooting

### Common Errors

**"Cannot find pricingDatabaseService"**
- Cause: Import not removed
- Fix: Replace with `useCaseService`

**"PricingClient methods are deprecated"**
- Cause: Using old supabaseClient methods
- Fix: Use `useCaseService` instead

**"Configuration not found in database"**
- Cause: No pricing_configurations row
- Fix: Run Step 3 SQL insert

**"JSONB structure incorrect"**
- Cause: Missing nested keys in config_data
- Fix: Verify JSONB matches template in Step 3

---

## Files Modified During Cleanup

### Archived Files
```
src/services/ARCHIVE/
├── pricingDatabaseService.ts.old
└── dailySyncService.ts.old

docs/ARCHIVE/
├── supabase_pricing_schema.sql.old
└── PRICING_CONFIG_SCHEMA.sql.old
```

### Updated Files
```
src/components/
├── BessQuoteBuilder.tsx (removed unused imports)
└── PricingAdminDashboard.tsx (commented out 10 calls)

src/services/
├── supabaseClient.ts (added deprecation warnings)
├── advancedFinancialModeling.ts (migration notice)
└── dailySyncService.ts (replaced with stub)

src/utils/
└── equipmentCalculations.ts (4 calls replaced with fallbacks)
```

---

## Next Steps

1. **Deploy MASTER_SCHEMA.sql** to Supabase (Steps 1-3)
2. **Verify database** with test queries (Step 4)
3. **Complete code migrations** (PricingAdminDashboard, equipmentCalculations)
4. **Test thoroughly** using checklist above
5. **Monitor deprecation warnings** in console
6. **Plan dailySyncService rewrite** for continuous sync

---

## References

- **MASTER_SCHEMA.sql**: `/Users/robertchristopher/merlin2/docs/MASTER_SCHEMA.sql`
- **useCaseService**: `/Users/robertchristopher/merlin2/src/services/useCaseService.ts`
- **databaseCalculations**: `/Users/robertchristopher/merlin2/src/services/databaseCalculations.ts`
- **Database Audit**: `DATABASE_CONSOLIDATION_AUDIT.md` (if exists)

---

**Document Version**: 1.0  
**Last Updated**: November 2025  
**Status**: ✅ Ready for Deployment
