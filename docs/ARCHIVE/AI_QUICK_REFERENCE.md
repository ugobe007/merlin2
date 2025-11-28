# AI Data Collection System - Quick Reference

## 🚀 5-Minute Setup

### 1. Create Supabase Project
```bash
# Go to: https://supabase.com
# Click "Start your project"
# Choose free tier
# Wait 2 minutes for provisioning
```

### 2. Run Migration
```bash
# In Supabase Dashboard:
# SQL Editor → New Query → Paste migration SQL → Run
```

### 3. Configure Environment
```bash
# Create .env.local
echo "VITE_SUPABASE_URL=https://your-project.supabase.co" > .env.local
echo "VITE_SUPABASE_ANON_KEY=your-anon-key-here" >> .env.local
```

### 4. Test It
```bash
npm run dev
# Look for: 🤖 Initializing AI Data Collection Service...
# Check ticker at top of page shows live data
```

---

## 📊 What Data Gets Collected

| Data Type | Source | Update Frequency | Usage |
|-----------|--------|------------------|-------|
| **Battery Pricing** | BNEF, NREL, Lazard | Daily | Quote calculations, AI recommendations |
| **Products** | Tesla, BYD, LG | Weekly | Product availability, specs |
| **Financing** | Generate Capital, Key Finance | Monthly | Financial modeling |
| **News** | Energy Storage News, Utility Dive | Hourly | Live ticker display |
| **Incentives** | DSIRE, SGIP, state programs | Weekly | Financial calculations |

---

## 🔍 Key Functions

### Data Collection
```typescript
// Run full data collection (all sources)
runDailyDataCollection()

// Collect specific data types
collectBatteryPricing()
collectProductData()
collectFinancingData()
collectIndustryNews()
collectIncentiveData()

// Get latest data for AI use
getLatestAIData()
```

### Initialization
```typescript
// Start service (called in main.tsx)
initializeAIDataCollection()
// - Runs immediate collection
// - Schedules daily 2 AM runs
```

---

## 📂 File Structure

```
merlin2/
├── src/
│   ├── services/
│   │   ├── aiDataCollectionService.ts  [560 lines] 🆕
│   │   ├── supabase.ts                 [125 lines] 🆕
│   │   └── aiOptimizationService.ts    [updated]
│   ├── components/
│   │   └── EnergyNewsTicker.tsx        [updated - live data]
│   └── main.tsx                        [updated - init service]
├── database/
│   └── supabase_migration.sql          [275 lines] 🆕
└── docs/
    ├── AI_DATA_COLLECTION_SYSTEM.md    [comprehensive docs]
    ├── AI_DATA_SETUP_GUIDE.md          [setup instructions]
    └── AI_SYSTEM_IMPLEMENTATION_COMPLETE.md [summary]
```

---

## 🗄️ Database Tables

```sql
battery_pricing          -- Historical pricing data
product_catalog          -- Available BESS products
financing_options        -- Current financing programs
industry_news            -- Relevant news articles
incentive_programs       -- Government incentives
data_collection_log      -- Collection run metadata
configuration_best_practices -- Industry standards
```

---

## 🔧 Common Commands

### Check Collection Status
```sql
SELECT * FROM data_collection_log 
ORDER BY collection_date DESC 
LIMIT 5;
```

### View Latest News
```sql
SELECT title, source, category, "publishDate" 
FROM industry_news 
ORDER BY "publishDate" DESC 
LIMIT 10;
```

### Check Battery Pricing
```sql
SELECT date, "systemSize", "pricePerKWh", chemistry 
FROM battery_pricing 
ORDER BY date DESC 
LIMIT 10;
```

### Monitor Success Rate
```sql
SELECT 
  COUNT(*) as total_runs,
  SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful,
  ROUND(100.0 * SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) / COUNT(*), 2) as success_rate
FROM data_collection_log
WHERE collection_date >= NOW() - INTERVAL '30 days';
```

---

## 🎯 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| **Ticker shows "Loading..."** | Check Supabase credentials in .env.local |
| **No data in database** | Run migration SQL in Supabase dashboard |
| **Collection not running** | Check browser console for errors |
| **"Module not found"** | Run `npm install @supabase/supabase-js` |
| **RLS errors** | Verify RLS policies in Supabase |

---

## 📈 Monitoring Checklist

### Daily
- ✅ Check ticker displays live data
- ✅ Verify automatic collection ran (check logs)

### Weekly
- ✅ Review collection success rate (target >95%)
- ✅ Check data freshness (max 24 hours)
- ✅ Monitor database storage usage

### Monthly
- ✅ Review pricing trends
- ✅ Update API keys if needed
- ✅ Archive old data (>1 year)

---

## 🚨 Emergency Fallbacks

### If Database Down
- Ticker automatically uses fallback static data
- AI continues with cached data
- No user-facing errors

### If APIs Down
- Collection logs error but continues
- Uses previously collected data
- Retries next scheduled run

### If Collection Fails 3+ Times
- Check API keys/credentials
- Review error logs in database
- Verify network connectivity
- Check API rate limits

---

## 📞 Support Resources

| Resource | Link |
|----------|------|
| **Setup Guide** | `AI_DATA_SETUP_GUIDE.md` |
| **Full Documentation** | `AI_DATA_COLLECTION_SYSTEM.md` |
| **Supabase Docs** | https://supabase.com/docs |
| **Migration SQL** | `database/supabase_migration.sql` |
| **Test Script** | `./test-ai-setup.sh` |

---

## ⚡ Performance Targets

- **Collection Duration:** <30 seconds
- **Database Queries:** <100ms average
- **Ticker Refresh:** 5 minutes
- **API Response Time:** <2 seconds
- **Success Rate:** >95%

---

## 🔐 Security Checklist

- ✅ Environment variables in .env.local (not committed)
- ✅ RLS enabled on all tables
- ✅ Public read, admin write access
- ✅ API keys stored securely
- ✅ HTTPS/SSL for all connections

---

## 💰 Cost Estimates

### Supabase Free Tier (Current)
- ✅ 500 MB database storage
- ✅ 2 GB file storage
- ✅ 50,000 monthly active users
- ✅ Unlimited API requests

**Handles:**
- 10,000+ news items
- 1,000+ pricing records
- 1,000+ products
- Daily updates with room to spare

### Upgrade When You Need ($25/mo)
- 8 GB database storage
- 100,000+ users
- Daily backups
- Point-in-time recovery

---

## 🎓 Key Concepts

### Data Flow
```
External APIs → Collection Service → Supabase → Components
```

### Update Cycle
```
1. App starts → Init service
2. 2 AM daily → Run collection
3. Store in DB → Update tables
4. Components → Query latest data
5. Users → See fresh data
```

### Fallback Strategy
```
Try DB → Success? Use live data
     ↓
   Fail? → Use cached data
     ↓
No cache? → Use static fallback
```

---

## 🎉 Success Indicators

After setup, you should see:

✅ Console: "🤖 Initializing AI Data Collection Service..."
✅ Console: "✅ Daily update complete in X seconds"
✅ Ticker: Shows live news and pricing
✅ Database: Has rows in all tables
✅ Logs: Collection runs successfully

---

**Quick Test:**
```bash
./test-ai-setup.sh  # Verify all files in place
npm run dev         # Start app and check console
# Look for AI service initialization messages
```

**Status:** ✅ Ready to deploy!
