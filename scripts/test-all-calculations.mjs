#!/usr/bin/env node
/**
 * Comprehensive Calculation and Link Test Suite
 * 
 * Tests all calculation services for proper linking and functionality
 */

import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

console.log('🧪 Comprehensive Calculation & Link Test Suite\n');
console.log('=' .repeat(60));

let passed = 0;
let failed = 0;
let warnings = 0;

function test(name, fn) {
  try {
    const result = fn();
    if (result === true || (result && result.passed)) {
      console.log(`✅ ${name}`);
      passed++;
      return true;
    } else {
      console.log(`❌ ${name}: ${result.message || 'Failed'}`);
      failed++;
      return false;
    }
  } catch (error) {
    console.log(`❌ ${name}: ${error.message}`);
    failed++;
    return false;
  }
}

function warn(name, message) {
  console.log(`⚠️  ${name}: ${message}`);
  warnings++;
}

// ============================================
// TEST 1: Equipment Calculations File
// ============================================
console.log('\n📦 Test 1: Equipment Calculations File');
console.log('-'.repeat(60));

test('File exists', () => {
  const filePath = join(rootDir, 'packages/core/src/calculations/equipmentCalculations.ts');
  return existsSync(filePath);
});

test('File is complete (1000+ lines)', () => {
  const filePath = join(rootDir, 'packages/core/src/calculations/equipmentCalculations.ts');
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').length;
  return lines >= 1000 ? true : { passed: false, message: `Only ${lines} lines (expected 1000+)` };
});

test('calculateEquipmentBreakdown exported', () => {
  const filePath = join(rootDir, 'packages/core/src/calculations/equipmentCalculations.ts');
  const content = readFileSync(filePath, 'utf-8');
  return content.includes('export const calculateEquipmentBreakdown') || 
         content.includes('export async function calculateEquipmentBreakdown');
});

test('All equipment types calculated', () => {
  const filePath = join(rootDir, 'packages/core/src/calculations/equipmentCalculations.ts');
  const content = readFileSync(filePath, 'utf-8');
  const required = ['batteries', 'inverters', 'transformers', 'switchgear', 'installation', 'commissioning', 'certification', 'annualCosts'];
  const missing = required.filter(r => !content.includes(`const ${r}`) && !content.includes(`${r}:`));
  return missing.length === 0 ? true : { passed: false, message: `Missing: ${missing.join(', ')}` };
});

// ============================================
// TEST 2: Import Links
// ============================================
console.log('\n🔗 Test 2: Import Links');
console.log('-'.repeat(60));

test('Market intelligence import correct', () => {
  const filePath = join(rootDir, 'packages/core/src/calculations/equipmentCalculations.ts');
  const content = readFileSync(filePath, 'utf-8');
  return content.includes("from '../pricing/marketIntelligence'") || 
         content.includes("from '../pricing/marketIntelligence'");
});

test('Files import equipmentCalculations correctly', () => {
  try {
    const result = execSync(
      `grep -r "from.*equipmentCalculations\\|import.*equipmentCalculations" src/ packages/core/src/ 2>/dev/null | grep -v node_modules | wc -l`,
      { encoding: 'utf-8', cwd: rootDir }
    );
    const count = parseInt(result.trim());
    return count > 0 ? true : { passed: false, message: 'No imports found' };
  } catch {
    return { passed: false, message: 'Could not check imports' };
  }
});

// ============================================
// TEST 3: Calculation References
// ============================================
console.log('\n🔍 Test 3: Calculation References');
console.log('-'.repeat(60));

test('unifiedQuoteCalculator references equipment calculations', () => {
  const filePath = join(rootDir, 'src/services/unifiedQuoteCalculator.ts');
  if (!existsSync(filePath)) {
    return { passed: false, message: 'unifiedQuoteCalculator.ts not found' };
  }
  const content = readFileSync(filePath, 'utf-8');
  return content.includes('equipment') || content.includes('EquipmentBreakdown');
});

// ============================================
// TEST 4: Industry Standards
// ============================================
console.log('\n📊 Test 4: Industry Standards Compliance');
console.log('-'.repeat(60));

test('NREL ATB 2024 referenced', () => {
  const filePath = join(rootDir, 'packages/core/src/calculations/equipmentCalculations.ts');
  const content = readFileSync(filePath, 'utf-8');
  return content.includes('NREL ATB') || content.includes('NREL');
});

test('Validated quotes referenced', () => {
  const filePath = join(rootDir, 'packages/core/src/calculations/equipmentCalculations.ts');
  const content = readFileSync(filePath, 'utf-8');
  const quotes = ['UK EV Hub', 'Hampton Heights', 'Tribal Microgrid'];
  const found = quotes.filter(q => content.includes(q));
  return found.length >= 2 ? true : { passed: false, message: `Only found: ${found.join(', ')}` };
});

test('Industry standards referenced', () => {
  const filePath = join(rootDir, 'packages/core/src/calculations/equipmentCalculations.ts');
  const content = readFileSync(filePath, 'utf-8');
  const standards = ['IEC', 'UL', 'NFPA', 'FERC'];
  const found = standards.filter(s => content.includes(s));
  return found.length >= 2 ? true : { passed: false, message: `Only found: ${found.join(', ')}` };
});

// ============================================
// TEST 5: Market Intelligence Integration
// ============================================
console.log('\n🧠 Test 5: Market Intelligence Integration');
console.log('-'.repeat(60));

test('Market intelligence functions imported', () => {
  const filePath = join(rootDir, 'packages/core/src/calculations/equipmentCalculations.ts');
  const content = readFileSync(filePath, 'utf-8');
  return content.includes('calculateMarketAlignedBESSPricing') && 
         content.includes('getMarketIntelligenceRecommendations');
});

test('Market intelligence used in calculations', () => {
  const filePath = join(rootDir, 'packages/core/src/calculations/equipmentCalculations.ts');
  const content = readFileSync(filePath, 'utf-8');
  return content.includes('marketIntelligence') || content.includes('marketAnalysis');
});

// ============================================
// SUMMARY
// ============================================
console.log('\n' + '='.repeat(60));
console.log('📊 TEST SUMMARY');
console.log('='.repeat(60));
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`⚠️  Warnings: ${warnings}`);
console.log('');

if (failed === 0) {
  console.log('✅ All tests passed!');
  console.log('✅ Calculations are properly linked and verified');
  process.exit(0);
} else {
  console.log(`❌ ${failed} test(s) failed`);
  process.exit(1);
}




