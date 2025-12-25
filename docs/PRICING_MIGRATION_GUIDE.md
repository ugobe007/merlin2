# Pricing Configuration Database Migration Guide

## ✅ Migration Complete!

The `pricingConfigService` has been successfully migrated from localStorage to the database.

## 📋 What Was Done

### 1. Database Table Created
- **File:** `database/migrations/20250103_create_pricing_configurations_table.sql`
- **Table:** `pricing_configurations`
- **Features:**
  - UUID primary key
  - JSONB `config_data` column for flexible pricing structure
  - Versioning support
  - Approval workflow (optional)
  - Audit trail (created_at, updated_at, updated_by)
  - Single default configuration constraint

### 2. Service Updated
- **File:** `src/services/pricingConfigService.ts`
- **Changes:**
  - Now reads from database first (with 5-minute cache)
  - Falls back to localStorage if database unavailable
  - Falls back to defaults if both unavailable
  - Automatically migrates localStorage configs to database
  - Maintains backward compatibility during migration

### 3. Migration Logic
- **Automatic Migration:**
  - On first load, checks localStorage for existing config
  - If found and valid, migrates to database
  - If database config is newer, removes localStorage
  - If localStorage is newer, migrates to database

## 🚀 How to Deploy

### Step 1: Run Database Migration
```sql
-- Run this in your Supabase SQL Editor
-- File: database/migrations/20250103_create_pricing_configurations_table.sql
```

The migration will:
- Create the `pricing_configurations` table
- Insert default configuration matching `DEFAULT_PRICING_CONFIG`
- Set up indexes and triggers
- Ensure only one default configuration exists

### Step 2: Verify Migration
1. Open Admin Dashboard → Pricing Health tab
2. Check "Database Connection" status (should be "connected")
3. Check "Pricing Config Status" (should be "synced")

### Step 3: Test Configuration Updates
1. Go to Admin Dashboard → Pricing tab
2. Open Pricing Dashboard
3. Make a pricing change
4. Verify it saves to database (check Pricing Health tab)

## 🔄 Migration Behavior

### Priority Order:
1. **Database** (if available and has config)
2. **localStorage** (if database unavailable or empty)
3. **Defaults** (if both unavailable)

### Automatic Migration:
- ✅ Migrates localStorage → database on first load
- ✅ Keeps localStorage as backup if database save fails
- ✅ Removes localStorage once database save succeeds
- ✅ Handles version conflicts (uses newer timestamp)

## 📊 Database Schema

```sql
CREATE TABLE pricing_configurations (
    id UUID PRIMARY KEY,
    name VARCHAR(255),
    description TEXT,
    version VARCHAR(50),
    is_active BOOLEAN,
    is_default BOOLEAN,
    config_data JSONB,  -- Full pricing configuration
    last_updated TIMESTAMP,
    updated_by VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    requires_approval BOOLEAN,
    approved_by UUID,
    approved_at TIMESTAMP
);
```

## 🛠️ Troubleshooting

### Issue: "pricing_configurations table not found"
**Solution:** Run the migration script in Supabase SQL Editor

### Issue: Config not loading from database
**Check:**
1. Database connection status
2. Table exists: `SELECT * FROM pricing_configurations LIMIT 1;`
3. Default config exists: `SELECT * FROM pricing_configurations WHERE is_default = true;`

### Issue: Changes not persisting
**Check:**
1. Database write permissions
2. RLS policies (if enabled)
3. Console for error messages

## ✨ Benefits

1. **Single Source of Truth:** All pricing configs in one place
2. **Multi-User Support:** Shared across all users/sessions
3. **Versioning:** Track changes over time
4. **Audit Trail:** Know who changed what and when
5. **Backup:** Database backups include pricing configs
6. **Scalability:** No localStorage size limits

## 📝 Next Steps

1. ✅ Run migration script
2. ✅ Test configuration updates
3. ✅ Verify Pricing Health dashboard shows "synced"
4. ⏳ Remove localStorage fallback after 1-2 weeks (optional)
5. ⏳ Add admin UI for version history (future enhancement)

---

**Status:** Ready for deployment! 🎉

