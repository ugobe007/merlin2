/**
 * Field Name Mismatch Audit Script
 * 
 * This script identifies ALL mismatches between:
 * 1. TrueQuote Engine field expectations
 * 2. Database actual field_name values
 * 3. Step5MagicFit subtype extraction
 * 
 * Run with: node scripts/audit_field_name_mismatches.mjs
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// ============================================================================
// TRUEQUOTE ENGINE EXPECTATIONS
// ============================================================================

const TRUEQUOTE_FIELD_EXPECTATIONS = {
  'data-center': {
    unitField: 'rackCount',
    subtypeField: 'tierClassification',  // ❌ Database uses 'dataCenterTier'
    pueField: 'powerUsageEffectiveness', // ❌ Database uses 'targetPUE'
    fieldMappings: {
      'racks': ['rackCount', 'racks', 'numberOfRacks']
    }
  },
  'hotel': {
    unitField: 'roomCount',
    subtypeField: 'hotelType',
    fieldMappings: {
      'rooms': ['roomCount', 'rooms', 'numberOfRooms', 'numRooms']
    }
  },
  'hospital': {
    unitField: 'bedCount',
    subtypeField: 'hospitalType',
    fieldMappings: {
      'beds': ['bedCount', 'beds', 'numberOfBeds']
    }
  },
  'car-wash': {
    unitField: 'bayCount',
    subtypeField: 'washType',
    fieldMappings: {
      'bays': ['bayCount', 'bays', 'numberOfBays', 'washBays', 'tunnelCount']
    }
  }
};

// ============================================================================
// STEP5MAGICFIT SUBTYPE EXTRACTION (from Step5MagicFit.tsx line 328-332)
// ============================================================================

const STEP5_SUBTYPE_EXTRACTION = {
  'data-center': ['tierClassification', 'tier_3'],  // ❌ Should also check 'dataCenterTier'
  'hotel': ['hotelType'],
  'hospital': ['hospitalType'],
  'car-wash': ['washType']
};

// ============================================================================
// DATABASE ACTUAL VALUES (from migration files)
// ============================================================================

const DATABASE_FIELD_NAMES = {
  'data-center': {
    unitField: 'rackCount',           // ✅ MATCH
    subtypeField: 'dataCenterTier',   // ❌ MISMATCH (code expects 'tierClassification')
    pueField: 'targetPUE',            // ❌ MISMATCH (code expects 'powerUsageEffectiveness')
    // From 20251212_fix_data_center_questions.sql
  },
  'hotel': {
    unitField: 'roomCount',           // ✅ Should match
    subtypeField: 'hotelType',        // ✅ Should match
  },
  'hospital': {
    unitField: 'bedCount',            // ✅ Should match
    subtypeField: 'hospitalType',     // ✅ Should match
  },
  'car-wash': {
    unitField: 'bayCount',            // ✅ Should match
    subtypeField: 'washType',         // ✅ Should match
  }
};

// ============================================================================
// GENERATE REPORT
// ============================================================================

console.log('═'.repeat(80));
console.log('FIELD NAME MISMATCH AUDIT REPORT');
console.log('═'.repeat(80));
console.log('');

Object.keys(TRUEQUOTE_FIELD_EXPECTATIONS).forEach(industry => {
  console.log(`\n📊 ${industry.toUpperCase()}`);
  console.log('-'.repeat(80));
  
  const trueQuote = TRUEQUOTE_FIELD_EXPECTATIONS[industry];
  const database = DATABASE_FIELD_NAMES[industry];
  const step5 = STEP5_SUBTYPE_EXTRACTION[industry];
  
  // Check unit field
  const unitMatch = trueQuote.unitField === database.unitField;
  console.log(`Unit Field: ${unitMatch ? '✅' : '❌'}`);
  console.log(`  TrueQuote expects: ${trueQuote.unitField}`);
  console.log(`  Database uses:     ${database.unitField}`);
  if (!unitMatch) {
    console.log(`  ⚠️  MISMATCH!`);
  }
  
  // Check subtype field
  if (database.subtypeField) {
    const subtypeMatch = trueQuote.subtypeField === database.subtypeField || 
                         step5.includes(database.subtypeField);
    console.log(`\nSubtype Field: ${subtypeMatch ? '✅' : '❌'}`);
    console.log(`  TrueQuote expects: ${trueQuote.subtypeField}`);
    console.log(`  Database uses:     ${database.subtypeField}`);
    console.log(`  Step5MagicFit checks: ${step5.join(', ')}`);
    if (!subtypeMatch) {
      console.log(`  ⚠️  MISMATCH! Step5MagicFit doesn't check '${database.subtypeField}'`);
    }
  }
  
  // Check PUE field (data-center only)
  if (industry === 'data-center' && database.pueField) {
    const pueMatch = trueQuote.pueField === database.pueField;
    console.log(`\nPUE Field: ${pueMatch ? '✅' : '❌'}`);
    console.log(`  TrueQuote expects: ${trueQuote.pueField} or 'pue'`);
    console.log(`  Database uses:     ${database.pueField}`);
    if (!pueMatch) {
      console.log(`  ⚠️  MISMATCH! TrueQuote Engine won't find PUE value`);
    }
  }
});

console.log('\n');
console.log('═'.repeat(80));
console.log('SUMMARY');
console.log('═'.repeat(80));
console.log('\n❌ CRITICAL MISMATCHES FOUND:');
console.log('  1. Data Center: tierClassification vs dataCenterTier');
console.log('  2. Data Center: powerUsageEffectiveness vs targetPUE');
console.log('\n✅ VERIFY THESE INDUSTRIES:');
console.log('  - Hotel: roomCount, hotelType');
console.log('  - Hospital: bedCount, hospitalType');
console.log('  - Car Wash: bayCount, washType');
console.log('\n📝 ACTION REQUIRED:');
console.log('  1. Update Step5MagicFit.tsx to check dataCenterTier');
console.log('  2. Update TrueQuoteEngine.ts to accept targetPUE');
console.log('  3. Audit all other industries for similar mismatches');
console.log('');
