import 'dotenv/config';
import pg from 'pg';

const { Client } = pg;

const SQL = `
CREATE TABLE IF NOT EXISTS public.daily_deals (
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
);

CREATE INDEX IF NOT EXISTS daily_deals_date_idx     ON public.daily_deals (deal_date DESC);
CREATE INDEX IF NOT EXISTS daily_deals_industry_idx ON public.daily_deals (industry_id);
`;

const PASS = 'SxFviFGcyYvJHHUg';
const REF  = 'fvmpmozybmtzjvikrctq';

const configs = [
  // Legacy pooler URL (project-ref subdomain)
  { host: `${REF}.pooler.supabase.com`,           port: 6543, user: `postgres.${REF}`, password: PASS, database: 'postgres', ssl: { rejectUnauthorized: false }, label: 'legacy-pooler-tx' },
  { host: `${REF}.pooler.supabase.com`,           port: 5432, user: `postgres.${REF}`, password: PASS, database: 'postgres', ssl: { rejectUnauthorized: false }, label: 'legacy-pooler-session' },
  // New pooler URL (region-based) - various regions
  { host: 'aws-0-us-east-1.pooler.supabase.com', port: 6543, user: `postgres.${REF}`, password: PASS, database: 'postgres', ssl: { rejectUnauthorized: false }, label: 'pooler-tx-us-east-1' },
  { host: 'aws-0-us-east-1.pooler.supabase.com', port: 5432, user: `postgres.${REF}`, password: PASS, database: 'postgres', ssl: { rejectUnauthorized: false }, label: 'pooler-session-us-east-1' },
  // Direct connection, force IPv4
  { host: `db.${REF}.supabase.co`, port: 5432, user: 'postgres', password: PASS, database: 'postgres', ssl: { rejectUnauthorized: false }, family: 4, label: 'direct-ipv4' },
  // Direct connection, IPv6
  { host: `db.${REF}.supabase.co`, port: 5432, user: 'postgres', password: PASS, database: 'postgres', ssl: { rejectUnauthorized: false }, family: 6, label: 'direct-ipv6' },
];

async function tryConnect(cfg: typeof configs[0]) {
  const { label, ...connConfig } = cfg;
  const client = new Client(connConfig as any);
  console.log(`\nTrying ${label}...`);
  try {
    await client.connect();
    console.log(`  ✅ Connected!`);
    const res = await client.query(`SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name LIMIT 5`);
    console.log(`  Tables:`, res.rows.map((r: any) => r.table_name).join(', ') || '(none)');
    await client.query(SQL);
    console.log(`  ✅ daily_deals table created!`);
    await client.end();
    return true;
  } catch (e: any) {
    console.log(`  ❌ ${e.message}`);
    try { await client.end(); } catch (_) { /* ignore */ }
    return false;
  }
}

async function main() {
  for (const cfg of configs) {
    const ok = await tryConnect(cfg);
    if (ok) {
      console.log('\n✅ Done! Run the daily-deal agent now.');
      return;
    }
  }
  console.log('\n❌ All connection attempts failed.');
}

main().catch(console.error);
