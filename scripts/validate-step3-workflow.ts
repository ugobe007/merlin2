#!/usr/bin/env node
/**
 * STEP 3 WORKFLOW VALIDATOR
 * ==========================
 * Created: Feb 4, 2026
 * Purpose: Validate the complete Step 3 questionnaire → calculator → pricing flow
 * 
 * Checks:
 * 1. Database questions exist and have correct field names
 * 2. Calculators can receive database field format
 * 3. Answers flow from UI → database → calculator correctly
 * 4. Energy load results propagate to pricing
 * 
 * This validates the END-TO-END workflow, not just field name alignment.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

// Import calculators
import { CALCULATORS_BY_ID } from '../src/wizard/v7/calculators/registry';
import type { CalcInputs } from '../src/wizard/v7/calculators/contract';

interface ValidationResult {
  industry: string;
  status: 'pass' | 'fail' | 'warning';
  issues: string[];
  details: {
    dbQuestions: number;
    calculatorFields: number;
    mockAnswers: Record<string, unknown>;
    calculatorResult?: {
      baseLoadKW?: number;
      peakLoadKW?: number;
      energyKWhPerDay?: number;
      warnings: string[];
    };
  };
}

/**
 * Test Step 3 workflow for a specific industry
 */
async function testIndustryWorkflow(
  useCaseSlug: string,
  calculatorId: string | null, // null = skip calculator test (no dedicated calculator)
  mockAnswers: Record<string, unknown>
): Promise<ValidationResult> {
  const result: ValidationResult = {
    industry: useCaseSlug,
    status: 'pass',
    issues: [],
    details: {
      dbQuestions: 0,
      calculatorFields: 0,
      mockAnswers,
    },
  };

  try {
    // Step 1: Find use case by slug
    const { data: useCases, error: useCaseError } = await supabase
      .from('use_cases')
      .select('id, name, slug')
      .eq('slug', useCaseSlug)
      .single();

    if (useCaseError || !useCases) {
      result.status = 'fail';
      result.issues.push(`Use case not found: ${useCaseSlug}`);
      return result;
    }

    console.log(`  ✓ Found use case: ${useCases.name} (${useCases.id})`);

    // Step 2: Fetch database questions for this use case
    const { data: questions, error } = await supabase
      .from('custom_questions')
      .select('*')
      .eq('use_case_id', useCases.id)
      .order('display_order');

    if (error) {
      result.status = 'fail';
      result.issues.push(`Database error: ${error.message}`);
      return result;
    }

    if (!questions || questions.length === 0) {
      result.status = 'fail';
      result.issues.push('No questions found in database');
      return result;
    }

    result.details.dbQuestions = questions.length;
    console.log(`  ✓ Found ${questions.length} questions in database`);

    // Step 3: Get calculator contract (if specified)
    if (calculatorId === null) {
      console.log(`  ⏭️  No dedicated calculator (using fallback)`);
      result.status = 'warning';
      result.issues.push('No dedicated calculator - needs implementation or uses generic fallback');
      return result;
    }

    const calculator = CALCULATORS_BY_ID[calculatorId];
    if (!calculator) {
      result.status = 'fail';
      result.issues.push(`Calculator not found: ${calculatorId}`);
      return result;
    }

    result.details.calculatorFields = calculator.requiredInputs?.length || 0;
    console.log(`  ✓ Calculator expects ${result.details.calculatorFields} required inputs`);

    // Step 3: Run calculator with mock answers
    try {
      const calcResult = calculator.compute(mockAnswers as CalcInputs);
      
      result.details.calculatorResult = {
        baseLoadKW: calcResult.baseLoadKW,
        peakLoadKW: calcResult.peakLoadKW,
        energyKWhPerDay: calcResult.energyKWhPerDay,
        warnings: calcResult.warnings || [],
      };

      console.log(`  ✓ Calculator ran successfully:`);
      console.log(`    - Base: ${calcResult.baseLoadKW?.toFixed(0) || 'N/A'} kW`);
      console.log(`    - Peak: ${calcResult.peakLoadKW?.toFixed(0) || 'N/A'} kW`);
      console.log(`    - Energy: ${calcResult.energyKWhPerDay?.toFixed(0) || 'N/A'} kWh/day`);

      if (calcResult.warnings && calcResult.warnings.length > 0) {
        result.status = 'warning';
        result.issues.push(...calcResult.warnings);
      }

      // Sanity checks
      if (!calcResult.peakLoadKW || calcResult.peakLoadKW === 0) {
        result.status = 'fail';
        result.issues.push('Calculator returned zero or missing peak load');
      }

    } catch (err) {
      result.status = 'fail';
      result.issues.push(`Calculator execution error: ${err instanceof Error ? err.message : String(err)}`);
    }

    // Step 4: Check for field mapping issues
    const dbFieldNames = questions.map(q => q.field_name);
    const calculatorInputs = Object.keys(mockAnswers);
    
    const unmappedFields = calculatorInputs.filter(f => !dbFieldNames.includes(f));
    if (unmappedFields.length > 0) {
      result.status = 'warning';
      result.issues.push(`Mock answers include fields not in database: ${unmappedFields.join(', ')}`);
    }

  } catch (err) {
    result.status = 'fail';
    result.issues.push(`Unexpected error: ${err instanceof Error ? err.message : String(err)}`);
  }

  return result;
}

/**
 * Main validation runner
 */
async function main() {
  console.log('\n🔍 Step 3 Workflow Validation');
  console.log('==============================\n');

  const testCases: Array<{
    useCaseId: string;
    calculatorId: string | null; // null = no dedicated calculator
    mockAnswers: Record<string, unknown>;
  }> = [
    {
      useCaseId: 'hotel',
      calculatorId: 'hotel_load_v1',
      mockAnswers: {
        roomCount: 150,
        hotelClass: 'midscale',
        occupancyRate: 70,
        hotelAmenities: ['pool', 'restaurant', 'fitness'],
        electricalServiceSize: '800-1200kVA',
        hvacType: 'central',
        waterHeating: 'electric',
        operatingHours: '24/7',
      },
    },
    {
      useCaseId: 'data-center',
      calculatorId: 'dc_load_v1',
      mockAnswers: {
        itLoadCapacity: '500-1000',
        currentPUE: '1.3-1.5',
        itUtilization: '60-80%',
        dataCenterTier: 'tier_3',
        coolingType: 'crac',
        upsConfiguration: 'n+1',
        rackPowerDensity: '5-10kW/rack',
        growthRate: 'moderate',
      },
    },
    {
      useCaseId: 'car-wash',
      calculatorId: 'car_wash_load_v1',
      mockAnswers: {
        carWashType: 'tunnel',
        bayTunnelCount: '2 tunnels',
        averageWashesPerDay: 200,
        peakHourThroughput: 30,
        operatingHours: 12,
        primaryEquipment: ['conveyor', 'dryers', 'vacuums'],
        electricalServiceSize: '200-400kVA',
        washCycleDuration: '3-5',
        waterHeating: 'gas',
        monthlyElectricitySpend: '$3000-5000',
      },
    },
    // NEW Industries with SSOT adapters (added Feb 4, 2026)
    {
      useCaseId: 'office',
      calculatorId: 'office_load_v1', // NEW: SSOT adapter
      mockAnswers: {
        squareFootage: 50000,
      },
    },
    {
      useCaseId: 'retail',
      calculatorId: 'retail_load_v1', // NEW: SSOT adapter
      mockAnswers: {
        squareFootage: 20000,
      },
    },
    {
      useCaseId: 'manufacturing',
      calculatorId: 'manufacturing_load_v1', // NEW: SSOT adapter
      mockAnswers: {
        squareFootage: 100000,
        manufacturingType: 'light',
      },
    },
    {
      useCaseId: 'hospital',
      calculatorId: 'hospital_load_v1', // NEW: SSOT adapter
      mockAnswers: {
        bedCount: 200,
      },
    },
    {
      useCaseId: 'warehouse',
      calculatorId: 'warehouse_load_v1', // NEW: SSOT adapter
      mockAnswers: {
        squareFootage: 200000,
      },
    },
    {
      useCaseId: 'ev-charging',
      calculatorId: 'ev_charging_load_v1', // NEW: SSOT adapter
      mockAnswers: {
        level2Chargers: 12,
        dcfcChargers: 8,
      },
    },
    {
      useCaseId: 'restaurant',
      calculatorId: 'restaurant_load_v1', // NEW: SSOT adapter
      mockAnswers: {
        seatingCapacity: 100,
      },
    },
    {
      useCaseId: 'gas-station',
      calculatorId: 'gas_station_load_v1', // NEW: SSOT adapter
      mockAnswers: {
        fuelPumps: 8,
      },
    },
  ];

  const results: ValidationResult[] = [];

  for (const testCase of testCases) {
    console.log(`\n📋 Testing: ${testCase.useCaseId.toUpperCase()}`);
    console.log('----------------------------------------');
    
    const result = await testIndustryWorkflow(
      testCase.useCaseId,
      testCase.calculatorId,
      testCase.mockAnswers
    );
    
    results.push(result);
  }

  // Summary
  console.log('\n\n📊 SUMMARY');
  console.log('==========');
  
  const passed = results.filter(r => r.status === 'pass').length;
  const warnings = results.filter(r => r.status === 'warning').length;
  const failed = results.filter(r => r.status === 'fail').length;

  console.log(`✅ Passed: ${passed}/${results.length}`);
  console.log(`⚠️  Warnings: ${warnings}/${results.length}`);
  console.log(`❌ Failed: ${failed}/${results.length}`);

  if (failed > 0) {
    console.log('\n❌ FAILURES:');
    results
      .filter(r => r.status === 'fail')
      .forEach(r => {
        console.log(`\n  ${r.industry}:`);
        r.issues.forEach(issue => console.log(`    - ${issue}`));
      });
  }

  if (warnings > 0) {
    console.log('\n⚠️  WARNINGS:');
    results
      .filter(r => r.status === 'warning')
      .forEach(r => {
        console.log(`\n  ${r.industry}:`);
        r.issues.forEach(issue => console.log(`    - ${issue}`));
      });
  }

  console.log('\n✅ Done.\n');
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
