# 🚀 Quick Start: Industry Standards Migration

## Prerequisites

1. **Supabase Project** ready
2. **Environment variables** configured:
   ```bash
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

---

## ⚡ 3-Step Deployment

### Step 1: Deploy Database Schema (5 minutes)

1. Open Supabase Dashboard → SQL Editor
2. Copy entire contents of `/docs/industry_baselines_schema.sql`
3. Paste and execute
4. Verify success: Check "Tables" → should see `industry_baselines`

**Expected tables**:
- ✅ `industry_baselines` (main data)
- ✅ `industry_baseline_history` (audit trail)

---

### Step 2: Run Migration Script (2 minutes)

```bash
# From project root
cd /Users/robertchristopher/merlin2

# Run migration
npx tsx scripts/migrate-industry-baselines.ts
```

**Expected output**:
```
🔄 Starting industry baselines migration...
✅ Successfully migrated: hotel
✅ Successfully migrated: datacenter
✅ Successfully migrated: hospital
... (15+ industries)
✅ Migration complete: 15 successful, 0 failed

📊 Verification - Current baselines in database:
hotel: 0.00293 MW/room
datacenter: 0.25 MW/IT_load_MW
...
```

---

### Step 3: Verify Everything Works (1 minute)

**Option A: SQL Verification**
```sql
-- In Supabase SQL Editor
SELECT COUNT(*) as total_industries 
FROM industry_baselines 
WHERE is_active = true;

-- Should return 15+
```

**Option B: Code Verification**
```typescript
// In browser console (after app loads)
import { calculateIndustryBaseline } from './src/utils/industryBaselines';

const hotel = await calculateIndustryBaseline('hotel', 400);
console.log(hotel); 
// Should show: powerMW: 1.17, durationHrs: 4, solarMW: 1.17
```

---

## ✅ Success Checklist

- [ ] Schema deployed (tables visible in Supabase)
- [ ] Migration script ran without errors
- [ ] Database shows 15+ industries
- [ ] SQL query returns expected count
- [ ] Hotel calculation shows 1.17 MW for 400 rooms
- [ ] No TypeScript errors in console
- [ ] Cache logs appear in browser console

---

## 🔥 Troubleshooting

### "Cannot connect to Supabase"
```bash
# Check environment variables
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY

# If empty, add to .env file:
cat >> .env << EOF
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
EOF
```

### "Table already exists"
```sql
-- Drop and recreate (CAUTION: deletes data!)
DROP TABLE IF EXISTS industry_baseline_history CASCADE;
DROP TABLE IF EXISTS industry_baselines CASCADE;

-- Then re-run schema SQL
```

### "Migration failed for X industries"
- Check Supabase logs in Dashboard → Logs
- Verify RLS policies are enabled
- Ensure ANON key has insert permissions

---

## 🎯 What Happens After Migration

### Automatic Benefits
1. **Cache activates** - 5-minute TTL for performance
2. **Fallback ready** - Uses code if database unavailable
3. **Audit trail** - All changes tracked automatically
4. **Live updates** - Change values without code deployment

### Testing Cache
```typescript
// First call - hits database
const result1 = await calculateIndustryBaseline('hotel', 400);
console.log('DB query executed'); // Check Network tab

// Second call within 5 minutes - hits cache
const result2 = await calculateIndustryBaseline('hotel', 400);
console.log('Cache hit!'); // No network call

// Clear cache and try again
import { clearBaselineCache } from './src/utils/industryBaselines';
clearBaselineCache();
const result3 = await calculateIndustryBaseline('hotel', 400);
console.log('DB query executed again'); // Network call resumes
```

---

## 📝 Next Steps After Deployment

1. **Monitor cache hit rate** in browser console logs
2. **Test admin updates** via Supabase Studio
3. **Verify audit history** captures changes
4. **Update documentation** with any custom industries added
5. **Set up monitoring** for database performance

---

## 🆘 Need Help?

1. Check `/docs/INDUSTRY_STANDARDS_MIGRATION.md` for full details
2. Review Supabase Dashboard → Logs for errors
3. Test with `calculateIndustryBaselineSync` as fallback
4. Verify environment variables in `.env` file

---

**Estimated Total Time**: ~8 minutes  
**Status**: Ready to deploy  
**Risk Level**: Low (automatic fallback to code)
