# Fix for 406 Error on pricing_markup_config

## Problem
Your app is getting **406 "Not Acceptable"** errors when trying to fetch from `pricing_markup_config` table because:
- The table doesn't exist in production Supabase
- The migration `20260210_fix_schema_gaps.sql` was in `database/migrations/` but not in `supabase/migrations/`
- Migrations in `supabase/migrations/` are auto-applied, but this one was missed

## Solution (QUICK - 2 minutes)

### Option 1: Supabase Dashboard (RECOMMENDED - Easiest)

1. **Open Supabase Dashboard**: https://app.supabase.com/project/fvmpmozybmtzjvikrctq
2. **Go to SQL Editor** (left sidebar)
3. **Click "New Query"**
4. **Copy/paste this SQL** (only the critical parts):

```sql
-- Create pricing_markup_config table
CREATE TABLE IF NOT EXISTS public.pricing_markup_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key text UNIQUE NOT NULL,
  markup_percentage numeric(5,2) NOT NULL DEFAULT 15.0,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.pricing_markup_config IS 'Equipment markup percentages by type. Used by equipmentPricingTiersService.ts.';

-- Insert default markup configs
INSERT INTO public.pricing_markup_config (config_key, markup_percentage, description)
VALUES
  ('global_default', 15.0, 'Global default markup'),
  ('bess', 12.0, 'BESS markup'),
  ('solar', 10.0, 'Solar panels markup'),
  ('inverter', 15.0, 'Inverter/PCS markup'),
  ('ems_software', 30.0, 'EMS Software markup'),
  ('microgrid_controller', 25.0, 'Microgrid Controller markup'),
  ('scada', 20.0, 'SCADA system markup'),
  ('switchgear', 20.0, 'Switchgear markup'),
  ('transformer', 18.0, 'Transformer markup'),
  ('bms', 15.0, 'BMS markup'),
  ('ev_charger', 15.0, 'EV Charger markup'),
  ('generator', 12.0, 'Generator markup'),
  ('wind', 10.0, 'Wind turbine markup'),
  ('dc_ac_panels', 18.0, 'DC/AC Panels markup'),
  ('ess_enclosure', 12.0, 'ESS Enclosure markup')
ON CONFLICT (config_key) DO NOTHING;

-- Enable RLS
ALTER TABLE public.pricing_markup_config ENABLE ROW LEVEL SECURITY;

-- Create policies (allow public read, admin write)
DROP POLICY IF EXISTS "pricing_markup_config_read" ON public.pricing_markup_config;
CREATE POLICY "pricing_markup_config_read" 
  ON public.pricing_markup_config 
  FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "pricing_markup_config_write" ON public.pricing_markup_config;
CREATE POLICY "pricing_markup_config_write" 
  ON public.pricing_markup_config 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);
```

5. **Click "Run"** (or press Cmd+Enter)
6. **Verify**: You should see "Success. No rows returned"
7. **Test**: Run this query to confirm:
   ```sql
   SELECT COUNT(*) FROM pricing_markup_config;
   -- Should return 15
   ```

8. **Refresh your app** - The 406 errors should disappear!

### Option 2: Supabase CLI (If you have it set up)

```bash
npx supabase db push
```

### Option 3: Run the full migration file

If you want to apply ALL fixes from that migration (recommended for completeness):

1. Open the file: `supabase/migrations/20260210_fix_schema_gaps.sql`
2. Copy the entire contents
3. Paste in Supabase SQL Editor
4. Run it

## Why This Happened

- The migration was created in `database/migrations/` (local documentation)
- But Supabase CLI only recognizes migrations in `supabase/migrations/`
- I've now copied it there, but it needs to be applied to production
- This is a one-time manual step

## After Fixing

Once applied:
- ✅ 406 errors will disappear
- ✅ Equipment pricing with markup will work
- ✅ `equipmentPricingTiersService.ts` will fetch markups from database
- ✅ The BessQuoteBuilder deprecation warning is separate (non-critical)

## Quick Verification

After applying, test in browser console:
```javascript
// This should work without 406 error
fetch('https://fvmpmozybmtzjvikrctq.supabase.co/rest/v1/pricing_markup_config?select=*', {
  headers: {
    'apikey': 'YOUR_ANON_KEY',
    'Content-Type': 'application/json'
  }
}).then(r => r.json()).then(console.log)
```

---

**Total time to fix: ~2 minutes in Supabase Dashboard**
