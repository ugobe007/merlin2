#!/usr/bin/env node
/**
 * Generic SQL Migration Runner using Supabase Service Role
 * Usage: node scripts/run-sql-migration.mjs <migration-file.sql>
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { config } from 'dotenv';

// Load environment variables
config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://fvmpmozybmtzjvikrctq.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

async function runMigration(filePath) {
  console.log(`\n🚀 Running migration: ${filePath}\n`);
  
  // Read SQL file
  let sql;
  try {
    sql = readFileSync(filePath, 'utf-8');
  } catch (err) {
    console.error(`❌ Could not read file: ${filePath}`);
    console.error(err.message);
    process.exit(1);
  }
  
  // Split into statements (basic split on semicolons followed by newlines)
  // This handles most cases but not all edge cases
  const statements = sql
    .split(/;\s*\n/)
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));
  
  console.log(`📋 Found ${statements.length} SQL statements\n`);
  
  let success = 0;
  let failed = 0;
  let skipped = 0;
  
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    const preview = stmt.substring(0, 80).replace(/\n/g, ' ');
    
    // Skip pure comments
    if (stmt.match(/^--/) || stmt.match(/^\/\*/)) {
      skipped++;
      continue;
    }
    
    try {
      const { data, error } = await supabase.rpc('exec_sql', { sql: stmt + ';' });
      
      if (error) {
        // Try direct query for DDL statements
        const { error: directError } = await supabase.from('_migrations_log').select('*').limit(0);
        
        // Some errors are expected (like "already exists")
        if (error.message.includes('already exists') || 
            error.message.includes('does not exist') ||
            error.message.includes('duplicate key')) {
          console.log(`⏭️  [${i + 1}] Skipped (already applied): ${preview}...`);
          skipped++;
        } else {
          console.error(`❌ [${i + 1}] Failed: ${preview}...`);
          console.error(`   Error: ${error.message}`);
          failed++;
        }
      } else {
        console.log(`✅ [${i + 1}] ${preview}...`);
        success++;
      }
    } catch (err) {
      console.error(`❌ [${i + 1}] Exception: ${err.message}`);
      failed++;
    }
  }
  
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`📊 Migration Summary:`);
  console.log(`   ✅ Success: ${success}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   ❌ Failed:  ${failed}`);
  console.log(`${'═'.repeat(60)}\n`);
  
  return failed === 0;
}

// Get file path from command line
const filePath = process.argv[2];

if (!filePath) {
  console.log('Usage: node scripts/run-sql-migration.mjs <migration-file.sql>');
  console.log('Example: node scripts/run-sql-migration.mjs database/migrations/20251210_expanded_equipment_scraping.sql');
  process.exit(1);
}

runMigration(filePath)
  .then(ok => process.exit(ok ? 0 : 1))
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
