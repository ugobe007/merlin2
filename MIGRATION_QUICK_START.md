# Migration Quick Start Guide

## 🎯 Purpose
This guide walks you through migrating use case templates and equipment data from static TypeScript files into your Supabase database.

## 📋 Prerequisites
- Supabase project configured (see `SUPABASE_SETUP_GUIDE.md`)
- Admin dashboard access

## 🚀 Migration Steps

### Step 1: Create Database Tables
1. Open your Supabase dashboard
2. Go to **SQL Editor**
3. Open the file `/docs/03_USE_CASE_TABLES.sql`
4. Copy the entire contents
5. Paste into Supabase SQL Editor
6. Click **Run**

**Expected Result:**
```
✅ Table use_case_templates created
✅ Table equipment_database created
✅ Indexes created
✅ RLS policies enabled
✅ Helper functions created
✅ Views created
```

### Step 2: Access Admin Dashboard
1. Navigate to `/admin` in your app
2. Click the **🔄 Data Migration** tab
3. You should see the migration status dashboard

### Step 3: Check Migration Status
The dashboard will show:
- **In Code**: 9 templates (Car Wash, Hotel, Data Center, etc.)
- **In Database**: 0 templates (initially)
- **Needs Migration**: 9 templates

You'll see a detailed list of all templates with ✅/❌ indicators.

### Step 4: Run Migration
1. Click the **🚀 Run Migration** button
2. Confirm the action
3. Wait for migration to complete (usually 5-10 seconds)

**Expected Result:**
```
✅ Migration Complete
   Templates Created: 9
   Equipment Created: 100+
   Errors: 0
```

### Step 5: Validate Migration
1. Click the **✓ Validate Migration** button
2. Wait for validation to complete

**Expected Result:**
```
✅ Validation Passed
   All templates have correct equipment counts
   All required fields populated
   No orphaned equipment
```

## 🧪 Testing (Option 3: Prototype First)

If you want to test with a single template before migrating all:

### Manual Testing with Car Wash
1. Open browser console
2. Run this code:

```typescript
import { getUseCaseWithCalculations } from './services/dataIntegrationService';

// Test Car Wash template
const result = await getUseCaseWithCalculations({
  slug: 'car-wash',
  facilitySize: 10000,
  location: 'Los Angeles, CA',
  customAnswers: { num_bays: 4 },
  solarEnabled: true,
  autonomyDays: 3
});

console.log('Result:', result);
console.log('From cache:', result.fromCache);
console.log('Execution time:', result.executionTimeMs, 'ms');
console.log('Calculations:', result.calculations);
```

### Expected Output
```javascript
{
  template: {
    id: "uuid-here",
    slug: "car-wash",
    name: "Car Wash",
    powerProfile: {...},
    // ... template data
  },
  equipment: [
    { name: "Wash Bay Motors", powerKw: 15, dutyCycle: 0.6, ... },
    { name: "Vacuum Systems", powerKw: 5, dutyCycle: 0.4, ... },
    // ... ~15 equipment items
  ],
  calculations: {
    financial: {
      npv: 450000,
      irr: 0.18,
      paybackYears: 5.2,
      lcos: 0.12
    },
    sizing: {
      batteryCapacitykWh: 250,
      powerRatingkW: 100
    },
    solar: {
      batteryCapacityAh: 5200,
      solarPanelWattage: 75000,
      numberOfPanels: 188
    }
  },
  fromCache: false,
  executionTimeMs: 205
}
```

### Run Again to Test Cache
Run the same code a second time. Expected changes:
- `fromCache: true`
- `executionTimeMs: ~60` (70% faster!)

## 🔄 Rollback (If Needed)

If something goes wrong:

1. Click **⚠️ Rollback Migration** button
2. Confirm the action (⚠️ This deletes all migrated data!)
3. Wait for rollback to complete

**Result:** All templates and equipment deleted from database. System reverts to using static files.

## 📊 Cache Management

### Clear Expired Cache
Removes cache entries older than 7 days:
1. Scroll to **Cache Statistics** section
2. Click **🧹 Clear Expired Cache**

### Clear All Cache
Removes ALL cache entries (forces recalculation):
1. Click **🗑️ Clear All Cache**
2. Confirm the action

**Use case:** After updating financial calculations or adding new equipment.

## 🔍 Verification Checklist

After migration, verify:
- [ ] All 9 templates in database (check migration status)
- [ ] Equipment counts match (Car Wash = ~15, Hotel = ~20, etc.)
- [ ] Validation passes with no errors
- [ ] Cache is working (run same query twice, check timing)
- [ ] Solar calculations working (if enabled)
- [ ] Financial calculations match original values

## 🛠️ Troubleshooting

### Error: "Tables do not exist"
**Solution:** Run `03_USE_CASE_TABLES.sql` in Supabase SQL Editor

### Error: "RLS policy prevents access"
**Solution:** Check Supabase dashboard → Authentication → Policies
- `use_case_templates` should have public read access
- `equipment_database` should have public read access

### Error: "Duplicate key violation"
**Solution:** Templates already migrated. Either:
1. Skip migration (data already there)
2. Run rollback first, then migrate again

### Migration shows "0 templates created"
**Solution:** Templates may already exist. Check migration status dashboard.

### Cache not working (always fromCache: false)
**Solution:** Check `calculation_cache` table permissions in Supabase

## 📈 Performance Expectations

### Before Migration (Static Files)
- Template load: 5ms
- Calculation: 200ms
- **Total: ~205ms**

### After Migration (Database + Cache)
- First request: ~300ms (DB fetch + calculation + cache save)
- Cached requests: ~60ms (70% faster!)
- Cache hit rate: 60-80% (typical)

### Cache Benefits
With 1000 requests/day and 70% cache hit rate:
- Cached: 700 requests × 60ms = 42 seconds
- Uncached: 300 requests × 300ms = 90 seconds
- **Total: 132 seconds vs 205 seconds** (35% faster overall)

## 🎉 Next Steps

After successful migration:

1. **Update Components** to use `getUseCaseWithCalculations()`
2. **Monitor Cache Statistics** in admin dashboard
3. **Add More Templates** via admin UI (future feature)
4. **Set Up Analytics** to track which templates are most popular
5. **Configure Automatic Cache Cleanup** (cron job to clear expired entries)

## 📚 Related Documentation
- `DATA_INTEGRATION_STRATEGY.md` - Complete architecture overview
- `DATA_FLOW_VISUALIZATION.md` - Before/after diagrams
- `USE_CASE_DATA_AUDIT.md` - Inventory of all templates
- `SUPABASE_SETUP_GUIDE.md` - Database configuration

## 🆘 Need Help?
- Check the browser console for detailed error logs
- Review Supabase logs in the dashboard
- Verify all environment variables are set
- Ensure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are configured

---

**Last Updated:** 2025
**Version:** 1.0
**Compatibility:** Merlin BESS Quote Builder v2.0+
