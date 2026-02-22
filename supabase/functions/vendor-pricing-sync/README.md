# Vendor Pricing Sync Edge Function

Automatically syncs approved vendor products to the pricing database.

## Features

- ✅ Syncs approved vendor products to `equipment_pricing_tiers` table
- ✅ Maps vendor product categories to equipment types
- ✅ Determines capacity tiers (small/medium/large)
- ✅ Logs all sync activity to `vendor_sync_log` table
- ✅ Runs hourly via Supabase cron

## Deployment

### 1. Deploy the Edge Function

```bash
supabase functions deploy vendor-pricing-sync
```

### 2. Set Environment Variables

The function needs access to Supabase:

```bash
supabase secrets set SUPABASE_URL=your-project-url
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Schedule with Supabase Cron

In your Supabase dashboard, navigate to **Database > Extensions** and enable `pg_cron`.

Then run this SQL to schedule the function:

```sql
-- Schedule vendor pricing sync to run every hour
SELECT cron.schedule(
  'vendor-pricing-sync-hourly',
  '0 * * * *', -- Every hour at minute 0
  $$
  SELECT net.http_post(
    url := 'https://your-project-ref.supabase.co/functions/v1/vendor-pricing-sync',
    headers := '{"Authorization": "Bearer YOUR_ANON_KEY", "Content-Type": "application/json"}'::jsonb
  ) AS request_id;
  $$
);
```

**Note:** Replace `your-project-ref` and `YOUR_ANON_KEY` with your actual values.

### 4. Apply Database Migration

Run the migration to create the `vendor_sync_log` table:

```bash
supabase db push
```

## Manual Testing

Test the function manually:

```bash
curl -X POST \
  https://your-project-ref.supabase.co/functions/v1/vendor-pricing-sync \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

## Monitoring

View sync logs in the database:

```sql
-- View recent syncs
SELECT * FROM vendor_sync_log
ORDER BY synced_at DESC
LIMIT 10;

-- View failed syncs
SELECT * FROM vendor_sync_log
WHERE status = 'failed'
ORDER BY synced_at DESC;

-- View sync statistics
SELECT 
  sync_type,
  COUNT(*) as total_syncs,
  SUM(products_synced) as total_products_synced,
  AVG(products_synced::float / NULLIF(products_total, 0)) as avg_success_rate
FROM vendor_sync_log
WHERE status = 'completed'
GROUP BY sync_type;
```

## Webhook Alternative

Instead of cron, you can trigger the function via webhook when a product is approved:

```sql
-- Create webhook trigger
CREATE OR REPLACE FUNCTION trigger_vendor_pricing_sync()
RETURNS TRIGGER AS $$
BEGIN
  -- Trigger webhook when product is approved
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    PERFORM net.http_post(
      url := 'https://your-project-ref.supabase.co/functions/v1/vendor-pricing-sync',
      headers := '{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to vendor_products table
CREATE TRIGGER vendor_product_approved
AFTER UPDATE ON vendor_products
FOR EACH ROW
EXECUTE FUNCTION trigger_vendor_pricing_sync();
```

This triggers sync immediately when a product is approved, providing real-time updates.

## Architecture

```
┌────────────────┐
│ vendor_products│ (status='approved')
└────────┬───────┘
         │
         ▼
┌────────────────────────┐
│ Edge Function          │
│ vendor-pricing-sync    │
│                        │
│ 1. Fetch approved      │
│ 2. Transform data      │
│ 3. Upsert to pricing   │
│ 4. Log activity        │
└────────┬───────────────┘
         │
         ├─────────────────────┐
         ▼                     ▼
┌────────────────────┐  ┌─────────────┐
│equipment_pricing_  │  │vendor_sync_ │
│tiers               │  │log          │
└────────────────────┘  └─────────────┘
```

## Troubleshooting

**Function not running?**
- Check cron job status: `SELECT * FROM cron.job;`
- View cron logs: `SELECT * FROM cron.job_run_details ORDER BY start_time DESC;`

**Sync failing?**
- Check Edge Function logs in Supabase dashboard
- Verify environment variables are set
- Check `vendor_sync_log` for error messages

**Products not syncing?**
- Verify products have `status='approved'`
- Check product has valid `price_per_kwh` or `price_per_kw`
- Ensure `product_category` is valid (battery, inverter, ems, bos, container)
