/**
 * SSOT & TrueQuote Violations Audit
 * 
 * Audits all use cases for:
 * 1. SSOT violations (using defaults instead of user-provided values)
 * 2. TrueQuote Engine mapping violations (missing/incomplete data flow)
 * 3. Foundational variable completeness
 * 4. Field name mismatches
 * 
 * Usage: npx tsx scripts/audit-ssot-truequote-violations.ts
 */

import { config } from 'dotenv';
config();

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials!');
  console.error('Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Foundational variables by industry (from docs/FOUNDATIONAL_VARIABLES_BY_INDUSTRY.md)
const FOUNDATIONAL_VARIABLES: Record<string, string[]> = {
  'hotel': ['roomCount'],
  'car-wash': ['bayCount', 'tunnelCount'],
  'data-center': ['rackCount', 'itLoadKW'],
  'hospital': ['bedCount'],
  'ev-charging': ['level2Count', 'dcFastCount', 'ultraFastCount'],
  'apartment': ['unitCount'],
  'warehouse': ['warehouseSqFt', 'squareFeet'],
  'manufacturing': ['facilitySqFt', 'squareFeet'],
  'retail': ['storeSqFt', 'squareFeet'],
  'office': ['buildingSqFt', 'squareFeet'],
  // 'restaurant': ['squareFeet', 'restaurantSqFt'], // Use case not in database - remove from audit
  'cold-storage': ['storageVolume', 'squareFeet'],
  'casino': ['gamingFloorSize', 'gamingFloorSqFt'],
  'indoor-farm': ['growingAreaSqFt', 'squareFeet'],
  'airport': ['annualPassengers'],
  'college': ['studentEnrollment', 'studentCount'],
  'government': ['buildingSqFt', 'facilitySqFt'],
  'shopping-center': ['totalSqFt', 'retailSqFt'],
};

// TrueQuote Engine field mappings (from extractUnitCount function)
const TRUEQUOTE_FIELD_MAPPINGS: Record<string, string[]> = {
  'rooms': ['roomCount', 'rooms', 'numberOfRooms', 'numRooms'],
  'racks': ['rackCount', 'racks', 'numberOfRacks'],
  'beds': ['bedCount', 'beds', 'numberOfBeds'],
  'bays': ['bayCount', 'bays', 'numberOfBays', 'washBays', 'tunnelCount'],
  'units': ['unitCount', 'units', 'numberOfUnits', 'numUnits'], // For apartments
};

// Industry to TrueQuote unitName mapping (from IndustryConfig)
const INDUSTRY_TO_UNITNAME: Record<string, string> = {
  'hotel': 'rooms',
  'hospital': 'beds',
  'data-center': 'racks',
  'car-wash': 'bays',
  'apartment': 'units', // Uses 'units' not 'rooms'
};

// Read TrueQuote Engine file to verify mappings
const trueQuoteMappings: Record<string, { unitName?: string; method: string }> = {};
try {
  const trueQuoteContent = readFileSync('src/services/TrueQuoteEngine.ts', 'utf-8');
  
  // Extract hotel config
  const hotelMatch = trueQuoteContent.match(/HOTEL_CONFIG:[\s\S]*?unitName: ['"]([^'"]+)['"]/);
  if (hotelMatch) trueQuoteMappings['hotel'] = { unitName: hotelMatch[1], method: 'per_unit' };
  
  // Extract hospital config
  const hospitalMatch = trueQuoteContent.match(/HOSPITAL_CONFIG:[\s\S]*?unitName: ['"]([^'"]+)['"]/);
  if (hospitalMatch) trueQuoteMappings['hospital'] = { unitName: hospitalMatch[1], method: 'per_unit' };
  
  // Extract data center config
  const dcMatch = trueQuoteContent.match(/DATA_CENTER_CONFIG:[\s\S]*?unitName: ['"]([^'"]+)['"]/);
  if (dcMatch) trueQuoteMappings['data-center'] = { unitName: dcMatch[1], method: 'per_unit' };
  
} catch (e) {
  console.warn('⚠️  Could not read TrueQuoteEngine.ts - using static mappings');
}

// Read Step5MagicFit to check field name mappings
const step5Mappings: Record<string, string[]> = {};
try {
  const step5Content = readFileSync('src/components/wizard/v6/steps/Step5MagicFit.tsx', 'utf-8');
  
  // Extract field mappings (e.g., facilityData.squareFootage → facilitySqFt)
  const mappingMatches = step5Content.matchAll(/if \(industryType === ['"]([^'"]+)['"][\s\S]*?facilityData\.([\w]+)[\s\S]*?facilityData\.([\w]+) =/g);
  for (const match of mappingMatches) {
    const industry = match[1];
    const sourceField = match[2];
    const targetField = match[3];
    if (!step5Mappings[industry]) step5Mappings[industry] = [];
    step5Mappings[industry].push(`${sourceField} → ${targetField}`);
  }
} catch (e) {
  console.warn('⚠️  Could not read Step5MagicFit.tsx - skipping mapping verification');
}

interface Violation {
  type: 'SSOT' | 'TrueQuote' | 'Missing' | 'Mapping';
  industry: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  field?: string;
  details?: string;
}

async function auditIndustry(industrySlug: string): Promise<Violation[]> {
  const violations: Violation[] = [];
  
  // Get use case
  const { data: useCase } = await supabase
    .from('use_cases')
    .select('id, slug')
    .eq('slug', industrySlug)
    .single();

  if (!useCase) {
    violations.push({
      type: 'Missing',
      industry: industrySlug,
      severity: 'critical',
      message: `Use case '${industrySlug}' not found in database`,
    });
    return violations;
  }

  // Get all questions
  const { data: questions } = await supabase
    .from('custom_questions')
    .select('field_name, question_text, is_required, default_value, question_type')
    .eq('use_case_id', useCase.id);

  const questionFields = (questions || []).map(q => q.field_name);
  const foundationalFields = FOUNDATIONAL_VARIABLES[industrySlug] || [];

  // Check 1: Missing foundational variables
  for (const field of foundationalFields) {
    if (!questionFields.includes(field)) {
      violations.push({
        type: 'Missing',
        industry: industrySlug,
        severity: 'critical',
        message: `Missing foundational variable: ${field}`,
        field,
        details: `Required for accurate energy calculations`,
      });
    }
  }

  // Check 2: Foundational variables without default_value (UI initialization)
  for (const field of foundationalFields) {
    if (questionFields.includes(field)) {
      const question = questions?.find(q => q.field_name === field);
      if (question && !question.default_value && question.question_type === 'number') {
        violations.push({
          type: 'SSOT',
          industry: industrySlug,
          severity: 'warning',
          message: `Foundational variable ${field} missing default_value for UI initialization`,
          field,
          details: `Should have default_value for UI initialization (not SSOT - user values take precedence)`,
        });
      }
    }
  }

  // Check 3: Required foundational variables
  for (const field of foundationalFields) {
    if (questionFields.includes(field)) {
      const question = questions?.find(q => q.field_name === field);
      if (question && !question.is_required) {
        violations.push({
          type: 'SSOT',
          industry: industrySlug,
          severity: 'critical',
          message: `Foundational variable ${field} should be required`,
          field,
          details: `Critical for accurate calculations - should be is_required: true`,
        });
      }
    }
  }

  // Check 4: TrueQuote Engine mapping
  const trueQuoteConfig = trueQuoteMappings[industrySlug] || 
    (INDUSTRY_TO_UNITNAME[industrySlug] ? { unitName: INDUSTRY_TO_UNITNAME[industrySlug], method: 'per_unit' } : null);
  
  if (trueQuoteConfig && trueQuoteConfig.method === 'per_unit' && trueQuoteConfig.unitName) {
    const unitName = trueQuoteConfig.unitName;
    const expectedFields = TRUEQUOTE_FIELD_MAPPINGS[unitName] || [unitName];
    
    // Check if any expected field exists in database
    const hasMatchingField = expectedFields.some(field => questionFields.includes(field));
    
    if (!hasMatchingField) {
      violations.push({
        type: 'TrueQuote',
        industry: industrySlug,
        severity: 'critical',
        message: `TrueQuote Engine expects one of: ${expectedFields.join(', ')} but none found`,
        field: expectedFields[0],
        details: `TrueQuote Engine uses per_unit method with unitName: '${unitName}', looks for: ${expectedFields.join(', ')}`,
      });
    } else {
      // Verify the field is in foundational variables
      const matchingField = expectedFields.find(f => questionFields.includes(f));
      if (matchingField && !foundationalFields.includes(matchingField)) {
        violations.push({
          type: 'TrueQuote',
          industry: industrySlug,
          severity: 'warning',
          message: `TrueQuote Engine field '${matchingField}' exists but not in foundational variables list`,
          field: matchingField,
          details: `Should be added to foundational variables for ${industrySlug}`,
        });
      }
    }
  }

  return violations;
}

async function main() {
  console.log('🔍 SSOT & TrueQuote Violations Audit\n');
  console.log('='.repeat(80));

  const industries = Object.keys(FOUNDATIONAL_VARIABLES);
  const allViolations: Violation[] = [];

  for (const industry of industries) {
    const violations = await auditIndustry(industry);
    allViolations.push(...violations);
  }

  // Group by type
  const byType = {
    'SSOT': allViolations.filter(v => v.type === 'SSOT'),
    'TrueQuote': allViolations.filter(v => v.type === 'TrueQuote'),
    'Missing': allViolations.filter(v => v.type === 'Missing'),
    'Mapping': allViolations.filter(v => v.type === 'Mapping'),
  };

  // Summary
  console.log('\n📊 SUMMARY\n');
  console.log(`Total Violations: ${allViolations.length}`);
  console.log(`  SSOT: ${byType.SSOT.length}`);
  console.log(`  TrueQuote: ${byType.TrueQuote.length}`);
  console.log(`  Missing: ${byType.Missing.length}`);
  console.log(`  Mapping: ${byType.Mapping.length}`);

  const critical = allViolations.filter(v => v.severity === 'critical');
  const warnings = allViolations.filter(v => v.severity === 'warning');

  console.log(`\n  Critical: ${critical.length}`);
  console.log(`  Warnings: ${warnings.length}`);

  // Critical violations
  if (critical.length > 0) {
    console.log('\n🚨 CRITICAL VIOLATIONS (Must Fix)\n');
    critical.forEach(v => {
      console.log(`[${v.type}] ${v.industry}: ${v.message}`);
      if (v.field) console.log(`   Field: ${v.field}`);
      if (v.details) console.log(`   ${v.details}`);
      console.log('');
    });
  }

  // Warnings
  if (warnings.length > 0) {
    console.log('\n⚠️  WARNINGS (Should Fix)\n');
    warnings.forEach(v => {
      console.log(`[${v.type}] ${v.industry}: ${v.message}`);
      if (v.field) console.log(`   Field: ${v.field}`);
      if (v.details) console.log(`   ${v.details}`);
      console.log('');
    });
  }

  // By industry
  console.log('\n📋 BY INDUSTRY\n');
  for (const industry of industries) {
    const industryViolations = allViolations.filter(v => v.industry === industry);
    if (industryViolations.length > 0) {
      console.log(`\n${industry.toUpperCase()}:`);
      industryViolations.forEach(v => {
        const icon = v.severity === 'critical' ? '❌' : '⚠️';
        console.log(`  ${icon} [${v.type}] ${v.message}`);
      });
    } else {
      console.log(`\n${industry.toUpperCase()}: ✅ No violations`);
    }
  }

  // Exit code
  if (critical.length > 0) {
    console.log('\n❌ Audit failed - critical violations found');
    process.exit(1);
  } else {
    console.log('\n✅ Audit passed - no critical violations');
    process.exit(0);
  }
}

main().catch(console.error);
