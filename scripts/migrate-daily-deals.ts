/**
 * One-time migration: creates the daily_deals table in Supabase.
 * Run: npx tsx scripts/migrate-daily-deals.ts
 */
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const sb = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function run() {
  console.log('Creating daily_deals table...');

  // exec_sql_modify handles DDL (exec_sql only works for SELECT)
  const { error: e1 } = await sb.rpc('exec_sql_modify', { sql_query: `
    CREATE TABLE IF NOT EXISTS daily_deals (
      id                  BIGSERIAL PRIMARY KEY,
      deal_date           DATE        NOT NULL,
      industry_id         TEXT        NOT NULL,
      industry_label      TEXT        NOT NULL,
      system_size_mw      NUMERIC(10,3) NOT NULL,
      duration_hours      NUMERIC(5,1)  NOT NULL,
      solar_mw            NUMERIC(10,3) NOT NULL DEFAULT 0,
      zip_code            TEXT,
      gross_cost_dollars  BIGINT      NOT NULL,
      net_cost_dollars    BIGINT      NOT NULL,
      annual_savings      BIGINT      NOT NULL,
      payback_years       NUMERIC(5,1)  NOT NULL,
      npv_25yr            BIGINT      NOT NULL,
      irr                 NUMERIC(6,4),
      tagline             TEXT,
      market_hook         TEXT,
      discord_message_id  TEXT,
      quote_json          JSONB,
      created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (deal_date, industry_id)
    )
  ` });
  if (e1) { console.error('Table error:', e1.message); process.exit(1); }
  console.log('✅ Table created');

  const { error: e2 } = await sb.rpc('exec_sql_modify', { sql_query:
    'CREATE INDEX IF NOT EXISTS daily_deals_date_idx ON daily_deals (deal_date DESC)'
  });
  if (e2) console.error('Index error:', e2.message);
  else console.log('✅ Index created');

  const { error: e3 } = await sb.rpc('exec_sql_modify', { sql_query:
    "CREATE INDEX IF NOT EXISTS daily_deals_industry_idx ON daily_deals (industry_id)"
  });
  if (e3) console.error('Industry index error:', e3.message);
  else console.log('✅ Industry index created');

  console.log('\nMigration complete. daily_deals table is ready.');
}

run().catch(err => { console.error(err); process.exit(1); });
