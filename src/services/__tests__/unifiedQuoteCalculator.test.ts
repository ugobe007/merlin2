/**
 * =============================================================================
 * UNIFIED QUOTE CALCULATOR UNIT TESTS
 * =============================================================================
 *
 * Tests the SSOT entry point: calculateQuote() and estimatePayback().
 * Mocks external dependencies (supabase, utility rates, PVWatts, etc.)
 * to isolate the orchestration logic.
 *
 * NOTE: vitest.config has mockReset:true, so all vi.fn() return values are
 * cleared between tests. We use beforeEach to re-establish mock implementations.
 *
 * Created: Feb 2026 — SSOT Pillar Test Coverage
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';

// ============================================================================
// MOCK SETUP — Factories create bare vi.fn() stubs only
// (mockReset:true strips return values between tests)
// ============================================================================

vi.mock('@/services/supabaseClient', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: { message: 'mock' } }),
          order: () => ({
            limit: () => Promise.resolve({ data: [], error: null }),
          }),
        }),
        order: () => ({
          limit: () => Promise.resolve({ data: [], error: null }),
        }),
      }),
      upsert: () => Promise.resolve({ data: null, error: null }),
    }),
  },
}));

vi.mock('@/services/centralizedCalculations', () => ({
  calculateFinancialMetrics: vi.fn(),
}));

vi.mock('@/services/utilityRateService', () => ({
  getUtilityRatesByZip: vi.fn(),
  getCommercialRateByZip: vi.fn(),
  buildTOUPeriodsFromUtilityRate: vi.fn(),
}));

vi.mock('@/services/pvWattsService', () => ({
  getPVWattsEstimate: vi.fn(),
  estimateSolarProduction: vi.fn(),
}));

vi.mock('@/services/itcCalculator', () => ({
  estimateITC: vi.fn(),
  isEnergyCommunity: vi.fn(),
}));

vi.mock('@/services/batteryDegradationService', () => ({
  estimateDegradation: vi.fn(),
  calculateDegradation: vi.fn(),
}));

vi.mock('@/services/hourly8760AnalysisService', () => ({
  run8760Analysis: vi.fn(),
  estimate8760Savings: vi.fn(),
}));

vi.mock('@/services/monteCarloService', () => ({
  runMonteCarloSimulation: vi.fn(),
  estimateRiskMetrics: vi.fn(),
}));

vi.mock('@/utils/equipmentCalculations', () => ({
  calculateEquipmentBreakdown: vi.fn(),
}));

vi.mock('@/services/unifiedPricingService', () => ({
  getBatteryPricing: vi.fn(),
  getSolarPricing: vi.fn(),
}));

vi.mock('@/services/calculationConstantsService', () => ({
  getCalculationConstants: vi.fn(),
  getConstant: vi.fn(),
}));

vi.mock('@/services/benchmarkSources', () => ({
  getBESSSizingRatioWithSource: vi.fn(),
  AUTHORITATIVE_SOURCES: {},
  PRICING_BENCHMARKS: {},
  CURRENT_BENCHMARK_VERSION: { version: '1.0.0', methodology: 'mock' },
}));

// ============================================================================
// IMPORT AFTER MOCKS
// ============================================================================

import { calculateQuote, estimatePayback } from '@/services/unifiedQuoteCalculator';

// Import mocked modules so we can set return values in beforeEach
import { calculateEquipmentBreakdown } from '@/utils/equipmentCalculations';
import { calculateFinancialMetrics } from '@/services/centralizedCalculations';
import { getUtilityRatesByZip, getCommercialRateByZip } from '@/services/utilityRateService';
import { getPVWattsEstimate, estimateSolarProduction } from '@/services/pvWattsService';
import { estimateITC, isEnergyCommunity } from '@/services/itcCalculator';
import { estimateDegradation } from '@/services/batteryDegradationService';
import { run8760Analysis } from '@/services/hourly8760AnalysisService';
import { estimateRiskMetrics } from '@/services/monteCarloService';
import { getBatteryPricing } from '@/services/unifiedPricingService';
import { getCalculationConstants } from '@/services/calculationConstantsService';

// ============================================================================
// MOCK DATA — Shared across tests
// ============================================================================

const MOCK_EQUIPMENT = {
  batteries: { totalCost: 500_000, pricePerKWh: 125 },
  inverters: { totalCost: 100_000 },
  transformers: { totalCost: 50_000 },
  solar: { totalCost: 0, arrayCapacityMW: 0 },
  wind: { totalCost: 0 },
  generators: { totalCost: 0, fuelType: 'natural-gas' },
  bms: { totalCost: 30_000 },
  scada: { totalCost: 25_000 },
  totals: {
    equipmentCost: 705_000,
    installationCost: 211_500,
    commissioningCost: 70_500,
    certificationCost: 35_250,
    totalCapex: 1_022_250,
    totalProjectCost: 1_100_000,
    annualOpex: 15_000,
  },
};

const MOCK_FINANCIALS = {
  paybackYears: 7.2,
  roi10Year: 38,
  roi25Year: 248,
  npv: 1_500_000,
  irr: 12.5,
  discountedPayback: 8.5,
  levelizedCostOfStorage: 0.12,
  annualSavings: 200_000,
  peakShavingSavings: 80_000,
  demandChargeSavings: 60_000,
  gridServiceRevenue: 30_000,
  solarSavings: 20_000,
  windSavings: 10_000,
  totalProjectCost: 1_100_000,
  netCost: 770_000,
  equipmentCost: 705_000,
  installationCost: 211_500,
  federalTaxCredit: 330_000,
  calculationDate: new Date(),
  formulaVersion: '2.0.0',
  dataSource: 'mock',
  constantsUsed: {},
};

// ============================================================================
// beforeEach — Re-establish all mock return values (mockReset clears them)
// ============================================================================

beforeEach(() => {
  vi.mocked(calculateEquipmentBreakdown).mockResolvedValue(MOCK_EQUIPMENT as any);

  vi.mocked(calculateFinancialMetrics).mockResolvedValue(MOCK_FINANCIALS as any);

  vi.mocked(getUtilityRatesByZip).mockResolvedValue({
    electricityRate: 0.15,
    demandCharge: 18,
    state: 'CA',
    utilityName: 'Mock Utility',
    source: 'mock',
    confidence: 'high',
    averageResidentialRate: 0.22,
    averageCommercialRate: 0.15,
  } as any);

  vi.mocked(getCommercialRateByZip).mockResolvedValue({
    electricityRate: 0.15,
    demandCharge: 18,
    utilityName: 'Mock Utility',
    source: 'mock',
    confidence: 'high',
  } as any);

  vi.mocked(getPVWattsEstimate).mockResolvedValue(null as any);
  vi.mocked(estimateSolarProduction).mockReturnValue({
    annualProductionKWh: 1_500_000,
    capacityFactor: 0.20,
    monthlyProductionKWh: Array(12).fill(125_000),
  } as any);

  vi.mocked(estimateITC).mockReturnValue({
    totalRate: 0.30,
    baseRate: 0.30,
    creditAmount: 1_500_000,
    notes: ['Mock ITC'],
  } as any);
  vi.mocked(isEnergyCommunity).mockReturnValue(false);

  // estimateDegradation returns a plain array of { year, capacityPct }
  vi.mocked(estimateDegradation).mockReturnValue(
    Array.from({ length: 26 }, (_, i) => ({
      year: i,
      capacityPct: Math.round((100 - i * 1.5) * 10) / 10,
    }))
  );

  vi.mocked(run8760Analysis).mockReturnValue({
    summary: { annualSavings: 200_000, touArbitrageSavings: 50_000, peakShavingSavings: 100_000 },
  } as any);

  vi.mocked(estimateRiskMetrics).mockReturnValue({
    npv: { p10: 1_000_000, p50: 2_000_000, p90: 3_000_000 },
  } as any);

  vi.mocked(getBatteryPricing).mockResolvedValue({
    totalCost: 500_000,
    pricePerKWh: 125,
    tier: 'commercial',
    source: 'mock',
  } as any);

  vi.mocked(getCalculationConstants).mockResolvedValue({
    peakShavingMultiplier: 0.15,
    demandChargeMonthlyPerMW: 15000,
    gridServiceRevenuePerMW: 45000,
    solarCapacityFactor: 0.20,
    windCapacityFactor: 0.30,
    federalTaxCreditRate: 0.30,
    annualCycles: 365,
    roundTripEfficiency: 0.87,
    degradationRateAnnual: 0.02,
    omCostPercent: 0.015,
    dataSource: 'mock',
    lastUpdated: new Date().toISOString(),
  } as any);
});

// ============================================================================
// 1. calculateQuote — BASIC VALIDATION
// ============================================================================

describe('calculateQuote — Input Validation', () => {
  test('rejects zero storageSizeMW', async () => {
    await expect(calculateQuote({
      storageSizeMW: 0,
      durationHours: 4,
      location: 'California',
      electricityRate: 0.12,
    })).rejects.toThrow();
  });

  test('rejects negative storageSizeMW', async () => {
    await expect(calculateQuote({
      storageSizeMW: -1,
      durationHours: 4,
      location: 'California',
      electricityRate: 0.12,
    })).rejects.toThrow();
  });

  test('rejects zero durationHours', async () => {
    await expect(calculateQuote({
      storageSizeMW: 1,
      durationHours: 0,
      location: 'California',
      electricityRate: 0.12,
    })).rejects.toThrow();
  });
});

// ============================================================================
// 2. calculateQuote — HAPPY PATH
// ============================================================================

describe('calculateQuote — Happy Path', () => {
  test('returns valid result for minimal input', async () => {
    const result = await calculateQuote({
      storageSizeMW: 1,
      durationHours: 4,
      location: 'California',
      electricityRate: 0.12,
    });

    // Structure checks
    expect(result).toHaveProperty('equipment');
    expect(result).toHaveProperty('costs');
    expect(result).toHaveProperty('financials');
    expect(result).toHaveProperty('metadata');
  });

  test('costs are all positive numbers', async () => {
    const result = await calculateQuote({
      storageSizeMW: 2,
      durationHours: 4,
      location: 'California',
      electricityRate: 0.15,
    });

    expect(result.costs.equipmentCost).toBeGreaterThan(0);
    expect(result.costs.totalProjectCost).toBeGreaterThan(0);
    expect(result.costs.installationCost).toBeGreaterThanOrEqual(0);
  });

  test('financials include payback, ROI, NPV', async () => {
    const result = await calculateQuote({
      storageSizeMW: 2,
      durationHours: 4,
      location: 'California',
      electricityRate: 0.15,
    });

    expect(result.financials).toHaveProperty('paybackYears');
    expect(result.financials).toHaveProperty('roi10Year');
    expect(result.financials).toHaveProperty('npv');
    expect(typeof result.financials.paybackYears).toBe('number');
  });

  test('metadata includes ITC details when zip provided', async () => {
    const result = await calculateQuote({
      storageSizeMW: 2,
      durationHours: 4,
      location: 'California',
      electricityRate: 0.15,
      zipCode: '94102',
    });

    expect(result.metadata).toHaveProperty('itcDetails');
    expect(result.metadata.itcDetails).toHaveProperty('totalRate');
  });

  test('metadata includes degradation details', async () => {
    const result = await calculateQuote({
      storageSizeMW: 2,
      durationHours: 4,
      location: 'California',
      electricityRate: 0.15,
      batteryChemistry: 'lfp',
    });

    expect(result.metadata).toHaveProperty('degradation');
  });
});

// ============================================================================
// 3. calculateQuote — SYSTEM CATEGORIZATION
// ============================================================================

describe('calculateQuote — System Categorization', () => {
  test('small system (0.1 MW) produces valid result', async () => {
    const result = await calculateQuote({
      storageSizeMW: 0.1,
      durationHours: 2,
      location: 'Texas',
      electricityRate: 0.10,
    });
    expect(result.costs.totalProjectCost).toBeGreaterThan(0);
  });

  test('utility-scale system (10 MW) produces valid result', async () => {
    const result = await calculateQuote({
      storageSizeMW: 10,
      durationHours: 4,
      location: 'California',
      electricityRate: 0.20,
    });
    expect(result.costs.totalProjectCost).toBeGreaterThan(0);
  });
});

// ============================================================================
// 4. calculateQuote — SOLAR INTEGRATION
// ============================================================================

describe('calculateQuote — Solar Integration', () => {
  test('result includes solar production metadata when solarMW > 0', async () => {
    const result = await calculateQuote({
      storageSizeMW: 2,
      durationHours: 4,
      location: 'California',
      electricityRate: 0.15,
      solarMW: 3,
    });

    expect(result.metadata).toHaveProperty('solarProduction');
  });
});

// ============================================================================
// 5. calculateQuote — ADVANCED ANALYSIS
// ============================================================================

describe('calculateQuote — Advanced Analysis', () => {
  test('includes advanced analysis when requested', async () => {
    const result = await calculateQuote({
      storageSizeMW: 2,
      durationHours: 4,
      location: 'California',
      electricityRate: 0.15,
      includeAdvancedAnalysis: true,
      peakDemandKW: 500,
      annualLoadKWh: 2_000_000,
    });

    expect(result.metadata).toHaveProperty('advancedAnalysis');
  });
});

// ============================================================================
// 6. estimatePayback — QUICK ESTIMATE (positional args, NOT object)
// ============================================================================

describe('estimatePayback', () => {
  test('returns positive payback for standard input', async () => {
    const result = await estimatePayback(2, 4, 0.15);
    expect(result.paybackYears).toBeGreaterThan(0);
    expect(result.paybackYears).toBeLessThan(50);
  });

  test('returns annual savings', async () => {
    const result = await estimatePayback(2, 4, 0.15);
    expect(result.annualSavings).toBeGreaterThan(0);
  });

  test('higher electricity rate → shorter payback', async () => {
    const low = await estimatePayback(2, 4, 0.08);
    const high = await estimatePayback(2, 4, 0.25);
    expect(high.paybackYears).toBeLessThan(low.paybackYears);
  });
});

// ============================================================================
// 7. BENCHMARK AUDIT
// ============================================================================

describe('Benchmark Audit Trail', () => {
  test('result includes benchmark audit', async () => {
    const result = await calculateQuote({
      storageSizeMW: 2,
      durationHours: 4,
      location: 'California',
      electricityRate: 0.15,
    });

    expect(result).toHaveProperty('benchmarkAudit');
    expect(result.benchmarkAudit).toHaveProperty('sources');
  });
});
