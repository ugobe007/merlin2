# Opportunity Discovery System (Quick MVP)

## Overview

Automated lead generation system that discovers business opportunities for Merlin BESS installations by monitoring news feeds for expansion, construction, and energy-related signals.

## System Components

### 1. Data Model (`src/types/opportunity.ts`)

- **Opportunity** interface with all lead metadata
- **Signal types:** construction, expansion, new_opening, funding, sustainability_initiative, etc.
- **Industry classifications:** data_center, manufacturing, logistics, hospitality, healthcare, etc.
- **Status workflow:** new → contacted → qualified → archived

### 2. Scraper Service (`src/services/opportunityScraperService.ts`)

- RSS feed aggregator (Google News with targeted queries)
- Keyword detection for business signals
- Industry classification algorithm
- Confidence scoring (0-100) based on:
  - Industry match (high-value industries get bonus)
  - Signal strength (multiple keywords = higher score)
  - Specific high-value signals (construction, opening, expansion, energy_upgrade)

**Current Sources:**

- Google News - Business Construction
- Google News - Factory Expansion
- Google News - Data Center Construction
- Google News - Warehouse Logistics

### 3. Database Schema (`supabase/migrations/20260319_opportunities.sql`)

**opportunities table:**

- id, company_name, description, source_url, source_name
- signals (array), industry, location
- confidence_score (0-100), status (new/contacted/qualified/archived)
- created_at, updated_at, contacted_at, notes

**Indexes:**

- status, confidence_score (DESC), created_at (DESC), industry
- GIN index on signals array for fast filtering

**Additional tables:**

- `lead_sources` - Configurable RSS/API sources
- `scraper_runs` - Logging and monitoring

### 4. Dashboard UI (`src/pages/OpportunitiesDashboard.tsx`)

- Table view with sortable columns
- Filters: status, confidence level, industry, search
- Detail modal with full article info and source link
- Action buttons: Mark Contacted, Mark Qualified, Archive
- Real-time stats cards (total, new, contacted, high confidence)

### 5. API Endpoint (`src/api/opportunityScraper.ts`)

- `runOpportunityScraper()` - Main execution function
- Deduplication logic (checks source_url)
- Stores results in Supabase
- Logs scraper runs for monitoring

## Routes

- `/opportunities` - Main dashboard
- `/leads` - Alias
- `/opp` - Short alias

## Manual Testing

### Run Scraper Once:

```bash
cd /Users/robertchristopher/merlin3
npm run build
node dist/scripts/testScraper.js
```

### Or via dev server console:

```javascript
// In browser console at /opportunities
import { runOpportunityScraper } from "./api/opportunityScraper";
await runOpportunityScraper();
```

## Database Setup

1. Run migration in Supabase SQL Editor:

```sql
-- Copy contents of supabase/migrations/20260319_opportunities.sql
```

2. Verify tables created:

```sql
SELECT * FROM opportunities LIMIT 10;
SELECT * FROM scraper_runs ORDER BY run_at DESC LIMIT 5;
```

## Scheduled Automation (Future - Option B)

### Option 1: Supabase Edge Function (Recommended)

```typescript
// supabase/functions/scraper-cron/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { runOpportunityScraper } from "./opportunityScraper.ts";

serve(async (req) => {
  // Verify cron secret
  const authHeader = req.headers.get("Authorization");
  if (authHeader !== `Bearer ${Deno.env.get("CRON_SECRET")}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const result = await runOpportunityScraper();
  return new Response(JSON.stringify(result), {
    headers: { "Content-Type": "application/json" },
  });
});
```

Schedule: `0 */4 * * *` (every 4 hours)

### Option 2: GitHub Actions

```yaml
name: Opportunity Scraper
on:
  schedule:
    - cron: "0 */4 * * *" # Every 4 hours
  workflow_dispatch:

jobs:
  scrape:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run scrape
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
```

### Option 3: Fly.io Cron Job

```toml
# fly.toml
[services]
[[services.processes]]
  command = "npm run scrape"
  schedule = "0 */4 * * *"
```

## Scoring Algorithm

### Confidence Calculation:

1. **Industry Match** (10-30 pts)
   - High-value industries (data center, manufacturing, logistics, healthcare): +30
   - Other industries: +10

2. **Signal Count** (15 pts each)
   - Each detected signal: +15 points

3. **High-Value Signals** (+20 pts)
   - construction, new_opening, expansion, energy_upgrade: +20

**Max Score:** 100 (capped)

### Example Scores:

- Data center + construction + expansion: 30 + 30 + 20 = 80 (High)
- Manufacturing + new_opening: 30 + 15 + 20 = 65 (Medium)
- Retail + funding: 10 + 15 = 25 (Low)

## Keyword Filters

### Business Signals:

- **Construction:** construction, building, under construction, groundbreaking
- **Expansion:** expansion, expanding, expand, growing, growth
- **New Opening:** opening, opened, new facility, new location, launching
- **Funding:** funding, investment, raised, capital, financing
- **Energy:** energy efficiency, power upgrade, electrical, energy management

### High-Value Industries:

- **Data Center:** data center, server farm, cloud infrastructure, colocation
- **Manufacturing:** manufacturing, factory, plant, production facility
- **Logistics:** warehouse, distribution center, logistics, fulfillment center
- **Healthcare:** hospital, medical center, healthcare facility, clinic

## Future Enhancements (Option B Features)

1. **ML-powered scoring** - Train model on successful leads
2. **Contact discovery** - Enrich with decision-maker emails
3. **CRM integration** - Auto-create opportunities in Salesforce/HubSpot
4. **Email outreach** - Automated personalized sequences
5. **News summarization** - AI-generated lead summaries
6. **More data sources:**
   - Construction permits (city/county databases)
   - Business Wire / PR Newswire APIs
   - LinkedIn company updates
   - Utility interconnection queues
   - Sustainability report filings

## Monitoring & Maintenance

### Check Scraper Health:

```sql
-- Last 10 runs
SELECT * FROM scraper_runs ORDER BY run_at DESC LIMIT 10;

-- Success rate last 7 days
SELECT
  status,
  COUNT(*) as count,
  AVG(total_found) as avg_found
FROM scraper_runs
WHERE run_at > NOW() - INTERVAL '7 days'
GROUP BY status;
```

### Review Lead Quality:

```sql
-- High confidence opportunities
SELECT company_name, confidence_score, signals, industry, created_at
FROM opportunities
WHERE confidence_score >= 70
ORDER BY created_at DESC
LIMIT 20;

-- Conversion rates
SELECT
  status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM opportunities
GROUP BY status;
```

## Cost Estimates

### Current (Option A - MVP):

- **Compute:** Free (runs in Merlin app)
- **Storage:** ~$0 (Supabase free tier: 500MB)
- **Data:** Free (RSS feeds)
- **Total:** $0/month

### Future (Option B - Full Platform):

- **Compute:** $5-20/month (cron jobs)
- **APIs:** $50-200/month (news APIs, enrichment)
- **Storage:** $5-10/month (more data)
- **ML:** $20-50/month (OpenAI for summaries)
- **Total:** $80-280/month

## Success Metrics

### Phase 1 (Weeks 1-4):

- 50+ opportunities discovered/week
- 10+ high-confidence leads/week
- 5+ contacted leads/week
- 1+ qualified opportunity/week

### Phase 2 (Months 2-3):

- 100+ opportunities/week
- 20+ high-confidence/week
- Refine keyword filters based on conversion data
- Add more news sources

### Phase 3 (Month 4+):

- Implement Option B features selectively
- ML scoring model trained on conversion data
- Automated outreach sequences
- CRM integration

## Support

For questions or issues:

1. Check scraper_runs table for errors
2. Review console logs in dashboard
3. Test scraper manually with `npm run scrape`
4. Adjust keywords in `opportunityScraperService.ts` based on results
