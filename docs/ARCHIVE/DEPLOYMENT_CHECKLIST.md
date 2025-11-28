# 🚀 MASTER_SCHEMA Deployment Checklist

## Overview
This checklist guides you through deploying the unified MASTER_SCHEMA.sql to your Supabase database.

**Project**: Merlin Energy BESS Quote Builder  
**Database**: Supabase (fvmpmozybmtzjvikrctq.supabase.co)  
**Status**: Ready for deployment  
**Estimated Time**: 15-20 minutes

---

## ⚠️ PRE-DEPLOYMENT CHECKLIST

### 1. Verify Environment
- [ ] Supabase project accessible at: https://fvmpmozybmtzjvikrctq.supabase.co
- [ ] You have SQL Editor access in Supabase Dashboard
- [ ] You can execute SQL scripts
- [ ] You have reviewed MASTER_SCHEMA.sql (1000+ lines)

### 2. Review Files
- [ ] `docs/MASTER_SCHEMA.sql` - The new unified schema
- [ ] `docs/BACKUP_BEFORE_MIGRATION.sql` - Backup script
- [ ] `docs/SEED_INITIAL_DATA.sql` - Initial data population
- [ ] `MIGRATION_GUIDE.md` - Complete migration documentation

### 3. Communication
- [ ] Notify team members about planned deployment
- [ ] Schedule deployment during low-usage window (if applicable)
- [ ] Have rollback plan ready

---

## 📋 DEPLOYMENT STEPS

### STEP 1: Backup Current Database (5 min)

1. Open Supabase Dashboard
   ```
   https://app.supabase.com/project/fvmpmozybmtzjvikrctq
   ```

2. Navigate to SQL Editor

3. Copy contents of `docs/BACKUP_BEFORE_MIGRATION.sql`

4. Execute the backup script

5. Verify backup creation:
   ```sql
   SELECT * FROM backup_nov2025.pricing_configurations_old LIMIT 5;
   ```

6. ✅ **Checkpoint**: Confirm backups exist before proceeding

---

### STEP 2: Deploy MASTER_SCHEMA.sql (10 min)

1. Open a new SQL Editor query

2. Copy the ENTIRE contents of `docs/MASTER_SCHEMA.sql`
   - File location: `/Users/robertchristopher/merlin2/docs/MASTER_SCHEMA.sql`
   - Size: ~1000 lines

3. **IMPORTANT**: Review the script before execution
   - It will DROP existing tables
   - It will create new tables with JSONB structure
   - It will add indexes and RLS policies

4. Execute the script

5. Wait for completion (should take 1-2 minutes)

6. Check for errors in the output

7. ✅ **Checkpoint**: Verify all tables created successfully

---

### STEP 3: Verify Schema Deployment (2 min)

Run these verification queries:

```sql
-- Check that all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Should see:
-- - calculation_formulas
-- - market_pricing_data
-- - pricing_configurations
-- - projects
-- - use_cases
-- - user_profiles
-- - vendors
-- (and others)

-- Check pricing_configurations structure (JSONB)
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'pricing_configurations'
ORDER BY ordinal_position;

-- Should see config_data as 'jsonb'

-- Check indexes
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'pricing_configurations';
```

✅ **Checkpoint**: Confirm JSONB structure exists

---

### STEP 4: Seed Initial Data (3 min)

1. Open a new SQL Editor query

2. Copy contents of `docs/SEED_INITIAL_DATA.sql`

3. Execute the seed script

4. Watch for success messages in output

5. Verify data insertion:
   ```sql
   -- Check pricing config
   SELECT name, is_active, version FROM pricing_configurations;
   
   -- Check formulas
   SELECT name, category FROM calculation_formulas;
   
   -- Check use cases
   SELECT name, industry FROM use_cases;
   ```

6. ✅ **Checkpoint**: Confirm data is populated

---

### STEP 5: Test Database Connection from App (2 min)

1. Open your application terminal

2. Run a quick test:
   ```bash
   cd /Users/robertchristopher/merlin2
   npm run dev
   ```

3. Open browser console (F12)

4. Check for Supabase connection messages

5. Try to fetch pricing config:
   ```javascript
   // In browser console:
   import { supabase } from './src/services/supabaseClient';
   const { data, error } = await supabase
     .from('pricing_configurations')
     .select('*')
     .limit(1);
   console.log('Config:', data);
   ```

6. ✅ **Checkpoint**: App can connect and query database

---

## ✅ POST-DEPLOYMENT VERIFICATION

### Database Health Checks

```sql
-- 1. Count records in key tables
SELECT 
  'pricing_configurations' as table_name, COUNT(*) as row_count 
FROM pricing_configurations
UNION ALL
SELECT 'calculation_formulas', COUNT(*) FROM calculation_formulas
UNION ALL
SELECT 'use_cases', COUNT(*) FROM use_cases
UNION ALL
SELECT 'market_pricing_data', COUNT(*) FROM market_pricing_data;

-- 2. Test JSONB query
SELECT 
  name,
  config_data->'bess'->>'large_system_per_kwh' as bess_price
FROM pricing_configurations
WHERE is_active = true;

-- 3. Check RLS policies
SELECT 
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### Application Tests

- [ ] Open BessQuoteBuilder
- [ ] Create a test quote (10MW / 40MWh)
- [ ] Verify pricing calculations work
- [ ] Check that no errors appear in console
- [ ] Open Admin Dashboard (Vendor Manager)
- [ ] View pricing configurations
- [ ] Verify JSONB data displays

---

## 🔄 ROLLBACK PROCEDURE (if needed)

If something goes wrong:

### Option 1: Quick Rollback

```sql
-- Drop new tables
DROP TABLE IF EXISTS pricing_configurations CASCADE;
DROP TABLE IF EXISTS use_cases CASCADE;
DROP TABLE IF EXISTS calculation_formulas CASCADE;
DROP TABLE IF EXISTS market_pricing_data CASCADE;

-- Restore from backup
CREATE TABLE pricing_configurations AS 
  SELECT * FROM backup_nov2025.pricing_configurations_old;
  
CREATE TABLE use_cases AS 
  SELECT * FROM backup_nov2025.use_cases_old;
  
CREATE TABLE calculation_formulas AS 
  SELECT * FROM backup_nov2025.calculation_formulas_old;

-- Re-create critical indexes (if needed)
CREATE INDEX idx_pricing_configs_active 
  ON pricing_configurations(is_active);
```

### Option 2: Full Restore

Contact Supabase support for point-in-time recovery if backup is inadequate.

---

## 📊 SUCCESS CRITERIA

Deployment is successful when:

✅ **Database**
- [ ] All tables from MASTER_SCHEMA.sql exist
- [ ] pricing_configurations uses JSONB structure
- [ ] At least 1 pricing configuration exists
- [ ] At least 5 calculation formulas exist
- [ ] At least 4 use case templates exist
- [ ] No errors in SQL execution

✅ **Application**
- [ ] App connects to database without errors
- [ ] useCaseService.getPricingConfig() returns data
- [ ] Quote calculations work correctly
- [ ] Admin dashboard loads without errors

✅ **Code Migration Ready**
- [ ] Deprecation warnings visible in console
- [ ] No TypeScript compilation errors
- [ ] Ready to proceed with Option 2 (code migration)

---

## 📞 TROUBLESHOOTING

### Error: "relation already exists"
**Cause**: Table already exists from previous attempt  
**Fix**: Drop the table first: `DROP TABLE IF EXISTS table_name CASCADE;`

### Error: "column config_data does not exist"
**Cause**: Old schema still active  
**Fix**: Ensure MASTER_SCHEMA.sql executed completely

### Error: "permission denied"
**Cause**: RLS policies preventing access  
**Fix**: Check that you're authenticated as admin/service role

### Application can't fetch data
**Cause**: RLS policies or connection issue  
**Fix**: Verify .env has correct SUPABASE_URL and ANON_KEY

---

## 🎯 NEXT STEPS AFTER DEPLOYMENT

Once deployment is complete and verified:

1. **Proceed to Option 2**: Code Migration
   - Update PricingAdminDashboard to use useCaseService
   - Make equipmentCalculations async
   - Remove temporary fallbacks

2. **Proceed to Option 3**: Build Admin Formulas Tab
   - Create UI for viewing/editing formulas
   - Add formula testing interface
   - Enable admin to modify calculations

3. **Proceed to Option 4**: Testing
   - Comprehensive application testing
   - Verify all calculations correct
   - Load testing with large quotes

---

## 📝 DEPLOYMENT LOG

Fill in as you proceed:

**Deployment Date**: ________________  
**Deployed By**: ________________  
**Start Time**: ________________  
**Backup Completed**: ⬜ Yes ⬜ No  
**Schema Deployed**: ⬜ Yes ⬜ No  
**Data Seeded**: ⬜ Yes ⬜ No  
**Verification Passed**: ⬜ Yes ⬜ No  
**End Time**: ________________  
**Total Duration**: ________________  
**Issues Encountered**: ________________  
**Resolution**: ________________  

---

**Status**: Ready to Execute ✅  
**Risk Level**: Medium (have rollback plan)  
**Confidence**: High (backups + tested schema)
