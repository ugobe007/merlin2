# Widget System Database Documentation

## Overview

Database schema for Merlin's embeddable widget B2B2C distribution system. Supports partner accounts, API key authentication, usage tracking, and tier-based quotas.

---

## Quick Start

### 1. Apply Migration to Supabase

```bash
# Connect to your Supabase project
cd database/migrations

# Apply the migration
psql "$DATABASE_URL" -f 20260312_widget_system_schema.sql
```

**OR** via Supabase Dashboard:

1. Go to SQL Editor
2. Copy contents of `20260312_widget_system_schema.sql`
3. Click "Run"

### 2. Verify Installation

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE 'widget%';

-- Should return:
-- widget_partners
-- widget_usage
-- widget_monthly_usage

-- Check test partners were seeded
SELECT company_name, tier, api_key FROM widget_partners
WHERE api_key LIKE 'pk_test_%';
```

### 3. Get Test API Keys

```sql
SELECT
  company_name,
  tier,
  api_key,
  monthly_quote_limit
FROM widget_partners
WHERE api_key LIKE 'pk_test_%'
ORDER BY tier;
```

**Test Keys:**

- **Free:** `pk_test_free_demo_12345678901234567890`
- **Pro:** `pk_test_pro_demo_98765432109876543210`
- **Enterprise:** `pk_test_enterprise_demo_11223344556677889900`

---

## Database Schema

### Table: `widget_partners`

Partner account information, API keys, tier, billing, customization.

| Column                 | Type    | Description                                |
| ---------------------- | ------- | ------------------------------------------ |
| `id`                   | UUID    | Primary key                                |
| `company_name`         | TEXT    | Partner company name                       |
| `contact_email`        | TEXT    | Contact email (unique)                     |
| `tier`                 | TEXT    | `free`, `pro`, `enterprise`                |
| `status`               | TEXT    | `active`, `inactive`, `suspended`          |
| `api_key`              | TEXT    | Stripe-style key (pk_live_xxx)             |
| `monthly_quote_limit`  | INTEGER | 100 (free), 500 (pro), 999999 (enterprise) |
| `current_month_quotes` | INTEGER | Resets monthly via cron                    |
| `primary_color`        | TEXT    | Hex color for widget branding              |
| `white_label`          | BOOLEAN | Enterprise only: hide Merlin branding      |
| `stripe_customer_id`   | TEXT    | Stripe billing integration                 |

**Indexes:**

- `idx_widget_partners_api_key` - Fast API key lookups
- `idx_widget_partners_tier` - Filter by tier
- `idx_widget_partners_status` - Filter by status

### Table: `widget_usage`

Event tracking for all widget activity (loads, quotes, errors).

| Column           | Type        | Description                                                 |
| ---------------- | ----------- | ----------------------------------------------------------- |
| `id`             | UUID        | Primary key                                                 |
| `partner_id`     | UUID        | Foreign key to widget_partners                              |
| `event_type`     | TEXT        | `widget_loaded`, `quote_generated`, `quote_failed`, `error` |
| `industry`       | TEXT        | Industry slug (hotel, car-wash, etc.)                       |
| `location_state` | TEXT        | US state code                                               |
| `quote_input`    | JSONB       | Full input parameters                                       |
| `quote_output`   | JSONB       | Full TrueQuote result                                       |
| `referrer_url`   | TEXT        | Partner site URL                                            |
| `created_at`     | TIMESTAMPTZ | Event timestamp                                             |

**Indexes:**

- `idx_widget_usage_partner_id` - Partner analytics
- `idx_widget_usage_monthly` - Monthly usage queries (composite)
- `idx_widget_usage_created_at` - Time-series queries

### Materialized View: `widget_monthly_usage`

Pre-aggregated monthly stats per partner (refreshed daily).

| Column                | Type        | Description         |
| --------------------- | ----------- | ------------------- |
| `partner_id`          | UUID        | Partner reference   |
| `month`               | TIMESTAMPTZ | Month (truncated)   |
| `widget_loads`        | INTEGER     | Total widget loads  |
| `quotes_generated`    | INTEGER     | Successful quotes   |
| `quotes_failed`       | INTEGER     | Failed quotes       |
| `conversion_rate_pct` | NUMERIC     | % of loads → quotes |
| `industries_used`     | TEXT[]      | Array of industries |

**Refresh:** Call `SELECT refresh_widget_monthly_usage()` daily.

---

## Helper Functions

### `generate_widget_api_key(tier TEXT)`

Generate Stripe-style API key.

```sql
-- Generate production key
SELECT generate_widget_api_key('live');
-- Returns: pk_live_aB3dEf9GhI2jKlMnO4pQrS5tUvWxYz

-- Generate test key
SELECT generate_widget_api_key('test');
-- Returns: pk_test_xY9wVuT6sRqP5oNmL4kJiH3gFeD2cB
```

### `validate_widget_api_key(api_key TEXT)`

Validate API key and check quota in single query.

```sql
SELECT * FROM validate_widget_api_key('pk_test_free_demo_12345678901234567890');

-- Returns:
-- valid | partner_id | tier | quotes_remaining | message
-- ------+------------+------+------------------+---------
-- TRUE  | uuid       | free | 100              | Valid
```

**Response Fields:**

- `valid` - Boolean: Key is valid and has quota
- `partner_id` - UUID: Partner ID (NULL if invalid)
- `tier` - TEXT: free/pro/enterprise
- `quotes_remaining` - INTEGER: Quotes left this month
- `message` - TEXT: Error message if invalid

### `reset_widget_monthly_quotes()`

Reset all partner quote counters to 0 (run monthly).

```sql
SELECT reset_widget_monthly_quotes();
-- Resets current_month_quotes to 0 for all active partners
```

### `refresh_widget_monthly_usage()`

Refresh materialized view with latest data.

```sql
SELECT refresh_widget_monthly_usage();
-- Refreshes widget_monthly_usage view
```

---

## API Integration

### Step 1: Update Supabase Client

```typescript
// src/services/supabase.ts
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export { supabase };
```

### Step 2: Implement `validateApiKey()`

```typescript
// src/api/widget/quoteEndpoint.ts
import { supabase } from "@/services/supabase";

interface AuthResult {
  valid: boolean;
  partnerId?: string;
  tier?: "free" | "pro" | "enterprise";
  quotesRemaining?: number;
  message?: string;
}

async function validateApiKey(apiKey: string): Promise<AuthResult> {
  // Call database function
  const { data, error } = await supabase
    .rpc("validate_widget_api_key", { p_api_key: apiKey })
    .single();

  if (error || !data) {
    return {
      valid: false,
      message: "Invalid API key",
    };
  }

  return {
    valid: data.valid,
    partnerId: data.partner_id,
    tier: data.tier,
    quotesRemaining: data.quotes_remaining,
    message: data.message,
  };
}
```

### Step 3: Implement `trackWidgetUsage()`

```typescript
// src/api/widget/quoteEndpoint.ts
interface UsageData {
  partnerId: string;
  eventType: "widget_loaded" | "quote_generated" | "quote_failed" | "error";
  industry?: string;
  locationState?: string;
  quoteInput?: Record<string, unknown>;
  quoteOutput?: Record<string, unknown>;
  referrerUrl?: string;
  errorMessage?: string;
}

async function trackWidgetUsage(data: UsageData): Promise<void> {
  // Insert usage event
  const { error } = await supabase.from("widget_usage").insert({
    partner_id: data.partnerId,
    event_type: data.eventType,
    industry: data.industry,
    location_state: data.locationState,
    quote_input: data.quoteInput,
    quote_output: data.quoteOutput,
    referrer_url: data.referrerUrl,
    error_message: data.errorMessage,
  });

  if (error) {
    console.error("Failed to track widget usage:", error);
  }

  // Increment partner quote counter if quote generated
  if (data.eventType === "quote_generated") {
    await supabase
      .from("widget_partners")
      .update({
        current_month_quotes: supabase.raw("current_month_quotes + 1"),
        total_quotes_generated: supabase.raw("total_quotes_generated + 1"),
        api_key_last_used: new Date().toISOString(),
      })
      .eq("id", data.partnerId);
  }
}
```

### Step 4: Update Quote Endpoint

```typescript
// src/api/widget/quoteEndpoint.ts
import { calculateQuote } from "@/services/unifiedQuoteCalculator";

export async function generateWidgetQuote(
  request: WidgetQuoteRequest,
  apiKey: string
): Promise<WidgetQuoteResponse> {
  // 1. Validate API key
  const auth = await validateApiKey(apiKey);

  if (!auth.valid) {
    throw new Error(auth.message || "Invalid API key");
  }

  // 2. Map widget input to SSOT format
  const ssotInput = mapToSSOTInput(request);

  // 3. Generate quote via SSOT
  const quoteResult = await calculateQuote(ssotInput);

  // 4. Track usage (async, non-blocking)
  trackWidgetUsage({
    partnerId: auth.partnerId!,
    eventType: "quote_generated",
    industry: request.industry,
    locationState: request.location.state,
    quoteInput: request,
    quoteOutput: quoteResult,
  }).catch(console.error);

  // 5. Return formatted response
  return {
    quote: {
      bessKWh: quoteResult.equipment.batteryCapacityKWh,
      bessKW: quoteResult.equipment.batteryPowerKW,
      solarKW: quoteResult.equipment.solarCapacityKW,
      annualSavings: quoteResult.financials.annualSavings,
      paybackYears: quoteResult.financials.paybackYears,
      npv25Year: quoteResult.financials.npv,
      investmentCost: quoteResult.costs.totalCost,
      itcAmount: quoteResult.costs.itcCredit,
    },
    truequote: {
      sources: quoteResult.metadata?.sources || [],
      methodology: "NREL ATB 2024, IRA 2022",
      verified: true,
    },
    metadata: {
      quotesRemaining: auth.quotesRemaining! - 1,
      tier: auth.tier!,
    },
  };
}
```

---

## Cron Jobs

### Daily: Refresh Materialized View

```sql
-- Supabase Edge Function or pg_cron
SELECT cron.schedule(
  'refresh-widget-monthly-usage',
  '0 2 * * *',  -- 2 AM daily
  $$SELECT refresh_widget_monthly_usage()$$
);
```

### Monthly: Reset Quote Counters

```sql
-- First day of month at 12:01 AM
SELECT cron.schedule(
  'reset-widget-monthly-quotes',
  '1 0 1 * *',
  $$SELECT reset_widget_monthly_quotes()$$
);
```

---

## Partner Signup Flow

### Create New Partner

```typescript
// src/services/widgetPartnerService.ts
interface NewPartner {
  companyName: string;
  contactEmail: string;
  website?: string;
  tier: "free" | "pro" | "enterprise";
}

async function createPartner(data: NewPartner): Promise<{ apiKey: string }> {
  // Generate API key
  const { data: keyData } = await supabase
    .rpc("generate_widget_api_key", { p_tier: "live" })
    .single();

  const apiKey = keyData as string;

  // Create partner account
  const { data: partner, error } = await supabase
    .from("widget_partners")
    .insert({
      company_name: data.companyName,
      contact_email: data.contactEmail,
      website: data.website,
      tier: data.tier,
      api_key: apiKey,
      monthly_quote_limit: data.tier === "free" ? 100 : data.tier === "pro" ? 500 : 999999,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create partner: ${error.message}`);
  }

  return { apiKey };
}
```

---

## Analytics Queries

### Partner Dashboard Stats

```sql
-- Current month usage for partner
SELECT
  widget_loads,
  quotes_generated,
  conversion_rate_pct,
  industries_used
FROM widget_monthly_usage
WHERE partner_id = '...'
  AND month = DATE_TRUNC('month', NOW());
```

### Top Partners by Usage

```sql
SELECT
  p.company_name,
  p.tier,
  COUNT(*) AS total_quotes,
  COUNT(DISTINCT DATE_TRUNC('day', u.created_at)) AS active_days
FROM widget_partners p
JOIN widget_usage u ON u.partner_id = p.id
WHERE u.event_type = 'quote_generated'
  AND u.created_at >= NOW() - INTERVAL '30 days'
GROUP BY p.id, p.company_name, p.tier
ORDER BY total_quotes DESC
LIMIT 10;
```

### Industry Breakdown

```sql
SELECT
  industry,
  COUNT(*) AS quote_count,
  AVG((quote_output->>'annualSavings')::NUMERIC) AS avg_savings
FROM widget_usage
WHERE event_type = 'quote_generated'
  AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY industry
ORDER BY quote_count DESC;
```

---

## Security: Row Level Security (RLS)

All tables have RLS enabled. Partners can only access their own data.

### Policies Applied:

1. **widget_partners**
   - Partners can READ their own account
   - Partners can UPDATE their own account (except tier/billing)
   - Admins can read/update all accounts

2. **widget_usage**
   - Partners can READ their own usage data
   - Service role can INSERT usage events (API endpoint)
   - Admins can read all usage

### Testing RLS

```sql
-- Set user context (simulate partner login)
SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claims.sub TO '<partner-uuid>';

-- Should only return partner's own data
SELECT * FROM widget_partners;
SELECT * FROM widget_usage;
```

---

## Troubleshooting

### Issue: API key validation returns `false`

**Check:**

1. Key exists in database: `SELECT * FROM widget_partners WHERE api_key = '...'`
2. Partner status is `active`: `SELECT status FROM widget_partners WHERE api_key = '...'`
3. Quota not exceeded: `SELECT current_month_quotes, monthly_quote_limit FROM widget_partners WHERE api_key = '...'`

### Issue: Usage tracking not recording

**Check:**

1. RLS policy allows service role inserts
2. Partner ID is valid UUID
3. Event type is one of: `widget_loaded`, `quote_generated`, `quote_failed`, `error`
4. Check Supabase logs for errors

### Issue: Materialized view is stale

**Refresh manually:**

```sql
SELECT refresh_widget_monthly_usage();
```

**Check last refresh:**

```sql
SELECT MAX(refreshed_at) FROM widget_monthly_usage;
```

---

## Next Steps

1. ✅ Database schema created
2. 🔄 **Connect API endpoints to Supabase** (current step)
3. ⏳ Build partner signup flow
4. ⏳ Create demo page at `/widget`
5. ⏳ Partner documentation
6. ⏳ Set up cron jobs (daily refresh, monthly reset)
7. ⏳ Beta testing with 3-5 partners

---

## Resources

- **Migration File:** `database/migrations/20260312_widget_system_schema.sql`
- **Widget Strategy:** `WIDGET_STRATEGY.md`
- **Phase 1 Summary:** `WIDGET_MVP_SUMMARY.md`
- **API Types:** `src/api/widget/types.ts`
- **Quote Endpoint:** `src/api/widget/quoteEndpoint.ts`

---

**Database Schema Version:** 1.0.0 (March 12, 2026)
