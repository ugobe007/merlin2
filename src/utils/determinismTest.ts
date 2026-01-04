/**
 * DETERMINISM TESTING UTILITY
 * ============================
 *
 * This utility helps identify non-deterministic behavior in the Smart Wizard.
 * Run the same inputs multiple times and verify that outputs are IDENTICAL.
 *
 * Usage:
 * import { testDeterminism } from '@/utils/determinismTest';
 * const results = await testDeterminism(inputs, 10); // Run 10 times
 * if (results.isDeterministic) { ... }
 */

import { calculateDatabaseBaseline } from "../services/baselineService";
import { calculateFinancialMetrics } from "../services/centralizedCalculations";

export interface TestInput {
  template: string;
  scale: number;
  useCaseData: Record<string, any>;
  storageSizeMW: number;
  durationHours: number;
  electricityRate: number;
  location: string;
}

export interface TestResult {
  isDeterministic: boolean;
  runCount: number;
  uniqueOutputs: number;
  outputs: Array<{
    powerMW: number;
    durationHrs: number;
    totalProjectCost?: number;
    netCost?: number;
    annualSavings?: number;
    paybackYears?: number;
  }>;
  variance: {
    powerMW: { min: number; max: number; range: number };
    totalCost: { min: number; max: number; range: number };
    payback: { min: number; max: number; range: number };
  };
  timestamp: Date;
}

/**
 * Test determinism by running the same inputs multiple times
 */
export async function testDeterminism(
  input: TestInput,
  iterations: number = 10
): Promise<TestResult> {
  console.log(`🧪 [Determinism Test] Starting ${iterations} iterations...`);
  console.log(`🧪 [Determinism Test] Input:`, input);

  const outputs: Array<any> = [];

  for (let i = 0; i < iterations; i++) {
    try {
      // Step 1: Calculate baseline
      const baseline = await calculateDatabaseBaseline(
        input.template,
        input.scale,
        input.useCaseData
      );

      // Step 2: Calculate financial metrics
      const financial = await calculateFinancialMetrics({
        storageSizeMW: baseline.powerMW,
        durationHours: baseline.durationHrs,
        solarMW: baseline.solarMW,
        location: input.location,
        electricityRate: input.electricityRate,
      });

      outputs.push({
        iteration: i + 1,
        powerMW: baseline.powerMW,
        durationHrs: baseline.durationHrs,
        solarMW: baseline.solarMW,
        totalProjectCost: financial.totalProjectCost,
        netCost: financial.netCost,
        annualSavings: financial.annualSavings,
        paybackYears: financial.paybackYears,
      });

      console.log(`✅ [Determinism Test] Iteration ${i + 1}/${iterations} complete`);
    } catch (error) {
      console.error(`❌ [Determinism Test] Iteration ${i + 1} failed:`, error);
      outputs.push({
        iteration: i + 1,
        error: String(error),
      });
    }
  }

  // Analyze variance
  const powerMWs = outputs.filter((o) => !o.error).map((o: any) => o.powerMW);
  const costs = outputs.filter((o) => !o.error).map((o: any) => o.netCost);
  const paybacks = outputs.filter((o) => !o.error).map((o: any) => o.paybackYears);

  const uniqueOutputs = new Set(
    outputs
      .filter((o) => !o.error)
      .map((o: any) =>
        JSON.stringify({
          powerMW: o.powerMW,
          totalProjectCost: o.totalProjectCost,
          paybackYears: o.paybackYears,
        })
      )
  ).size;

  const result: TestResult = {
    isDeterministic: uniqueOutputs === 1 && outputs.every((o) => !o.error),
    runCount: iterations,
    uniqueOutputs,
    outputs,
    variance: {
      powerMW: {
        min: Math.min(...powerMWs),
        max: Math.max(...powerMWs),
        range: Math.max(...powerMWs) - Math.min(...powerMWs),
      },
      totalCost: {
        min: Math.min(...costs),
        max: Math.max(...costs),
        range: Math.max(...costs) - Math.min(...costs),
      },
      payback: {
        min: Math.min(...paybacks),
        max: Math.max(...paybacks),
        range: Math.max(...paybacks) - Math.min(...paybacks),
      },
    },
    timestamp: new Date(),
  };

  console.log(`🧪 [Determinism Test] Results:`, result);

  if (result.isDeterministic) {
    console.log(
      `✅ [Determinism Test] PASS - All ${iterations} iterations produced identical results`
    );
  } else {
    console.error(
      `❌ [Determinism Test] FAIL - Found ${uniqueOutputs} different outputs across ${iterations} iterations`
    );
    console.error(`❌ [Determinism Test] Variance:`, result.variance);
  }

  return result;
}

/**
 * Quick test for office building use case (the reported bug)
 */
export async function testOfficeBuildingDeterminism(): Promise<TestResult> {
  const input: TestInput = {
    template: "office-building",
    scale: 1.0,
    useCaseData: {
      facilitySize: "small",
      peakLoad: 0.5, // User's reported input
      operatingHours: 12,
    },
    storageSizeMW: 0.5,
    durationHours: 4,
    electricityRate: 0.15,
    location: "California",
  };

  return testDeterminism(input, 10);
}
