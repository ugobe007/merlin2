# Apply Missing Market Data Migration

## Problem

The `collected_market_prices` table doesn't exist in your database, which is causing the market data scraper to fail.

## Solution

Apply the migration file: `database/migrations/20251210_market_data_sources.sql`

This migration creates the following tables:

- `market_data_sources` - RSS feed sources
- `scraped_articles` - Fetched articles with NLP classification
- `collected_market_prices` - **MISSING TABLE** - Extracted pricing data points
- `scrape_jobs` - Job scheduling and tracking
- `regulatory_updates` - Tax credits, rebates, tariffs

## How to Apply

### Option 1: Via Supabase Dashboard (Recommended)

1. Go to your Supabase project: https://supabase.com/dashboard/project/YOUR_PROJECT_ID
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the contents of `database/migrations/20251210_market_data_sources.sql`
5. Paste into the SQL editor
6. Click **Run** (or press Cmd+Enter)

### Option 2: Via psql (Command Line)

```bash
# From your project root
psql "$SUPABASE_DB_URL" -f database/migrations/20251210_market_data_sources.sql
```

**Note:** You'll need `SUPABASE_DB_URL` environment variable set to your database connection string.

### Option 3: Via Supabase CLI

```bash
# Apply all pending migrations
supabase db push

# Or apply a specific migration
supabase db push --include-all
```

## Verify Success

After applying the migration, verify the tables exist:

```sql
-- Run this in Supabase SQL Editor
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'market_data_sources',
    'scraped_articles',
    'collected_market_prices',
    'scrape_jobs',
    'regulatory_updates'
  )
ORDER BY table_name;
```

Expected result: All 5 tables should be listed.

## Test the Scraper

Once the tables exist, test the scraper:

```bash
# Manual test (requires env vars set locally)
npx tsx scripts/run-daily-scrape.ts

# Or trigger via GitHub Actions
# https://github.com/ugobe007/merlin2/actions/workflows/daily-market-scrape.yml
# Click "Run workflow"
```

## Additional Migrations to Check

If you're missing other tables, you may need to apply these migrations too:

```bash
# Check which migrations have been applied
SELECT * FROM public._migrations ORDER BY applied_at DESC LIMIT 20;

# If _migrations table doesn't exist, you may need to apply ALL migrations
# in order from oldest to newest
```

Key migrations for market data system:

- `20251210_market_data_sources.sql` - **Core tables** (START HERE)
- `20260114_comprehensive_equipment_pricing.sql` - Equipment pricing tiers
- `20260214_fix_dead_rss_sources.sql` - Updated RSS sources

---

**Status:** Ready to apply. Choose one of the options above based on your preference.
