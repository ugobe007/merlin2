# Market Data Scraper - Complete Bug Hunt Summary

**Date**: March 8, 2026  
**Status**: Multiple bugs discovered and fixed, but GitHub Actions appears to be running cached/old code

---

## 🐛 Bugs Found and Fixed

### Bug #1: Column Name Mismatch ✅ FIXED

**Commit**: `f1fe82a` (Feb 27, 2026)

**Problem**: INSERT statement used wrong column names

- Code: `summary`, `full_content`, `regions_mentioned`, `companies_mentioned`
- Schema: `excerpt`, `content` (other columns don't exist)

**Fix**: Changed INSERT to use correct column names

**Files Changed**:

- `scripts/run-daily-scrape.ts` (line 125-142)
- `src/services/marketDataScraper.ts` (line 140-200)

---

### Bug #2: `.single()` Error on Empty Table ✅ FIXED

**Commit**: `9d9369a` (March 8, 2026)

**Problem**: Supabase `.single()` throws error when 0 rows found

- Empty `scraped_articles` table → `.single()` → Error → Loop breaks
- No INSERTs ever executed

**Fix**: Changed `.single()` to `.maybeSingle()` which returns `null` for no match

**File Changed**: `scripts/run-daily-scrape.ts` (line 112-119)

**Supabase Gotcha**:

- `.single()` = Expects EXACTLY 1 row (errors on 0 or 2+)
- `.maybeSingle()` = Returns `null` if 0, data if 1, error if 2+

---

### Bug #3: Missing Debug Logging ✅ ADDED

**Commits**: `e0fc9aa`, `92e9fe2`, `a8f7140`, `92189af` (March 8, 2026)

**Problem**: Silent failures - no way to diagnose issues

**Fixes Added**:

1. Error logging for failed INSERTs (error message, code, details, hint)
2. Duplicate tracking (skipped X duplicates)
3. Try-catch for exception handling
4. Verbose loop logging ([LOOP], [DUP CHECK])
5. Debug log before INSERT attempts

**File Changed**: `scripts/run-daily-scrape.ts` (multiple sections)

---

### Bug #4: GitHub Actions Running Cached Code ⚠️ ACTIVE ISSUE

**Identified**: March 8, 2026

**Problem**: GitHub Actions appears to be running old workflow/code

- Test script added (`scripts/test-scraper.ts`) - **NOT appearing in output**
- Workflow updated to run test first - **OLD workflow still executing**
- Debug logs added to scraper - **NOT appearing in output**
- Commit verification step added - **NOT appearing in output**

**Evidence**:

- Workflow shows "Starting daily market data scrape..." (old message)
- Should show "=== RUNNING TEST SCRIPT FIRST ===" (new message)
- No verbose logging despite multiple debug statements added
- All `last_fetch_at` remain `NULL` despite multiple workflow runs

**Possible Causes**:

1. GitHub Actions caches workflow YAML files
2. Workflow runs queued before code push use old definition
3. npm cache preventing TypeScript recompilation
4. tsx transpiler caching compiled JavaScript

**Attempted Fixes**:

- Added cache clearing step (`rm -rf node_modules/.cache`)
- Added commit verification step (show current commit SHA)
- Created test script to verify code execution
- Multiple workflow re-runs

**Status**: UNRESOLVED - Workflow still showing old output

---

## 📊 Test Results

### Database Status (Confirmed March 8, 2026)

```sql
-- Query 1: Article count
SELECT COUNT(*) FROM scraped_articles;
-- Result: 0 rows (table empty)

-- Query 2: Source freshness
SELECT name, last_fetch_at FROM market_data_sources WHERE source_type = 'rss_feed';
-- Result: All 15 sources show last_fetch_at = NULL (never updated)

-- Query 3: Manual INSERT test
INSERT INTO scraped_articles (title, url, excerpt, content, equipment_mentioned, relevance_score)
VALUES ('Test', 'https://test.com', 'Excerpt', 'Content', ARRAY['bess'], 0.5);
-- Result: ✅ SUCCESS (1 row inserted, then deleted)
```

**Conclusion**: Database schema is correct, RLS policies allow INSERT, permissions work

### Workflow Run Results (March 8-9, 2026)

| Run # | Commit  | Articles Found | Articles Saved | Test Script Ran? | Debug Logs? |
| ----- | ------- | -------------- | -------------- | ---------------- | ----------- |
| 1     | f1fe82a | 356            | 0              | N/A              | ❌ No       |
| 2     | 9d9369a | 356            | 0              | N/A              | ❌ No       |
| 3     | e0fc9aa | 356            | 0              | N/A              | ❌ No       |
| 4     | 92e9fe2 | 356            | 0              | N/A              | ❌ No       |
| 5     | a8f7140 | 356            | 0              | N/A              | ❌ No       |
| 6     | 92189af | 356            | 0              | N/A              | ❌ No       |
| 7     | aebb810 | 356            | 0              | N/A              | ❌ No       |
| 8     | 192207a | 356            | 0              | N/A              | ❌ No       |
| 9     | 2b6606b | 356            | 0              | ❌ No            | ❌ No       |

**Pattern**: Every run shows identical output regardless of code changes

---

## 🔧 Files Modified

### Core Scraper

- `scripts/run-daily-scrape.ts` (269 → 303 lines)
  - Fixed column names (excerpt/content)
  - Changed .single() → .maybeSingle()
  - Added error logging
  - Added duplicate tracking
  - Added verbose loop logging

### Service Layer

- `src/services/marketDataScraper.ts` (359 lines)
  - Fixed column names in saveScrapedArticles()
  - Note: Not used by CLI script, but fixed for consistency

### GitHub Actions

- `.github/workflows/daily-market-scrape.yml` (89 → 95 lines)
  - Added cache clearing step
  - Added commit verification
  - Added test script execution

### Test Scripts

- `scripts/test-scraper.ts` (NEW - 73 lines)
  - Simple Supabase INSERT test
  - Verifies credentials, permissions, schema

### Database Migrations

- `database/FIX_SCRAPER_TABLES.sql` (272 lines)
  - Created `scraped_articles` table
  - Created `scrape_jobs` table
  - Created `regulatory_updates` table
  - Fixed RLS policies for service_role

---

## 💡 Root Cause Analysis

### Why 0 Articles Saved?

**Theory 1**: Column name mismatch (FIXED)

- ✅ Fixed in commit `f1fe82a`
- But workflow still shows 0 saved

**Theory 2**: `.single()` breaking loop (FIXED)

- ✅ Fixed in commit `9d9369a`
- But workflow still shows 0 saved

**Theory 3**: GitHub Actions caching (ACTIVE)

- ⚠️ Workflow appears to run old code
- Test script not executing
- Debug logs not appearing
- Same output across 9 different commits

**Most Likely**: GitHub Actions is running cached workflow definition or cached compiled code

---

## ✅ What We Know Works

1. **Database schema is correct**
   - Manual INSERT succeeds
   - Columns match expected names (excerpt/content)
   - No schema errors

2. **RLS policies allow service_role**
   - Manual test with service_role key succeeds
   - Policies verified via SQL

3. **Code compiles without errors**
   - TypeScript builds successfully locally
   - Only warning: Supabase type definition (non-blocking)

4. **Secrets are configured**
   - SUPABASE_URL exists in GitHub secrets
   - SUPABASE_SERVICE_ROLE_KEY exists in GitHub secrets

---

## 🚨 Current Blocker

**GitHub Actions appears to be running stale code**

**Evidence**:

- 9 workflow runs with different commits
- All show identical output
- No new logging statements appear
- Test script doesn't execute
- Workflow YAML changes not reflected

**Next Steps**:

1. ✅ Wait 5-10 minutes for GitHub cache to clear
2. ✅ Trigger workflow from GitHub Actions UI (not API)
3. ✅ Verify commit SHA shown in workflow matches latest push
4. ⚠️ If still fails, try creating a new workflow file with different name
5. ⚠️ If still fails, contact GitHub Support about workflow caching

---

## 📝 Commits Applied

```
f1fe82a - Fix: Correct column names in scraper INSERT statements
e0fc9aa - debug: Add error logging for failed article inserts
92e9fe2 - debug: Track and log duplicate articles being skipped
9d9369a - fix: Use maybeSingle for duplicate check
92189af - debug: Add log before INSERT to verify code execution
aebb810 - fix: Clear npm cache and verify commit in workflow
192207a - debug: Add verbose loop logging to trace execution
2b6606b - test: Add simple scraper test to verify code execution
```

---

## 🎯 Expected Behavior (Once Cache Clears)

**Test Script Output**:

```
=== RUNNING TEST SCRIPT FIRST ===
============================================================
SCRAPER TEST - Version 1.0.0
This script SHOULD appear in GitHub Actions
============================================================

✅ Credentials found
📝 Attempting test INSERT...
✅ INSERT SUCCEEDED!
🗑️  Test article deleted
```

**Scraper Output** (if working):

```
[1/12] Processing: PV Tech
  Found 50 items
  Processing 50 items from this source...
  [LOOP] Processing item: Article 1...
  [DUP CHECK] existing=false, checkError=false
  → Attempting INSERT for: Article 1...
  [LOOP] Processing item: Article 2...
  ...
  Saved 50 new articles, 5 prices (skipped 0 duplicates)
```

**Database Result** (if working):

```sql
SELECT COUNT(*) FROM scraped_articles;
-- Expected: 300-400 rows

SELECT COUNT(*) FROM collected_market_prices;
-- Expected: 20-100 rows
```

---

**Created**: March 8, 2026 8:30 PM PST  
**Last Updated**: March 8, 2026 9:15 PM PST  
**Status**: Awaiting GitHub Actions cache clearance
