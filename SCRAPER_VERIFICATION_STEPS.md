# Market Data Scraper - Verification Steps 🔍

**Status**: ✅ Code fix deployed (commit `f1fe82a`)  
**Next**: Re-run workflow and verify data collection works

---

## 🚀 IMMEDIATE: Re-Run Workflow

### Step 1: Trigger GitHub Actions

1. Go to: https://github.com/ugobe007/merlin2/actions/workflows/daily-market-scrape.yml
2. Click **"Run workflow"** (top right)
3. Select: **main** branch
4. Click green **"Run workflow"** button

### Step 2: Watch Execution (2-5 minutes)

**Expected Output**:

```
✅ Starting daily market data scrape...
✅ Processing 15 RSS sources...
✅ Articles saved: 300-400 (was 0 before fix)
✅ Prices extracted: 20-100 (was 0 before fix)
✅ Completed successfully
```

**Red Flags** (if these appear, something's wrong):

```
❌ Articles saved: 0
❌ Prices extracted: 0
❌ Error: column "summary" does not exist
```

---

## 🔍 VERIFY: Database Population

### Copy-Paste These Queries in Supabase SQL Editor

**Query 1: Check Articles**

```sql
SELECT
  COUNT(*) as total_articles,
  COUNT(DISTINCT source_id) as unique_sources,
  MAX(published_at) as latest_article
FROM scraped_articles;
```

**Expected**: `total_articles: 300+`, `unique_sources: 10-15`, `latest_article: today`

---

**Query 2: Check Prices**

```sql
SELECT
  equipment_type,
  COUNT(*) as price_points,
  AVG(price_per_unit)::numeric(10,2) as avg_price
FROM collected_market_prices
GROUP BY equipment_type;
```

**Expected**: Multiple rows (bess, solar, wind, etc.)

---

**Query 3: Check Source Freshness**

```sql
SELECT
  name,
  last_fetch_at,
  last_fetch_status,
  total_data_points
FROM market_data_sources
WHERE source_type = 'rss_feed'
ORDER BY last_fetch_at DESC;
```

**Expected**: All 15 sources show `last_fetch_at = today`, `last_fetch_status = 'success'`

---

## ✅ Success Criteria

**If ALL these are true, the fix worked**:

- [ ] Workflow completed without errors (green checkmark)
- [ ] "Articles saved" shows **300+** (not 0)
- [ ] "Prices extracted" shows **20+** (not 0)
- [ ] `scraped_articles` table has **300+ rows**
- [ ] `collected_market_prices` table has **20+ rows**
- [ ] All RSS sources have `last_fetch_at` populated (not NULL)

---

## 🐛 If Still Seeing 0 Articles Saved

**Run This Diagnostic**:

```sql
-- Check if INSERT permissions work
INSERT INTO scraped_articles (
  title, url, excerpt, content, equipment_mentioned, relevance_score
) VALUES (
  'Test Article After Fix',
  'https://test.com/article-after-fix',
  'Test excerpt',
  'Test content',
  ARRAY['bess'],
  0.5
);

-- Count test articles
SELECT COUNT(*) FROM scraped_articles WHERE title LIKE 'Test Article%';
```

**If INSERT succeeds**: Code issue (check logs for new error)  
**If INSERT fails**: RLS or schema issue (re-apply FIX_SCRAPER_TABLES.sql)

---

## 📊 Quick Status Check

**Run This One-Liner**:

```sql
SELECT
  (SELECT COUNT(*) FROM scraped_articles) as articles,
  (SELECT COUNT(*) FROM collected_market_prices) as prices,
  (SELECT COUNT(*) FROM market_data_sources WHERE last_fetch_at IS NOT NULL) as sources_updated;
```

**Good Output**:

```
articles: 300+
prices: 20+
sources_updated: 15
```

**Bad Output** (bug still exists):

```
articles: 0
prices: 0
sources_updated: 0
```

---

## 📅 Monitor Daily Automation

**Tomorrow (March 9, 2026) at 6:00 AM UTC**:

1. Check: https://github.com/ugobe007/merlin2/actions
2. Look for automatic workflow run (not manual)
3. Verify green checkmark (no errors)
4. Run Query 3 above to check freshness

**If automatic run fails**:

- Check GitHub Actions secrets (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
- Review workflow logs for errors
- Verify cron schedule: `'0 6 * * *'`

---

## 🎯 What You Should See After Fix

### Before Fix (Bug State)

```
Workflow Log:
  Fetched 356 articles from RSS feeds
  Saved 0 articles ❌
  Extracted 0 prices ❌

Database:
  scraped_articles: 0 rows ❌
  collected_market_prices: 0 rows ❌
  last_fetch_at: NULL for all sources ❌
```

### After Fix (Expected)

```
Workflow Log:
  Fetched 350+ articles from RSS feeds
  Saved 350+ articles ✅
  Extracted 25+ prices ✅

Database:
  scraped_articles: 350+ rows ✅
  collected_market_prices: 25+ rows ✅
  last_fetch_at: Feb 27 2026 for all sources ✅
```

---

## 📝 Quick Reference: What Was Fixed

**Bug**: Column names in INSERT statement didn't match database schema

**Files Fixed**:

1. `scripts/run-daily-scrape.ts` (line 125-142)
2. `src/services/marketDataScraper.ts` (line 140-200)

**Changes**:

- ❌ `summary: ...` → ✅ `excerpt: ...`
- ❌ `full_content: ...` → ✅ `content: ...`
- ❌ Removed: `regions_mentioned`, `companies_mentioned`, `regulations_mentioned`

**Deployed**: Commit `f1fe82a`, pushed to `main`

---

**Last Updated**: February 27, 2026 11:50 PM PST  
**Next Action**: 🚀 **Re-run GitHub Actions workflow NOW**
