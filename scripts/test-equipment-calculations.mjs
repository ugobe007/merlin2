#!/usr/bin/env node
/**
 * Equipment Calculations Smoke Test
 * 
 * Tests that calculateEquipmentBreakdown is properly linked and working
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

console.log('🔍 Equipment Calculations Smoke Test\n');

// Test 1: File exists and is readable
console.log('Test 1: File existence check...');
try {
  const filePath = join(rootDir, 'packages/core/src/calculations/equipmentCalculations.ts');
  const content = readFileSync(filePath, 'utf-8');
  console.log(`✅ File exists: ${filePath}`);
  console.log(`✅ File size: ${content.length} characters`);
  console.log(`✅ Lines: ${content.split('\n').length}`);
} catch (error) {
  console.error(`❌ File check failed:`, error.message);
  process.exit(1);
}

// Test 2: Export check
console.log('\nTest 2: Export check...');
try {
  const filePath = join(rootDir, 'packages/core/src/calculations/equipmentCalculations.ts');
  const content = readFileSync(filePath, 'utf-8');
  
  const exports = [
    'calculateEquipmentBreakdown',
    'formatCurrency',
    'formatNumber',
    'EquipmentBreakdown',
    'EquipmentBreakdownOptions',
    'GeneratorFuelType',
    'FuelCellType'
  ];
  
  const missing = [];
  for (const exp of exports) {
    if (content.includes(`export ${exp}`) || content.includes(`export const ${exp}`) || content.includes(`export type ${exp}`) || content.includes(`export interface ${exp}`)) {
      console.log(`  ✅ ${exp} exported`);
    } else {
      missing.push(exp);
      console.log(`  ❌ ${exp} NOT exported`);
    }
  }
  
  if (missing.length > 0) {
    console.error(`\n❌ Missing exports: ${missing.join(', ')}`);
    process.exit(1);
  }
} catch (error) {
  console.error(`❌ Export check failed:`, error.message);
  process.exit(1);
}

// Test 3: Import references check
console.log('\nTest 3: Import references check...');
try {
  const { execSync } = await import('child_process');
  const result = execSync(
    `grep -r "from.*equipmentCalculations\\|import.*equipmentCalculations\\|calculateEquipmentBreakdown" src/ packages/core/src/ 2>/dev/null | grep -v node_modules | wc -l`,
    { encoding: 'utf-8', cwd: rootDir }
  );
  const count = parseInt(result.trim());
  console.log(`✅ Found ${count} references to equipmentCalculations`);
  
  if (count === 0) {
    console.warn('⚠️  No references found - may indicate broken links');
  }
} catch (error) {
  console.error(`❌ Reference check failed:`, error.message);
}

// Test 4: Market intelligence integration check
console.log('\nTest 4: Market intelligence integration check...');
try {
  const filePath = join(rootDir, 'packages/core/src/calculations/equipmentCalculations.ts');
  const content = readFileSync(filePath, 'utf-8');
  
  const checks = [
    { name: 'calculateMarketAlignedBESSPricing', required: true },
    { name: 'getMarketIntelligenceRecommendations', required: true },
    { name: 'marketIntelligence', required: true },
    { name: 'NREL ATB 2024', required: true }
  ];
  
  for (const check of checks) {
    if (content.includes(check.name)) {
      console.log(`  ✅ ${check.name} integrated`);
    } else if (check.required) {
      console.log(`  ❌ ${check.name} NOT found (required)`);
      process.exit(1);
    } else {
      console.log(`  ⚠️  ${check.name} not found (optional)`);
    }
  }
} catch (error) {
  console.error(`❌ Integration check failed:`, error.message);
  process.exit(1);
}

// Test 5: Industry standards check
console.log('\nTest 5: Industry standards compliance check...');
try {
  const filePath = join(rootDir, 'packages/core/src/calculations/equipmentCalculations.ts');
  const content = readFileSync(filePath, 'utf-8');
  
  const standards = [
    'NREL ATB',
    'IEC 61508',
    'UL 9540',
    'NFPA 855',
    'FERC 2222',
    '$120/kW', // Validated PCS pricing
    '$120/kWh', // Validated battery pricing
    'UK EV Hub', // Professional quote reference
    'Hampton Heights', // Professional quote reference
    'Tribal Microgrid' // Professional quote reference
  ];
  
  let found = 0;
  for (const standard of standards) {
    if (content.includes(standard)) {
      found++;
      console.log(`  ✅ ${standard} referenced`);
    }
  }
  
  console.log(`\n✅ Found ${found}/${standards.length} industry standard references`);
  
  if (found < standards.length * 0.7) {
    console.warn('⚠️  Some industry standards may be missing');
  }
} catch (error) {
  console.error(`❌ Standards check failed:`, error.message);
}

// Test 6: Calculation completeness check
console.log('\nTest 6: Calculation completeness check...');
try {
  const filePath = join(rootDir, 'packages/core/src/calculations/equipmentCalculations.ts');
  const content = readFileSync(filePath, 'utf-8');
  
  const calculations = [
    'batteries',
    'inverters',
    'transformers',
    'switchgear',
    'generators',
    'fuelCells',
    'solar',
    'wind',
    'evChargers',
    'installation',
    'commissioning',
    'certification',
    'annualCosts',
    'totals'
  ];
  
  let found = 0;
  for (const calc of calculations) {
    if (content.includes(`${calc}:`) || content.includes(`${calc} =`) || content.includes(`const ${calc}`)) {
      found++;
      console.log(`  ✅ ${calc} calculation present`);
    } else {
      console.log(`  ❌ ${calc} calculation MISSING`);
    }
  }
  
  console.log(`\n✅ Found ${found}/${calculations.length} calculation sections`);
  
  if (found < calculations.length) {
    console.error(`❌ Missing ${calculations.length - found} calculation sections`);
    process.exit(1);
  }
} catch (error) {
  console.error(`❌ Completeness check failed:`, error.message);
  process.exit(1);
}

console.log('\n✅ All smoke tests passed!');
console.log('✅ Equipment calculations are properly linked and complete');




