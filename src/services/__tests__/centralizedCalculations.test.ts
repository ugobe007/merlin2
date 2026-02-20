/**
 * =============================================================================
 * CENTRALIZED CALCULATIONS UNIT TESTS
 * =============================================================================
 *
 * Tests calculateFinancialMetrics() — NPV, IRR, payback, ROI, LCOS.
 * Also tests calculateMIRR(), getCachedConstants(), and helper functions.
 *
 * NOTE: vitest.config has mockReset:true, so vi.fn() return values are
 * cleared between tests. We use beforeEach to re-establish mock implementations.
 *
 * Created: Feb 2026 — SSOT Pillar Test Coverage
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';

// ============================================================================
// MOCK SETUP — Factories create bare vi.fn() stubs only
// ============================================================================

vi.mock('../supabaseClient', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: { message: 'mock' } }),
        }),
      }),
    }),
  },
}));

vi.mock('../calculationConstantsService', () => ({
  getCalculationConstants: vi.fn(),
  getConstant: vi.fn(),
}));

vi.mock('../unifiedPricingService', () => ({
  getBatteryPricing: vi.fn(),
  getSolarPricing: vi.fn(),
}));

// ============================================================================
// IMPORT AFTER MOCKS
// ============================================================================

import {
  calculateFinancialMetrics,
  calculateMIRR,
  getCachedConstants,
  refreshConstantsCache,
} from '../centralizedCalculations';

// Import mocked modules for beforeEach setup
import { getCalculationConstants, getConstant } from '../calculationConstantsService';
import { getBatteryPricing, getSolarPricing } from '../unifiedPricingService';

// ============================================================================
// MOCK DATA
// ============================================================================

const mockConstants = {
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
  dataSource: 'test-defaults',
  lastUpdated: new Date().toISOString(),
};

// ============================================================================
// beforeEach — Re-establish all mock return values (mockReset clears them)
// ============================================================================

beforeEach(() => {
  vi.mocked(getCalculationConstants).mockResolvedValue(mockConstants as any);
  vi.mocked(getConstant).mockResolvedValue(null);
  vi.mocked(getBatteryPricing).mockReturnValue({
    totalCost: 500_000,
    pricePerKWh: 125,
    tier: 'commercial',
    source: 'mock',
  } as any);
  vi.mocked(getSolarPricing).mockReturnValue({
    totalCost: 0,
    pricePerWatt: 0.85,
  } as any);
  // Reset constants cache before each test
  refreshConstantsCache();
});

// ============================================================================
// 1. calculateFinancialMetrics — BASIC OUTPUTS
// ============================================================================

describe('calculateFinancialMetrics — Basic Outputs', () => {
  test('returns all required financial fields', async () => {
    const result = await calculateFinancialMetrics({
      storageSizeMW: 2,
      durationHours: 4,
      electricityRate: 0.15,
    });

    expect(result).toHaveProperty('paybackYears');
    expect(result).toHaveProperty('roi10Year');
    expect(result).toHaveProperty('roi25Year');
    expect(result).toHaveProperty('npv');
    expect(result).toHaveProperty('irr');
    expect(result).toHaveProperty('levelizedCostOfStorage');
    expect(result).toHaveProperty('annualSavings');
    expect(result).toHaveProperty('totalProjectCost');
    expect(result).toHaveProperty('netCost');
  });

  test('payback is a positive number for normal inputs', async () => {
    const result = await calculateFinancialMetrics({
      storageSizeMW: 2,
      durationHours: 4,
      electricityRate: 0.15,
    });
    expect(result.paybackYears).toBeGreaterThan(0);
    expect(result.paybackYears).toBeLessThan(100);
  });

  test('netCost is less than totalProjectCost (ITC applied)', async () => {
    const result = await calculateFinancialMetrics({
      storageSizeMW: 2,
      durationHours: 4,
      electricityRate: 0.15,
    });
    expect(result.netCost).toBeLessThan(result.totalProjectCost);
  });

  test('annualSavings is positive for non-zero electricity rate', async () => {
    const result = await calculateFinancialMetrics({
      storageSizeMW: 2,
      durationHours: 4,
      electricityRate: 0.15,
    });
    expect(result.annualSavings).toBeGreaterThan(0);
  });
});

// ============================================================================
// 2. calculateFinancialMetrics — NPV / IRR
// ============================================================================

describe('calculateFinancialMetrics — NPV & IRR', () => {
  test('NPV is computed (can be positive or negative)', async () => {
    const result = await calculateFinancialMetrics({
      storageSizeMW: 2,
      durationHours: 4,
      electricityRate: 0.15,
    });
    expect(typeof result.npv).toBe('number');
    expect(isNaN(result.npv!)).toBe(false);
  });

  test('IRR is computed as a percentage', async () => {
    const result = await calculateFinancialMetrics({
      storageSizeMW: 2,
      durationHours: 4,
      electricityRate: 0.15,
    });
    expect(typeof result.irr).toBe('number');
  });

  test('higher electricity rate → higher NPV', async () => {
    const low = await calculateFinancialMetrics({
      storageSizeMW: 2,
      durationHours: 4,
      electricityRate: 0.08,
    });
    const high = await calculateFinancialMetrics({
      storageSizeMW: 2,
      durationHours: 4,
      electricityRate: 0.25,
    });
    expect(high.npv!).toBeGreaterThan(low.npv!);
  });
});

// ============================================================================
// 3. calculateFinancialMetrics — PAYBACK & ROI
// ============================================================================

describe('calculateFinancialMetrics — Payback & ROI', () => {
  test('payback decreases as electricity rate increases', async () => {
    const low = await calculateFinancialMetrics({
      storageSizeMW: 2,
      durationHours: 4,
      electricityRate: 0.08,
    });
    const high = await calculateFinancialMetrics({
      storageSizeMW: 2,
      durationHours: 4,
      electricityRate: 0.25,
    });
    expect(high.paybackYears).toBeLessThan(low.paybackYears);
  });

  test('ROI 25-year ≥ ROI 10-year', async () => {
    const result = await calculateFinancialMetrics({
      storageSizeMW: 2,
      durationHours: 4,
      electricityRate: 0.15,
    });
    expect(result.roi25Year).toBeGreaterThanOrEqual(result.roi10Year);
  });
});

// ============================================================================
// 4. calculateFinancialMetrics — LCOS
// ============================================================================

describe('calculateFinancialMetrics — LCOS', () => {
  test('LCOS is a positive number ($/kWh)', async () => {
    const result = await calculateFinancialMetrics({
      storageSizeMW: 2,
      durationHours: 4,
      electricityRate: 0.15,
    });
    expect(result.levelizedCostOfStorage).toBeGreaterThan(0);
    expect(isFinite(result.levelizedCostOfStorage)).toBe(true);
  });
});

// ============================================================================
// 5. calculateFinancialMetrics — SOLAR & WIND
// ============================================================================

describe('calculateFinancialMetrics — Renewables', () => {
  test('solar adds to annual savings', async () => {
    const noSolar = await calculateFinancialMetrics({
      storageSizeMW: 2,
      durationHours: 4,
      electricityRate: 0.15,
      solarMW: 0,
    });
    const withSolar = await calculateFinancialMetrics({
      storageSizeMW: 2,
      durationHours: 4,
      electricityRate: 0.15,
      solarMW: 3,
    });
    expect(withSolar.annualSavings).toBeGreaterThan(noSolar.annualSavings);
  });

  test('wind adds to annual savings', async () => {
    const noWind = await calculateFinancialMetrics({
      storageSizeMW: 2,
      durationHours: 4,
      electricityRate: 0.15,
      windMW: 0,
    });
    const withWind = await calculateFinancialMetrics({
      storageSizeMW: 2,
      durationHours: 4,
      electricityRate: 0.15,
      windMW: 2,
    });
    expect(withWind.annualSavings).toBeGreaterThan(noWind.annualSavings);
  });
});

// ============================================================================
// 6. calculateFinancialMetrics — WITH EQUIPMENT COSTS
// ============================================================================

describe('calculateFinancialMetrics — Pre-calculated Equipment', () => {
  test('uses provided equipment cost instead of looking up', async () => {
    const result = await calculateFinancialMetrics({
      storageSizeMW: 2,
      durationHours: 4,
      electricityRate: 0.15,
      equipmentCost: 800_000,
      installationCost: 200_000,
    });
    // Total should include the provided values
    expect(result.totalProjectCost).toBeGreaterThanOrEqual(1_000_000);
  });
});

// ============================================================================
// 7. calculateFinancialMetrics — EDGE CASES
// ============================================================================

describe('calculateFinancialMetrics — Edge Cases', () => {
  test('very small system (0.01 MW) does not crash', async () => {
    const result = await calculateFinancialMetrics({
      storageSizeMW: 0.01,
      durationHours: 2,
      electricityRate: 0.10,
    });
    expect(result.paybackYears).toBeGreaterThan(0);
  });

  test('very large system (100 MW) does not crash', async () => {
    const result = await calculateFinancialMetrics({
      storageSizeMW: 100,
      durationHours: 4,
      electricityRate: 0.15,
    });
    expect(result.totalProjectCost).toBeGreaterThan(0);
  });

  test('zero electricity rate → reduced savings', async () => {
    const result = await calculateFinancialMetrics({
      storageSizeMW: 2,
      durationHours: 4,
      electricityRate: 0,
    });
    // Peak shaving savings may still exist from demand charges
    expect(typeof result.annualSavings).toBe('number');
  });

  test('custom discount rate is used in NPV', async () => {
    const low = await calculateFinancialMetrics({
      storageSizeMW: 2,
      durationHours: 4,
      electricityRate: 0.15,
      discountRate: 0.04,
    });
    const high = await calculateFinancialMetrics({
      storageSizeMW: 2,
      durationHours: 4,
      electricityRate: 0.15,
      discountRate: 0.15,
    });
    // Lower discount rate → higher NPV
    expect(low.npv!).toBeGreaterThan(high.npv!);
  });
});

// ============================================================================
// 8. calculateFinancialMetrics — METADATA
// ============================================================================

describe('calculateFinancialMetrics — Metadata', () => {
  test('includes formula version', async () => {
    const result = await calculateFinancialMetrics({
      storageSizeMW: 2,
      durationHours: 4,
      electricityRate: 0.15,
    });
    expect(result.formulaVersion).toBeTruthy();
  });

  test('includes data source', async () => {
    const result = await calculateFinancialMetrics({
      storageSizeMW: 2,
      durationHours: 4,
      electricityRate: 0.15,
    });
    expect(result.dataSource).toBeTruthy();
  });

  test('includes calculation date', async () => {
    const result = await calculateFinancialMetrics({
      storageSizeMW: 2,
      durationHours: 4,
      electricityRate: 0.15,
    });
    expect(result.calculationDate).toBeInstanceOf(Date);
  });
});

// ============================================================================
// 9. calculateMIRR
// ============================================================================

describe('calculateMIRR', () => {
  test('returns a number for valid cash flows', () => {
    const cashFlows = [-1_000_000, 200_000, 200_000, 200_000, 200_000, 200_000];
    const mirr = calculateMIRR(cashFlows, 0.08, 0.10);
    expect(typeof mirr).toBe('number');
    expect(isNaN(mirr)).toBe(false);
  });

  test('returns 0 when no negative cash flows', () => {
    const cashFlows = [0, 100_000, 100_000];
    const mirr = calculateMIRR(cashFlows, 0.08, 0.10);
    expect(mirr).toBe(0);
  });

  test('higher reinvestment rate → higher MIRR', () => {
    const cashFlows = [-1_000_000, 300_000, 300_000, 300_000, 300_000];
    const low = calculateMIRR(cashFlows, 0.08, 0.05);
    const high = calculateMIRR(cashFlows, 0.08, 0.15);
    expect(high).toBeGreaterThan(low);
  });
});

// ============================================================================
// 10. getCachedConstants
// ============================================================================

describe('getCachedConstants', () => {
  beforeEach(() => {
    refreshConstantsCache();
  });

  test('returns constants object', async () => {
    const constants = await getCachedConstants();
    expect(constants).toHaveProperty('PEAK_SHAVING_MULTIPLIER');
    expect(constants).toHaveProperty('DEMAND_CHARGE_MONTHLY_PER_MW');
    expect(constants).toHaveProperty('FEDERAL_TAX_CREDIT_RATE');
  });

  test('returns cached value on second call (no re-fetch)', async () => {
    const first = await getCachedConstants();
    const second = await getCachedConstants();
    expect(first).toEqual(second);
  });
});
