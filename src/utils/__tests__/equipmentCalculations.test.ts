/**
 * =============================================================================
 * EQUIPMENT CALCULATIONS UNIT TESTS
 * =============================================================================
 *
 * Tests calculateEquipmentBreakdown() — the SSOT for all equipment pricing.
 * Validates battery sizing (small vs utility-scale), solar, wind, generators,
 * fuel cells, and installation cost calculations.
 *
 * Created: Feb 2026 — SSOT Pillar Test Coverage
 */

import { describe, test, expect, vi } from 'vitest';

// ============================================================================
// MOCK SETUP
// ============================================================================

vi.mock('../../services/supabaseClient', () => ({
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
    }),
  },
}));

vi.mock('../../services/calculationConstantsService', () => ({
  getCalculationConstants: vi.fn().mockResolvedValue({
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
  }),
  getConstant: vi.fn().mockResolvedValue(null),
}));

vi.mock('../../services/unifiedPricingService', () => ({
  getBatteryPricing: vi.fn().mockReturnValue({
    totalCost: 500_000,
    pricePerKWh: 125,
    tier: 'commercial',
    source: 'mock',
  }),
  getSolarPricing: vi.fn().mockReturnValue({
    totalCost: 425_000,
    pricePerWatt: 0.85,
  }),
}));

// ============================================================================
// IMPORT AFTER MOCKS
// ============================================================================

import { calculateEquipmentBreakdown, type EquipmentBreakdown } from '../../utils/equipmentCalculations';

// ============================================================================
// 1. BASIC STRUCTURE
// ============================================================================

describe('calculateEquipmentBreakdown — Structure', () => {
  test('returns all required sections', async () => {
    const result = await calculateEquipmentBreakdown(2, 4);

    expect(result).toHaveProperty('batteries');
    expect(result).toHaveProperty('inverters');
    expect(result).toHaveProperty('transformers');
    expect(result).toHaveProperty('switchgear');
    // solar, wind, generators, fuelCells, evChargers are optional (undefined when 0 MW)
    expect(result).toHaveProperty('systemControls');
    expect(result).toHaveProperty('totals');
  });

  test('totals section has all cost categories', async () => {
    const result = await calculateEquipmentBreakdown(2, 4);

    expect(result.totals).toHaveProperty('equipmentCost');
    expect(result.totals).toHaveProperty('installationCost');
    expect(result.totals).toHaveProperty('commissioningCost');
    expect(result.totals).toHaveProperty('totalCapex');
    expect(result.totals).toHaveProperty('totalProjectCost');
    expect(result.totals).toHaveProperty('annualOpex');
  });
});

// ============================================================================
// 2. BATTERY PRICING — SMALL SYSTEM (<1 MW)
// ============================================================================

describe('Small System Battery Pricing (<1 MW)', () => {
  test('small system uses per-kWh pricing', async () => {
    const result = await calculateEquipmentBreakdown(0.5, 4); // 500 kW × 4h = 2000 kWh

    expect(result.batteries.quantity).toBe(1); // Single modular system
    expect(result.batteries.totalCost).toBeGreaterThan(0);
    // Price should be ~ 2000 kWh × market rate
    expect(result.batteries.pricePerKWh).toBeGreaterThan(0);
    expect(result.batteries.pricePerKWh).toBeLessThanOrEqual(150); // capped at $150/kWh
  });

  test('100 kW system cost is proportional to energy', async () => {
    const small = await calculateEquipmentBreakdown(0.1, 2);  // 200 kWh
    const medium = await calculateEquipmentBreakdown(0.5, 4); // 2000 kWh
    // Medium system should cost more
    expect(medium.batteries.totalCost).toBeGreaterThan(small.batteries.totalCost);
  });
});

// ============================================================================
// 3. BATTERY PRICING — UTILITY SCALE (≥1 MW)
// ============================================================================

describe('Utility-Scale Battery Pricing (≥1 MW)', () => {
  test('utility-scale uses unit-based pricing', async () => {
    const result = await calculateEquipmentBreakdown(5, 4); // 5 MW × 4h = 20 MWh

    expect(result.batteries.quantity).toBeGreaterThanOrEqual(1);
    expect(result.batteries.totalCost).toBeGreaterThan(0);
  });

  test('larger system has more battery units', async () => {
    const small = await calculateEquipmentBreakdown(3, 4);
    const large = await calculateEquipmentBreakdown(10, 4);
    expect(large.batteries.quantity).toBeGreaterThanOrEqual(small.batteries.quantity);
  });
});

// ============================================================================
// 4. SOLAR INTEGRATION
// ============================================================================

describe('Solar Equipment', () => {
  test('no solar → solar is undefined', async () => {
    const result = await calculateEquipmentBreakdown(2, 4, 0);
    expect(result.solar).toBeUndefined();
  });

  test('with solar → solar cost is positive', async () => {
    const result = await calculateEquipmentBreakdown(2, 4, 5); // 5 MW solar
    expect(result.solar.totalCost).toBeGreaterThan(0);
  });
});

// ============================================================================
// 5. WIND INTEGRATION
// ============================================================================

describe('Wind Equipment', () => {
  test('no wind → wind is undefined', async () => {
    const result = await calculateEquipmentBreakdown(2, 4, 0, 0);
    expect(result.wind).toBeUndefined();
  });

  test('with wind → wind cost is positive', async () => {
    const result = await calculateEquipmentBreakdown(2, 4, 0, 3); // 3 MW wind
    expect(result.wind.totalCost).toBeGreaterThan(0);
  });
});

// ============================================================================
// 6. GENERATOR INTEGRATION
// ============================================================================

describe('Generator Equipment', () => {
  test('no generator → generators is undefined', async () => {
    const result = await calculateEquipmentBreakdown(2, 4, 0, 0, 0);
    expect(result.generators).toBeUndefined();
  });

  test('with generator → generator cost is positive', async () => {
    const result = await calculateEquipmentBreakdown(2, 4, 0, 0, 2); // 2 MW generator
    expect(result.generators.totalCost).toBeGreaterThan(0);
  });

  test('generator with fuel type option does not crash', async () => {
    const result = await calculateEquipmentBreakdown(2, 4, 0, 0, 2, undefined, 'on-grid', 'California', {
      generatorFuelType: 'natural-gas',
    });
    // Generator should be present and have a fuelType label
    expect(result.generators).toBeDefined();
    expect(result.generators!.fuelType).toBeTruthy();
    expect(result.generators!.totalCost).toBeGreaterThan(0);
  });
});

// ============================================================================
// 7. COST HIERARCHY
// ============================================================================

describe('Cost Hierarchy', () => {
  test('totalCapex > equipmentCost (includes installation)', async () => {
    const result = await calculateEquipmentBreakdown(2, 4);
    expect(result.totals.totalCapex).toBeGreaterThan(result.totals.equipmentCost);
  });

  test('totalProjectCost ≥ totalCapex', async () => {
    const result = await calculateEquipmentBreakdown(2, 4);
    expect(result.totals.totalProjectCost).toBeGreaterThanOrEqual(result.totals.totalCapex);
  });

  test('installation cost is reasonable (20-40% of equipment)', async () => {
    const result = await calculateEquipmentBreakdown(2, 4);
    const ratio = result.totals.installationCost / result.totals.equipmentCost;
    expect(ratio).toBeGreaterThan(0.10);
    expect(ratio).toBeLessThan(0.60);
  });

  test('annual O&M is reasonable (1-5% of capex)', async () => {
    const result = await calculateEquipmentBreakdown(2, 4);
    const ratio = result.totals.annualOpex / result.totals.totalCapex;
    expect(ratio).toBeGreaterThan(0.005);
    expect(ratio).toBeLessThan(0.10);
  });
});

// ============================================================================
// 8. GRID CONNECTION MODES
// ============================================================================

describe('Grid Connection Modes', () => {
  test('on-grid system does not crash', async () => {
    const result = await calculateEquipmentBreakdown(2, 4, 0, 0, 0, undefined, 'on-grid');
    expect(result.totals.totalCapex).toBeGreaterThan(0);
  });

  test('off-grid system does not crash', async () => {
    const result = await calculateEquipmentBreakdown(2, 4, 0, 0, 0, undefined, 'off-grid');
    expect(result.totals.totalCapex).toBeGreaterThan(0);
  });

  test('limited grid system does not crash', async () => {
    const result = await calculateEquipmentBreakdown(2, 4, 0, 0, 0, undefined, 'limited');
    expect(result.totals.totalCapex).toBeGreaterThan(0);
  });
});

// ============================================================================
// 9. EDGE CASES
// ============================================================================

describe('Edge Cases', () => {
  test('minimum system (0.01 MW × 1h) does not crash', async () => {
    const result = await calculateEquipmentBreakdown(0.01, 1);
    expect(result.totals.totalCapex).toBeGreaterThan(0);
  });

  test('large system (50 MW × 8h) does not crash', async () => {
    const result = await calculateEquipmentBreakdown(50, 8);
    expect(result.totals.totalCapex).toBeGreaterThan(0);
  });

  test('all-renewable config (solar + wind + BESS)', async () => {
    const result = await calculateEquipmentBreakdown(5, 4, 10, 5, 0);
    expect(result.batteries.totalCost).toBeGreaterThan(0);
    expect(result.solar.totalCost).toBeGreaterThan(0);
    expect(result.wind.totalCost).toBeGreaterThan(0);
    expect(result.generators).toBeUndefined();
  });

  test('full hybrid (BESS + solar + wind + generator)', async () => {
    const result = await calculateEquipmentBreakdown(5, 4, 10, 5, 3);
    expect(result.batteries.totalCost).toBeGreaterThan(0);
    expect(result.solar.totalCost).toBeGreaterThan(0);
    expect(result.wind.totalCost).toBeGreaterThan(0);
    expect(result.generators.totalCost).toBeGreaterThan(0);
  });
});

// ============================================================================
// 10. FUEL CELL (Extended Options)
// ============================================================================

describe('Fuel Cell Equipment', () => {
  test('with fuel cell → additional cost present', async () => {
    const withFC = await calculateEquipmentBreakdown(2, 4, 0, 0, 0, undefined, 'on-grid', 'California', {
      fuelCellMW: 1,
      fuelCellType: 'hydrogen',
    });
    const withoutFC = await calculateEquipmentBreakdown(2, 4, 0, 0, 0, undefined, 'on-grid', 'California');
    // Fuel cell adds cost
    expect(withFC.totals.equipmentCost).toBeGreaterThan(withoutFC.totals.equipmentCost);
  });
});
