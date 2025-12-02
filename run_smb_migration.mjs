/**
 * Run SMB Platform Migration via Supabase JS
 */
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log('🚀 Running SMB Platform Migration...\n');
  
  // We can't run raw SQL via anon key, so let's create tables via RPC or manually
  // Instead, let's test what tables exist and insert data
  
  // Test calculation_constants
  console.log('📊 Testing calculation_constants table...');
  const { data: constants, error: constError } = await supabase
    .from('calculation_constants')
    .select('key, value_numeric')
    .limit(5);
  
  if (constError) {
    console.log('   ❌ Table does not exist or error:', constError.message);
    console.log('\n📋 You need to run this SQL in Supabase Dashboard > SQL Editor:');
    console.log('   https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new\n');
    
    // Read and print the migration file
    const migrationPath = path.join(__dirname, 'database/migrations/20251130_smb_platform_tables.sql');
    if (fs.existsSync(migrationPath)) {
      console.log('   Migration file: database/migrations/20251130_smb_platform_tables.sql');
    }
  } else {
    console.log('   ✅ Table exists with', constants?.length || 0, 'constants');
    constants?.forEach(c => console.log(`      - ${c.key}: ${c.value_numeric}`));
  }
  
  // Test smb_sites
  console.log('\n🌐 Testing smb_sites table...');
  const { data: sites, error: sitesError } = await supabase
    .from('smb_sites')
    .select('slug, name')
    .limit(5);
  
  if (sitesError) {
    console.log('   ❌ Table does not exist:', sitesError.message);
  } else {
    console.log('   ✅ Table exists with', sites?.length || 0, 'sites');
  }
  
  // Test smb_leads
  console.log('\n📧 Testing smb_leads table...');
  const { data: leads, error: leadsError } = await supabase
    .from('smb_leads')
    .select('id')
    .limit(1);
  
  if (leadsError) {
    console.log('   ❌ Table does not exist:', leadsError.message);
  } else {
    console.log('   ✅ Table exists');
  }
  
  // Test industry_power_profiles
  console.log('\n⚡ Testing industry_power_profiles table...');
  const { data: profiles, error: profilesError } = await supabase
    .from('industry_power_profiles')
    .select('industry_slug, typical_peak_demand_kw')
    .limit(5);
  
  if (profilesError) {
    console.log('   ❌ Table does not exist:', profilesError.message);
  } else {
    console.log('   ✅ Table exists with', profiles?.length || 0, 'profiles');
    profiles?.forEach(p => console.log(`      - ${p.industry_slug}: ${p.typical_peak_demand_kw} kW`));
  }
  
  console.log('\n✨ Migration check complete!');
}

runMigration().catch(console.error);
