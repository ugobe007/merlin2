#!/usr/bin/env node

/**
 * Run equipment_pricing table migration
 * Creates vendor-specific pricing table to eliminate 404 errors
 * 
 * Usage: node run_equipment_pricing_migration.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials');
  console.error('   Set VITE_SUPABASE_URL and SUPABASE_SERVICE_KEY (or VITE_SUPABASE_ANON_KEY)');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration() {
  try {
    console.log('🚀 Starting equipment_pricing table migration...\n');

    // Read migration file
    const migrationPath = join(__dirname, 'database', 'migrations', '20251213_create_equipment_pricing_table.sql');
    const sql = readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration file loaded:', migrationPath);
    console.log('📊 SQL length:', sql.length, 'characters\n');

    // Check if table already exists
    const { data: existingTable, error: checkError } = await supabase
      .from('equipment_pricing')
      .select('id')
      .limit(1);

    if (!checkError) {
      console.log('⚠️  Table equipment_pricing already exists');
      const { data: count } = await supabase
        .from('equipment_pricing')
        .select('id', { count: 'exact', head: true });
      console.log('   Current rows:', count || 0);
      console.log('\n✅ Migration already applied (skipping)');
      return;
    }

    console.log('📝 Executing migration SQL...\n');

    // Execute migration (Note: Supabase client doesn't support raw SQL execution)
    // This script documents the migration - run via Supabase SQL Editor or CLI
    console.log('⚠️  NOTE: This script documents the migration.');
    console.log('   To apply, run the SQL via:');
    console.log('   1. Supabase Dashboard → SQL Editor');
    console.log('   2. OR: supabase db push');
    console.log('   3. OR: Copy SQL from migration file and paste in SQL Editor\n');

    console.log('📋 Migration Summary:');
    console.log('   - Creates equipment_pricing table');
    console.log('   - Adds indexes for performance');
    console.log('   - Sets up RLS policies (public read, admin write)');
    console.log('   - Seeds with sample vendor pricing (CATL, BYD, Tesla, etc.)');
    console.log('   - Equipment types: battery, inverter, solar, wind, generator, transformer');
    console.log('   - Supports: $/kWh, $/kW, $/W, $/MVA pricing');
    console.log('\n✅ Migration documented successfully');
    console.log('\n🔗 Apply via: https://supabase.com/dashboard/project/_/sql/new');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();
