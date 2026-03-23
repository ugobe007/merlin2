/**
 * Apply Cleanup Migration and Test Results
 * 
 * Runs the junk opportunity cleanup and shows before/after stats
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase credentials.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function runCleanup() {
  console.log('========================================');
  console.log('Running Opportunity Cleanup');
  console.log('========================================\n');
  
  // Count before
  const { count: beforeCount } = await supabase
    .from('opportunities')
    .select('*', { count: 'exact', head: true });
  
  console.log(`Before cleanup: ${beforeCount} opportunities\n`);
  
  // Read and execute cleanup migration
  const migrationPath = resolve(__dirname, '../supabase/migrations/20260320_cleanup_junk_opportunities.sql');
  const migrationSQL = readFileSync(migrationPath, 'utf-8');
  
  console.log('Executing cleanup migration...');
  
  // Split by statement and execute
  const statements = migrationSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));
  
  for (const statement of statements) {
    if (statement.includes('DELETE FROM opportunities')) {
      const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
      if (error) {
        console.error('Error executing DELETE:', error);
      } else {
        console.log('✓ Deleted junk opportunities');
      }
    }
  }
  
  // Count after
  const { count: afterCount } = await supabase
    .from('opportunities')
    .select('*', { count: 'exact', head: true });
  
  console.log(`\nAfter cleanup: ${afterCount} opportunities`);
  console.log(`Removed: ${(beforeCount || 0) - (afterCount || 0)} junk entries\n`);
  
  // Show remaining opportunities
  const { data: remaining } = await supabase
    .from('opportunities')
    .select('company_name, confidence_score, signals, source_name')
    .order('confidence_score', { ascending: false })
    .limit(15);
  
  console.log('=== TOP REMAINING OPPORTUNITIES ===');
  remaining?.forEach((opp, i) => {
    console.log(`\n${i + 1}. ${opp.company_name} (${opp.confidence_score}%)`);
    console.log(`   Signals: ${opp.signals.join(', ')}`);
    console.log(`   Source: ${opp.source_name}`);
  });
}

runCleanup()
  .then(() => {
    console.log('\n✓ Cleanup complete');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
