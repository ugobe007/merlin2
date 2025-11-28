# 🚀 Quick Deploy Guide

## TL;DR - Deploy in 3 Steps

### Step 1: Backup (2 min)
```bash
# Open: https://app.supabase.com/project/fvmpmozybmtzjvikrctq/sql
# Run: docs/BACKUP_BEFORE_MIGRATION.sql
```

### Step 2: Deploy Schema (5 min)
```bash
# In Supabase SQL Editor
# Run: docs/MASTER_SCHEMA.sql
```

### Step 3: Seed Data (2 min)
```bash
# In Supabase SQL Editor
# Run: docs/SEED_INITIAL_DATA.sql
```

## Verify Success
```sql
SELECT name, version FROM pricing_configurations;
-- Should return "Default Configuration"
```

## If Problems
```sql
-- Rollback: Drop new, restore backup
DROP TABLE pricing_configurations CASCADE;
CREATE TABLE pricing_configurations AS 
  SELECT * FROM backup_nov2025.pricing_configurations_old;
```

## Files You Need
1. `docs/BACKUP_BEFORE_MIGRATION.sql`
2. `docs/MASTER_SCHEMA.sql`
3. `docs/SEED_INITIAL_DATA.sql`

## Supabase URL
https://app.supabase.com/project/fvmpmozybmtzjvikrctq/sql

Done? ✅ Proceed to code migration!
