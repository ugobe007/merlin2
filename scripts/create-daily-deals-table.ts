/**
 * Creates the daily_deals table using the Supabase Management REST API.
 * This bypasses PostgREST and writes directly to the database.
 *
 * Run: npx tsx scripts/create-daily-deals-table.ts
 */
import 'dotenv/config';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const PROJECT_REF = SUPABASE_URL.replace('https://', '').replace('.supabase.co', '');

const SQL = `
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
);

CREATE INDEX IF NOT EXISTS daily_deals_date_idx     ON daily_deals (deal_date DESC);
CREATE INDEX IF NOT EXISTS daily_deals_industry_idx ON daily_deals (industry_id);
`;

async function run() {
  console.log(`Project ref: ${PROJECT_REF}`);
  console.log('Running SQL via Management API...');

  const res = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: SQL }),
    }
  );

  const body = await res.text();
  console.log('Status:', res.status);
  console.log('Body:', body);

  if (!res.ok) {
    // Fall back: try using the Supabase REST API to POST to a special endpoint
    console.log('\nManagement API failed. Trying direct pg approach...');
    await tryDirectPg();
  } else {
    console.log('✅ Table created via Management API');
  }
}

async function tryDirectPg() {
  // Use pg directly if DATABASE_URL is set
  const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
  if (!dbUrl) {
    console.log('No DATABASE_URL set. Trying pg via Supabase connection string...');
    // Construct from project ref
    const connStr = `postgresql://postgres.${PROJECT_REF}:${process.env.SUPABASE_DB_PASSWORD ?? ''}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`;
    console.log('Would need SUPABASE_DB_PASSWORD in .env');
    console.log('\nAlternative: Run this SQL in the Supabase Dashboard SQL Editor:');
    console.log('https://supabase.com/dashboard/project/' + PROJECT_REF + '/sql/new');
    console.log('\n--- SQL to paste ---');
    console.log(SQL);
    return;
  }
  
  const { default: pg } = await import('pg');
  const client = new pg.Client({ connectionString: dbUrl });
  await client.connect();
  await client.query(SQL);
  await client.end();
  console.log('✅ Table created via direct pg connection');
}

run().catch(err => { console.error(err); process.exit(1); });
