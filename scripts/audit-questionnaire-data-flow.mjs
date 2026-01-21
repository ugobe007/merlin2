#!/usr/bin/env node
/**
 * QUESTIONNAIRE DATA FLOW AUDIT SCRIPT
 * 
 * Audits the complete data flow from:
 * 1. Database custom_questions (field_name)
 * 2. → Step 3 UI rendering
 * 3. → WizardV6.tsx estimatedPowerMetrics useMemo
 * 4. → Power gauge / BESS sizing
 * 
 * This script identifies:
 * - Field names in the database that are NOT handled in power calculations
 * - Expected field names in code that DON'T exist in the database
 * - Industries missing power calculation handlers
 * 
 * Run with: node scripts/audit-questionnaire-data-flow.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// =============================================================================
// CONFIGURATION
// =============================================================================

// Load env from .env file
const envPath = join(rootDir, '.env');
let SUPABASE_URL, SUPABASE_ANON_KEY;
try {
  const envContent = readFileSync(envPath, 'utf-8');
  const envLines = envContent.split('\n');
  for (const line of envLines) {
    if (line.startsWith('VITE_SUPABASE_URL=')) {
      SUPABASE_URL = line.split('=')[1].trim();
    }
    if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) {
      SUPABASE_ANON_KEY = line.split('=')[1].trim();
    }
  }
} catch (e) {
  console.error('❌ Could not read .env file:', e.message);
  process.exit(1);
}

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// =============================================================================
// EXPECTED FIELD NAMES BY INDUSTRY (from WizardV6.tsx estimatedPowerMetrics)
// Updated Jan 20, 2026 to match actual DB field names
// =============================================================================

const CODE_EXPECTED_FIELDS = {
  'hotel': ['roomCount', 'numberOfRooms', 'facilitySize', 'hotelCategory', 'hotelClass', 'facilityType'],
  'hospital': ['bedCount', 'numberOfBeds', 'facilitySize', 'icuBeds', 'operatingRooms', 'totalSqFt'],
  'data-center': ['itLoadKW', 'totalITLoad', 'powerCapacity', 'currentPUE', 'pue', 'rackCount', 'tierLevel'],
  'car-wash': ['bayCount', 'numberOfBays', 'facilityType', 'washType', 'operatingModel'],
  'ev-charging': ['level2Count', 'level2Chargers', 'l2Count', 'dcfc50Count', 'dcfcHighCount', 'dcFastCount', 'dcfcChargers', 'dcfcCount', 'ultraFastCount', 'megawattCount', 'hpcChargers', 'hpcCount'],
  'manufacturing': ['manufacturingSqFt', 'facilitySqFt', 'squareFootage', 'manufacturingType'],
  'warehouse': ['warehouseSqFt', 'facilitySqFt', 'squareFootage', 'hasColdStorage', 'refrigeratedArea', 'warehouseType'],
  'office': ['officeSqFt', 'totalSqFt', 'buildingSqFt', 'squareFootage', 'facilitySqFt', 'buildingClass'],
  'retail': ['retailSqFt', 'storeSqFt', 'squareFootage', 'totalSqFt'],
  'shopping-center': ['retailSqFt', 'storeSqFt', 'mallSqFt', 'glaSqFt', 'totalSqFt', 'squareFootage'],
  'college': ['studentPopulation', 'studentEnrollment', 'studentCount', 'enrollment', 'totalSqFt'],
  'university': ['studentPopulation', 'studentEnrollment', 'studentCount', 'enrollment', 'totalSqFt'],
  'airport': ['annualPassengers', 'terminalSqFt', 'gateCount'],
  'casino': ['gamingFloorSqft', 'gamingFloorSize', 'totalSqFt', 'squareFootage', 'hotelRooms', 'slotMachines'],
  'restaurant': ['squareFootage', 'diningAreaSqft', 'seatCount', 'kitchenEquipment', 'primaryCookingEquipment', 'hasKitchenHood', 'hasCommercialKitchenHood', 'hasWalkInFreezer', 'hasWalkInRefrigeration', 'hasWalkInCooler', 'refrigerationCount', 'restaurantType'],
  'apartment': ['totalUnits', 'unitCount', 'numberOfUnits', 'homeSqFt', 'avgUnitSize', 'buildingCount'],
  'residential': ['totalUnits', 'unitCount', 'numberOfUnits', 'homeSqFt'],
  // NEW: Added handlers Jan 20, 2026
  'cold-storage': ['refrigeratedSqFt', 'totalSqFt', 'squareFootage', 'storageCapacity', 'palletCapacity'],
  'gas-station': ['dispenserCount', 'storeSqFt', 'stationType'],
  'government': ['totalSqFt', 'governmentSqFt', 'facilitySqFt', 'buildingCount'],
  'indoor-farm': ['growingAreaSqFt', 'growingLevels', 'lightingLoadPercent', 'farmType'],
  'agricultural': ['totalAcres', 'irrigationType', 'majorEquipment'],
  'heavy_duty_truck_stop': ['mcsChargers', 'level2', 'truckWashBays', 'serviceBays', 'peakDemandKW', 'gridCapacityKW'],
  'microgrid': ['sitePeakLoad', 'criticalLoadPercent', 'existingCapacity', 'criticalLoads'],
};

// Power-relevant field patterns (fields that affect energy calculations)
const POWER_RELEVANT_PATTERNS = [
  /sqft|sqfeet|squarefootage|area|size/i,
  /count|number|quantity|total/i,
  /power|kw|watt|load/i,
  /equipment|appliance|machine/i,
  /cooling|heating|hvac|refrigerat/i,
  /charger|charging|ev|electric.vehicle/i,
  /room|bed|unit|bay|rack/i,
  /operating|hours|shift/i,
  /capacity|volume/i,
  /type|class|tier|category/i,
  /pue|efficiency/i,
  /has[A-Z]/,  // hasPool, hasKitchen, etc.
];

// =============================================================================
// AUDIT FUNCTIONS
// =============================================================================

async function fetchAllUseCasesWithQuestions() {
  const { data: useCases, error: ucError } = await supabase
    .from('use_cases')
    .select('id, slug, name, is_active')
    .order('slug');

  if (ucError) {
    console.error('❌ Error fetching use_cases:', ucError);
    return [];
  }

  const results = [];
  for (const uc of useCases || []) {
    const { data: questions, error: qError } = await supabase
      .from('custom_questions')
      .select('id, field_name, question_text, question_type, default_value, is_required, display_order')
      .eq('use_case_id', uc.id)
      .order('display_order');

    if (qError) {
      console.error(`⚠️ Error fetching questions for ${uc.slug}:`, qError.message);
      continue;
    }

    results.push({
      ...uc,
      questions: questions || [],
    });
  }

  return results;
}

function isPowerRelevant(fieldName) {
  return POWER_RELEVANT_PATTERNS.some(pattern => pattern.test(fieldName));
}

function findMatchingCodeExpectation(industry, dbFieldName) {
  const expectedFields = CODE_EXPECTED_FIELDS[industry] || [];
  return expectedFields.find(f => 
    f.toLowerCase() === dbFieldName.toLowerCase() ||
    dbFieldName.toLowerCase().includes(f.toLowerCase()) ||
    f.toLowerCase().includes(dbFieldName.toLowerCase())
  );
}

// =============================================================================
// MAIN AUDIT
// =============================================================================

async function runAudit() {
  console.log('═'.repeat(80));
  console.log('📊 QUESTIONNAIRE DATA FLOW AUDIT');
  console.log('   Checking: DB field_name ↔ WizardV6.tsx power calculations');
  console.log('═'.repeat(80));
  console.log('');

  const useCases = await fetchAllUseCasesWithQuestions();
  console.log(`📦 Found ${useCases.length} use cases in database\n`);

  // Track issues
  const issues = {
    missingHandler: [], // DB fields with no power calc handler
    missingInDB: [],    // Code expects fields not in DB
    noQuestions: [],    // Industries with 0 questions
    inactive: [],       // Inactive industries
  };

  // Detailed per-industry report
  const industryReports = [];

  for (const uc of useCases) {
    if (!uc.is_active) {
      issues.inactive.push(uc.slug);
      continue;
    }

    if (uc.questions.length === 0) {
      issues.noQuestions.push(uc.slug);
      continue;
    }

    const report = {
      slug: uc.slug,
      name: uc.name,
      questionCount: uc.questions.length,
      hasCodeHandler: !!CODE_EXPECTED_FIELDS[uc.slug],
      dbFields: [],
      matchedFields: [],
      unmatchedFields: [],
      missingInDB: [],
      powerRelevantUnmatched: [],
    };

    // Check each DB field against code expectations
    for (const q of uc.questions) {
      const fieldName = q.field_name;
      report.dbFields.push(fieldName);

      const matched = findMatchingCodeExpectation(uc.slug, fieldName);
      if (matched) {
        report.matchedFields.push({ db: fieldName, code: matched });
      } else {
        report.unmatchedFields.push(fieldName);
        if (isPowerRelevant(fieldName)) {
          report.powerRelevantUnmatched.push(fieldName);
        }
      }
    }

    // Check if code expects fields not in DB
    const expectedFields = CODE_EXPECTED_FIELDS[uc.slug] || [];
    for (const expected of expectedFields) {
      const foundInDB = uc.questions.some(q => 
        q.field_name.toLowerCase() === expected.toLowerCase() ||
        q.field_name.toLowerCase().includes(expected.toLowerCase())
      );
      if (!foundInDB) {
        report.missingInDB.push(expected);
      }
    }

    industryReports.push(report);

    // Collect global issues
    if (report.powerRelevantUnmatched.length > 0) {
      issues.missingHandler.push({
        industry: uc.slug,
        fields: report.powerRelevantUnmatched,
      });
    }
    if (report.missingInDB.length > 0) {
      issues.missingInDB.push({
        industry: uc.slug,
        fields: report.missingInDB,
      });
    }
  }

  // ==========================================================================
  // OUTPUT REPORT
  // ==========================================================================

  console.log('─'.repeat(80));
  console.log('📋 PER-INDUSTRY ANALYSIS');
  console.log('─'.repeat(80));

  for (const report of industryReports) {
    const statusIcon = report.hasCodeHandler ? '✅' : '⚠️';
    const matchRatio = report.dbFields.length > 0 
      ? (report.matchedFields.length / report.dbFields.length * 100).toFixed(0)
      : 0;

    console.log(`\n${statusIcon} ${report.name} (${report.slug})`);
    console.log(`   Questions: ${report.questionCount} | Code Handler: ${report.hasCodeHandler ? 'YES' : 'NO'}`);
    console.log(`   Field Match Rate: ${matchRatio}% (${report.matchedFields.length}/${report.dbFields.length})`);

    if (report.matchedFields.length > 0) {
      console.log(`   ✅ Matched: ${report.matchedFields.map(m => m.db).join(', ')}`);
    }

    if (report.powerRelevantUnmatched.length > 0) {
      console.log(`   ⚠️ POWER-RELEVANT NOT HANDLED: ${report.powerRelevantUnmatched.join(', ')}`);
    }

    if (report.missingInDB.length > 0) {
      console.log(`   ❌ CODE EXPECTS BUT MISSING IN DB: ${report.missingInDB.join(', ')}`);
    }
  }

  // ==========================================================================
  // SUMMARY
  // ==========================================================================

  console.log('\n' + '═'.repeat(80));
  console.log('📈 AUDIT SUMMARY');
  console.log('═'.repeat(80));

  console.log(`\n📊 Statistics:`);
  console.log(`   Total active industries: ${industryReports.length}`);
  console.log(`   Industries with code handlers: ${industryReports.filter(r => r.hasCodeHandler).length}`);
  console.log(`   Industries WITHOUT handlers: ${industryReports.filter(r => !r.hasCodeHandler).length}`);
  console.log(`   Inactive industries: ${issues.inactive.length}`);
  console.log(`   Industries with no questions: ${issues.noQuestions.length}`);

  if (issues.noQuestions.length > 0) {
    console.log(`\n⚠️ NO QUESTIONS: ${issues.noQuestions.join(', ')}`);
  }

  if (issues.inactive.length > 0) {
    console.log(`\n📵 INACTIVE: ${issues.inactive.join(', ')}`);
  }

  // Industries without code handlers
  const noHandlerIndustries = industryReports.filter(r => !r.hasCodeHandler);
  if (noHandlerIndustries.length > 0) {
    console.log(`\n⚠️ INDUSTRIES WITHOUT POWER CALC HANDLERS IN WizardV6.tsx:`);
    for (const r of noHandlerIndustries) {
      console.log(`   - ${r.slug}: ${r.questionCount} questions`);
      if (r.dbFields.length > 0) {
        const powerFields = r.dbFields.filter(isPowerRelevant);
        if (powerFields.length > 0) {
          console.log(`     Power-relevant fields: ${powerFields.join(', ')}`);
        }
      }
    }
  }

  // Critical issues
  if (issues.missingHandler.length > 0) {
    console.log(`\n🔴 CRITICAL: Power-relevant DB fields NOT handled in code:`);
    for (const issue of issues.missingHandler) {
      console.log(`   ${issue.industry}: ${issue.fields.join(', ')}`);
    }
  }

  if (issues.missingInDB.length > 0) {
    console.log(`\n🟡 WARNING: Code expects fields NOT in database:`);
    for (const issue of issues.missingInDB) {
      console.log(`   ${issue.industry}: ${issue.fields.join(', ')}`);
    }
  }

  // ==========================================================================
  // RECOMMENDATIONS
  // ==========================================================================

  console.log('\n' + '─'.repeat(80));
  console.log('💡 RECOMMENDATIONS');
  console.log('─'.repeat(80));

  if (noHandlerIndustries.length > 0) {
    console.log(`\n1. Add power calculation handlers in WizardV6.tsx for:`);
    for (const r of noHandlerIndustries) {
      console.log(`   - ${r.slug}`);
    }
  }

  if (issues.missingHandler.length > 0) {
    console.log(`\n2. Update estimatedPowerMetrics useMemo to use these DB fields:`);
    for (const issue of issues.missingHandler) {
      for (const field of issue.fields) {
        console.log(`   - ${issue.industry}: inputs.${field}`);
      }
    }
  }

  if (issues.missingInDB.length > 0) {
    console.log(`\n3. Add missing fields to database custom_questions:`);
    for (const issue of issues.missingInDB) {
      for (const field of issue.fields) {
        console.log(`   - ${issue.industry}: field_name = '${field}'`);
      }
    }
  }

  console.log('\n' + '═'.repeat(80));
  console.log('✅ Audit complete\n');

  // Return exit code based on critical issues
  const criticalIssues = issues.missingHandler.length + issues.noQuestions.length;
  return criticalIssues > 0 ? 1 : 0;
}

// Run
runAudit()
  .then(exitCode => process.exit(exitCode))
  .catch(err => {
    console.error('❌ Audit failed:', err);
    process.exit(1);
  });
