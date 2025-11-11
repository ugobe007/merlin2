/**
 * Industry Baselines Database Migration Script
 * 
 * Purpose: Migrate industry baseline data from code to Supabase database
 * Source: /src/utils/industryBaselines.ts
 * Target: Supabase industry_baselines table
 * 
 * Usage:
 *   npm install @supabase/supabase-js dotenv
 *   node scripts/migrate-industry-baselines.js
 * 
 * Or with tsx:
 *   npx tsx scripts/migrate-industry-baselines.ts
 */

import { createClient } from '@supabase/supabase-js';
import { INDUSTRY_BASELINES } from '../src/utils/industryBaselines';

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials!');
  console.error('Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateIndustryBaselines() {
  console.log('🚀 Starting Industry Baselines Migration...\n');
  
  const industries = Object.entries(INDUSTRY_BASELINES);
  console.log(`📊 Found ${industries.length} industries to migrate:\n`);
  
  let successCount = 0;
  let errorCount = 0;
  const errors: Array<{industry: string; error: any}> = [];
  
  for (const [key, baseline] of industries) {
    try {
      console.log(`   Migrating ${baseline.industry} (${key})...`);
      
      // Upsert (insert or update) the baseline data
      const { data, error } = await supabase
        .from('industry_baselines')
        .upsert({
          industry_key: key,
          industry_name: baseline.industry,
          power_mw_per_unit: baseline.powerMWPerUnit,
          scale_unit: baseline.scaleUnit,
          typical_duration_hrs: baseline.typicalDurationHrs,
          solar_ratio: baseline.solarRatio,
          description: baseline.description,
          data_source: baseline.dataSource,
          last_updated: 'Q4 2025',
          is_active: true,
          created_by: 'migration-script',
          updated_by: 'migration-script'
        }, {
          onConflict: 'industry_key' // Update if exists
        });
      
      if (error) {
        throw error;
      }
      
      console.log(`   ✅ ${baseline.industry} migrated successfully`);
      successCount++;
      
    } catch (error) {
      console.error(`   ❌ Failed to migrate ${baseline.industry}:`, error);
      errorCount++;
      errors.push({ industry: baseline.industry, error });
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📈 Migration Summary:');
  console.log('='.repeat(60));
  console.log(`✅ Successful: ${successCount}/${industries.length}`);
  console.log(`❌ Failed: ${errorCount}/${industries.length}`);
  
  if (errors.length > 0) {
    console.log('\n🔍 Errors:');
    errors.forEach(({ industry, error }) => {
      console.log(`   • ${industry}: ${error.message || error}`);
    });
  }
  
  // Verification query
  console.log('\n🔍 Verifying migration...');
  const { data: verifyData, error: verifyError } = await supabase
    .from('industry_baselines')
    .select('industry_key, industry_name, power_mw_per_unit, scale_unit')
    .eq('is_active', true);
  
  if (verifyError) {
    console.error('❌ Verification failed:', verifyError);
  } else {
    console.log(`✅ Verified ${verifyData?.length || 0} active industry baselines in database`);
    
    // Show sample data
    if (verifyData && verifyData.length > 0) {
      console.log('\n📋 Sample Records:');
      verifyData.slice(0, 5).forEach(record => {
        console.log(`   • ${record.industry_name}: ${record.power_mw_per_unit} MW per ${record.scale_unit}`);
      });
      if (verifyData.length > 5) {
        console.log(`   ... and ${verifyData.length - 5} more`);
      }
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✨ Migration complete!');
  console.log('='.repeat(60));
  console.log('\n💡 Next steps:');
  console.log('   1. Verify data in Supabase Studio');
  console.log('   2. Update service layer to fetch from database');
  console.log('   3. Test with code fallback enabled');
  console.log('   4. Monitor performance and cache hit rates\n');
}

// Run migration
migrateIndustryBaselines()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n💥 Migration failed with unexpected error:', error);
    process.exit(1);
  });
