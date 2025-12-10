#!/usr/bin/env node
/**
 * SQL Migration Runner using Supabase REST API
 * Usage: node scripts/run-migration-rest.mjs <migration-file.sql>
 */

import { readFileSync } from 'fs';

// Hardcoded for this project - or read from .env manually
const SUPABASE_URL = 'https://fvmpmozybmtzjvikrctq.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2bXBtb3p5Ym10emp2aWtyY3RxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjI4MjI5MCwiZXhwIjoyMDc3ODU4MjkwfQ.pGemfuUEr17rYU1atovIgrfwLNZ7gcC0_k2wpmiHzAg';

if (!SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in .env');
  process.exit(1);
}

async function runSQL(sql) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ sql }),
  });
  
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text}`);
  }
  
  return response.json();
}

async function runMigration(filePath) {
  console.log(`\n🚀 Running migration: ${filePath}\n`);
  
  let sql;
  try {
    sql = readFileSync(filePath, 'utf-8');
  } catch (err) {
    console.error(`❌ Could not read file: ${filePath}`);
    process.exit(1);
  }
  
  console.log(`📋 Executing full SQL file...\n`);
  
  try {
    const result = await runSQL(sql);
    console.log('✅ Migration completed successfully!');
    console.log('Result:', result);
    return true;
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    
    // If exec_sql doesn't exist, provide instructions
    if (err.message.includes('404') || err.message.includes('not found')) {
      console.log('\n💡 The exec_sql function may not exist. Run this in Supabase SQL Editor first:');
      console.log(`
CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql;
  RETURN json_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;
`);
    }
    return false;
  }
}

const filePath = process.argv[2];
if (!filePath) {
  console.log('Usage: node scripts/run-migration-rest.mjs <migration-file.sql>');
  process.exit(1);
}

runMigration(filePath).then(ok => process.exit(ok ? 0 : 1));
