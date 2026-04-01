/**
 * Creates the daily_deals table by using Supabase's pg_meta query endpoint.
 * Run: npx tsx scripts/create-table-via-pgmeta.ts
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function run() {
  const sb = createClient(SUPABASE_URL, SERVICE_KEY);

  // Step 1: Create a helper function via exec_sql (DDL inside SECURITY DEFINER function)
  // First verify exec_sql is working
  const { data: test } = await sb.rpc('exec_sql', { sql_query: 'SELECT 42 as n' });
  console.log('exec_sql test:', test); // should be 42

  // Step 2: Try calling a raw SQL via the project's /pg endpoint
  const endpoints = [
    `${SUPABASE_URL}/pg/query`,
    `${SUPABASE_URL}/sql`,
    `${SUPABASE_URL}/v1/sql`,
  ];

  const createSQL = `CREATE TABLE IF NOT EXISTS public.daily_deals (id BIGSERIAL PRIMARY KEY, deal_date DATE NOT NULL, industry_id TEXT NOT NULL, industry_label TEXT NOT NULL, system_size_mw NUMERIC(10,3) NOT NULL, duration_hours NUMERIC(5,1) NOT NULL, solar_mw NUMERIC(10,3) NOT NULL DEFAULT 0, zip_code TEXT, gross_cost_dollars BIGINT NOT NULL, net_cost_dollars BIGINT NOT NULL, annual_savings BIGINT NOT NULL, payback_years NUMERIC(5,1) NOT NULL, npv_25yr BIGINT NOT NULL, irr NUMERIC(6,4), tagline TEXT, market_hook TEXT, discord_message_id TEXT, quote_json JSONB, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE (deal_date, industry_id))`;

  for (const endpoint of endpoints) {
    console.log('\nTrying:', endpoint);
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: createSQL }),
    });
    const body = await res.text();
    console.log('  Status:', res.status, '| Body:', body.slice(0, 150));
    if (res.ok) {
      console.log('  ✅ Success!');
      break;
    }
  }
}

run().catch(err => { console.error(err); process.exit(1); });
