#!/usr/bin/env node
/**
 * One-shot: apply 20260413_health_check_tables.sql via direct pg connection
 */
import pg from 'pg';
import { readFileSync } from 'fs';

const { Client } = pg;
const SQL = readFileSync('supabase/migrations/20260413_health_check_tables.sql', 'utf-8');

import { config } from 'dotenv';
config();

const REF  = 'fvmpmozybmtzjvikrctq';
// Pooler password (IqAQFsAPaY25j9jR) vs direct-connection password (YSyHG0FABFExsH9P)
const PASS_POOL   = process.env.SUPABASE_DB_PASSWORD || 'IqAQFsAPaY25j9jR';
const PASS_DIRECT = 'YSyHG0FABFExsH9P';

const configs = [
  { host: `aws-0-us-east-1.pooler.supabase.com`, port: 6543, user: `postgres.${REF}`, password: PASS_POOL,   database: 'postgres', ssl: { rejectUnauthorized: false }, label: 'pooler-tx-us-east-1' },
  { host: `aws-0-us-east-1.pooler.supabase.com`, port: 5432, user: `postgres.${REF}`, password: PASS_POOL,   database: 'postgres', ssl: { rejectUnauthorized: false }, label: 'pooler-session-us-east-1' },
  { host: `db.${REF}.supabase.co`,                port: 5432, user: 'postgres',        password: PASS_DIRECT, database: 'postgres', ssl: { rejectUnauthorized: false }, family: 4, label: 'direct-ipv4' },
  { host: `db.${REF}.supabase.co`,                port: 6543, user: 'postgres',        password: PASS_DIRECT, database: 'postgres', ssl: { rejectUnauthorized: false }, label: 'direct-port6543' },
];

for (const { label, ...connConfig } of configs) {
  const client = new Client(connConfig);
  console.log(`\nTrying ${label}...`);
  try {
    await client.connect();
    console.log(`Connected ✓`);
    await client.query(SQL);
    console.log(`✅ Migration applied successfully via ${label}`);
    await client.end();
    process.exit(0);
  } catch (e) {
    console.log(`❌ ${e.message.slice(0, 140)}`);
    try { await client.end(); } catch {}
  }
}

console.error('\nAll connection attempts failed');
process.exit(1);
