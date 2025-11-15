# AI Data Collection System - Setup Guide

## Quick Setup (5 Minutes)

### 1. Create Supabase Project

1. Go to https://supabase.com and create a free account
2. Create a new project (choose region closest to your users)
3. Wait 2-3 minutes for project provisioning

### 2. Run Database Migration

**Option A: Using Supabase Dashboard (Easiest)**
1. Open your Supabase project
2. Go to **SQL Editor** in left sidebar
3. Click **New Query**
4. Copy contents of `database/supabase_migration.sql`
5. Paste into query editor
6. Click **Run** button

**Option B: Using Command Line**
```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Run migration
supabase db push
```

### 3. Configure Environment Variables

Create `.env.local` in project root:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Where to find these values:**
1. Open your Supabase project
2. Go to **Settings** → **API**
3. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`

### 4. Test the System

```bash
# Install dependencies (if not already done)
npm install

# Start dev server
npm run dev
```

**Verify it's working:**
1. Open browser console (F12)
2. Look for: `🤖 Initializing AI Data Collection Service...`
3. Wait ~30 seconds, should see: `✅ Daily update complete`
4. Check ticker at top of page - should show live data

### 5. Verify Database

Check that data was inserted:

```sql
-- In Supabase SQL Editor

-- Check industry news
SELECT COUNT(*) FROM industry_news;
-- Should return 3+ rows

-- Check battery pricing
SELECT * FROM battery_pricing ORDER BY date DESC LIMIT 5;
-- Should show recent pricing data

-- Check collection logs
SELECT * FROM data_collection_log ORDER BY collection_date DESC LIMIT 1;
-- Should show successful collection run
```

---

## Production Setup

### Add Real API Integrations

The system currently uses mock data. To integrate real APIs:

#### 1. NREL API (Battery Pricing)
```bash
# Get free API key from NREL
https://developer.nrel.gov/signup/

# Add to .env.local
VITE_NREL_API_KEY=your-nrel-key
```

Update `aiDataCollectionService.ts`:
```typescript
const response = await fetch(
  `https://developer.nrel.gov/api/atb/v1/electricity-storage`,
  {
    headers: { 'X-Api-Key': process.env.VITE_NREL_API_KEY }
  }
);
```

#### 2. News APIs

**Option A: NewsAPI.org**
```bash
# Get API key
https://newsapi.org/register

# Add to .env.local
VITE_NEWS_API_KEY=your-news-api-key
```

**Option B: Energy Storage News RSS**
```typescript
// Use RSS parser
import Parser from 'rss-parser';
const parser = new Parser();
const feed = await parser.parseURL('https://www.energy-storage.news/feed/');
```

#### 3. Product Data

**Web Scraping with Puppeteer:**
```bash
npm install puppeteer
```

```typescript
import puppeteer from 'puppeteer';

async function scrapeTeslaProducts() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('https://www.tesla.com/megapack');
  
  // Extract product specs
  const specs = await page.evaluate(() => {
    // Your scraping logic
  });
  
  await browser.close();
  return specs;
}
```

### Schedule Daily Updates

#### Option 1: Supabase Edge Functions (Recommended)

Create `supabase/functions/daily-collection/index.ts`:
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { runDailyDataCollection } from './aiDataCollectionService.ts'

serve(async (req) => {
  // Verify cron secret
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${Deno.env.get('CRON_SECRET')}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  await runDailyDataCollection()
  return new Response('OK', { status: 200 })
})
```

Deploy:
```bash
supabase functions deploy daily-collection

# Set up cron in Supabase Dashboard:
# Settings → Edge Functions → Cron Jobs
# Schedule: 0 2 * * * (daily at 2 AM)
```

#### Option 2: Vercel Cron Jobs

Add to `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/daily-collection",
    "schedule": "0 2 * * *"
  }]
}
```

Create `pages/api/daily-collection.ts`:
```typescript
import { runDailyDataCollection } from '@/services/aiDataCollectionService'

export default async function handler(req, res) {
  // Verify cron secret
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  await runDailyDataCollection()
  res.status(200).json({ success: true })
}
```

#### Option 3: GitHub Actions

Create `.github/workflows/daily-collection.yml`:
```yaml
name: Daily AI Data Collection

on:
  schedule:
    - cron: '0 2 * * *' # Daily at 2 AM UTC

jobs:
  collect:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run data collection
        env:
          VITE_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
        run: node scripts/daily-collection.js
```

---

## Monitoring & Maintenance

### Dashboard Queries

**Collection Success Rate (Last 30 Days):**
```sql
SELECT 
  COUNT(*) as total_runs,
  SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful,
  ROUND(
    100.0 * SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) / COUNT(*),
    2
  ) as success_rate
FROM data_collection_log
WHERE collection_date >= NOW() - INTERVAL '30 days';
```

**Average Collection Duration:**
```sql
SELECT 
  AVG(duration_seconds) as avg_duration,
  MIN(duration_seconds) as min_duration,
  MAX(duration_seconds) as max_duration
FROM data_collection_log
WHERE status = 'success'
  AND collection_date >= NOW() - INTERVAL '7 days';
```

**Data Freshness Check:**
```sql
-- Check if data is stale (>48 hours old)
SELECT 
  'battery_pricing' as table_name,
  MAX(date) as last_update,
  NOW() - MAX(date) as staleness
FROM battery_pricing
UNION ALL
SELECT 
  'industry_news',
  MAX("publishDate"),
  NOW() - MAX("publishDate")
FROM industry_news;
```

### Set Up Alerts

**Email alerts for failures:**
```typescript
// In aiDataCollectionService.ts
if (status === 'error') {
  await sendEmail({
    to: 'admin@yourcompany.com',
    subject: 'AI Data Collection Failed',
    body: `Collection failed at ${new Date()}\nError: ${error}`
  });
}
```

**Slack webhook:**
```typescript
await fetch(process.env.SLACK_WEBHOOK_URL, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: '🚨 AI Data Collection failed! Check logs.'
  })
});
```

---

## Troubleshooting

### Issue: "Cannot find module './supabase'"

**Solution:**
```bash
# Ensure Supabase package is installed
npm install @supabase/supabase-js

# Restart dev server
npm run dev
```

### Issue: "Database error: relation does not exist"

**Solution:**
Run the migration SQL again in Supabase dashboard.

### Issue: Ticker shows "Loading..." forever

**Possible causes:**
1. Supabase credentials not configured
2. Database tables not created
3. No data in database

**Debug steps:**
```typescript
// Check browser console for errors
// Should see: "Error fetching news:" if database issue

// Manually insert test data:
INSERT INTO industry_news (title, source, category, summary, url, "publishDate", "relevanceScore")
VALUES ('Test News', 'Test Source', 'news', 'Test summary', 'http://test.com', NOW(), 50);
```

### Issue: Data collection not running

**Check:**
```typescript
// In browser console, verify initialization
console.log('AI service initialized?');

// Check collection logs in database
SELECT * FROM data_collection_log ORDER BY collection_date DESC LIMIT 5;

// If no logs, the service might not be initialized
// Verify main.tsx has:
import { initializeAIDataCollection } from './services/aiDataCollectionService'
initializeAIDataCollection();
```

---

## Cost Estimates

### Supabase Free Tier
- ✅ 500 MB database storage
- ✅ 2 GB file storage
- ✅ 50,000 monthly active users
- ✅ Unlimited API requests
- ✅ 500 MB Edge Function invocations

**Should handle:**
- 1,000+ battery pricing records
- 10,000+ news items
- 1,000+ products
- Daily updates with room to spare

### Upgrade to Pro ($25/mo) when you need:
- 8 GB database storage
- 100 GB file storage
- 100,000+ MAU
- Daily backups
- Point-in-time recovery

---

## Next Steps

1. ✅ Set up Supabase project
2. ✅ Run migration
3. ✅ Configure environment variables
4. ✅ Verify data collection works
5. 🔄 Add real API integrations (optional)
6. 🔄 Set up scheduled collection (production)
7. 🔄 Configure monitoring and alerts

**Questions? Issues?**
- Check `AI_DATA_COLLECTION_SYSTEM.md` for detailed documentation
- Review logs in Supabase Dashboard → Logs
- Check browser console for errors

---

**Status:** Ready to deploy! 🚀
