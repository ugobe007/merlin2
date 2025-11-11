/**
 * Database Configuration Verification Script
 * 
 * Checks that all use cases have proper configurations in the database.
 * Run this to verify baseline service has data to work with.
 * 
 * Usage: 
 *   npm run verify-db-config
 * 
 * Or directly:
 *   npx tsx src/scripts/verifyDatabaseConfig.ts
 */

import { useCaseService } from '../services/useCaseService';

const EXPECTED_USE_CASES = [
  'hotel',
  'hospital',
  'data-center',
  'manufacturing',
  'ev-charging',
  'car-wash',
  'airport',
  'microgrid',
  'residential',
  'commercial'
];

interface VerificationResult {
  useCase: string;
  exists: boolean;
  hasDefaultConfig: boolean;
  typicalLoadKw?: number;
  preferredDurationHours?: number;
  error?: string;
}

async function verifyDatabaseConfigurations(): Promise<void> {
  console.log('🔍 Verifying Database Configurations...\n');
  console.log('=' .repeat(80));
  
  const results: VerificationResult[] = [];
  let successCount = 0;
  let failureCount = 0;

  for (const useCaseSlug of EXPECTED_USE_CASES) {
    try {
      const useCase = await useCaseService.getUseCaseBySlug(useCaseSlug);
      
      const defaultConfig = useCase.configurations?.find(c => c.is_default);
      
      const result: VerificationResult = {
        useCase: useCaseSlug,
        exists: true,
        hasDefaultConfig: !!defaultConfig,
        typicalLoadKw: defaultConfig?.typical_load_kw,
        preferredDurationHours: defaultConfig?.preferred_duration_hours
      };
      
      results.push(result);
      
      if (result.hasDefaultConfig && result.typicalLoadKw) {
        console.log(`✅ ${useCaseSlug.padEnd(20)} | ${result.typicalLoadKw.toString().padStart(8)} kW | ${result.preferredDurationHours || 4} hrs`);
        successCount++;
      } else {
        console.log(`⚠️  ${useCaseSlug.padEnd(20)} | Missing default configuration`);
        failureCount++;
      }
      
    } catch (error) {
      const result: VerificationResult = {
        useCase: useCaseSlug,
        exists: false,
        hasDefaultConfig: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      
      results.push(result);
      console.log(`❌ ${useCaseSlug.padEnd(20)} | Database error: ${result.error}`);
      failureCount++;
    }
  }
  
  console.log('=' .repeat(80));
  console.log(`\n📊 Summary: ${successCount} configured, ${failureCount} missing/errors\n`);
  
  // Detailed report
  if (failureCount > 0) {
    console.log('⚠️  Issues Found:\n');
    
    const missingConfigs = results.filter(r => r.exists && !r.hasDefaultConfig);
    if (missingConfigs.length > 0) {
      console.log('Missing Default Configurations:');
      missingConfigs.forEach(r => console.log(`  - ${r.useCase}`));
      console.log();
    }
    
    const missingUseCases = results.filter(r => !r.exists);
    if (missingUseCases.length > 0) {
      console.log('Missing Use Cases:');
      missingUseCases.forEach(r => console.log(`  - ${r.useCase}: ${r.error}`));
      console.log();
    }
    
    console.log('💡 Recommendations:');
    console.log('  1. Check Supabase connection in .env file');
    console.log('  2. Run database migrations: npm run migrate');
    console.log('  3. Seed database with use cases: npm run seed');
    console.log('  4. Check docs/SUPABASE_SCHEMA.sql for table structure\n');
  }
  
  // Fallback verification
  console.log('🔄 Fallback Mechanisms:\n');
  console.log('Baseline service includes fallback values for:');
  console.log('  - hotel (2.93 MW, 4 hrs)');
  console.log('  - data-center (5.0 MW, 4 hrs)');
  console.log('  - hospital (8.0 MW, 6 hrs)');
  console.log('  - manufacturing (10.0 MW, 4 hrs)');
  console.log('  - ev-charging (uses calculated values from charger specs)');
  console.log('  - generic (2.0 MW, 4 hrs for unknown use cases)\n');
  
  console.log('✅ System will continue to work even with missing database configs');
  console.log('   but database values are preferred for accuracy.\n');
  
  // Exit with appropriate code
  process.exit(failureCount > 0 ? 1 : 0);
}

// Run verification
verifyDatabaseConfigurations().catch(error => {
  console.error('❌ Fatal error during verification:', error);
  process.exit(1);
});
