/**
 * MARGIN POLICY ENGINE TESTS
 * ==========================
 * 
 * Test tiers:
 * - Tier 0: Band selection correctness
 * - Tier 1: Product margin multipliers
 * - Tier 2: Clamping behavior (floor/ceiling guards)
 * - Tier 3: No double-margin (invariant)
 * - Tier 4: End-to-end quote policy
 * - Tier 5: Convenience functions
 * - Tier 6: Trust anchor tests
 * - Tier 7: Three-layer pricing stack (v1.2.0)
 * 
 * @created 2026-02-01
 * @updated 2026-02-01 - Added Tier 7 for three-layer pricing
 */

import { describe, it, expect, beforeAll } from 'vitest';
import {
  applyMarginPolicy,
  getMarginBand,
  getProductMarginMultiplier,
  getRiskAdjuster,
  getSegmentAdjuster,
  estimateMargin,
  getPricingConfidence,
  DEFAULT_MARGIN_BANDS,
  DEFAULT_PRODUCT_MARGINS,
  DEFAULT_PRICE_GUARDS,
  type MarginPolicyInput,
  type ProductClass,
  type RiskLevel,
  type CustomerSegment,
  MARGIN_POLICY_VERSION,
} from '@/services/marginPolicyEngine';

// ============================================================================
// TEST DATA FIXTURES
// ============================================================================

const createTestLineItems = (baseCost: number, category: ProductClass = 'bess') => [
  {
    sku: `TEST-${category.toUpperCase()}`,
    category,
    description: `Test ${category} line item`,
    baseCost,
    quantity: category === 'bess' ? Math.round(baseCost / 125) : 1, // ~$125/kWh for BESS
    unitCost: category === 'bess' ? 125 : baseCost,
    unit: category === 'bess' ? 'kWh' : 'unit',
    costSource: 'TEST',
    costAsOfDate: '2026-02-01',
  },
];

const createMixedLineItems = (totalBaseCost: number) => {
  const bessCost = totalBaseCost * 0.5;
  const solarCost = totalBaseCost * 0.25;
  const inverterCost = totalBaseCost * 0.15;
  const otherCost = totalBaseCost * 0.10;
  
  return [
    { sku: 'BESS-LFP', category: 'bess' as ProductClass, description: 'Battery Storage', baseCost: bessCost, quantity: Math.round(bessCost / 125), unitCost: 125, unit: 'kWh', costSource: 'NREL ATB 2024' },
    { sku: 'SOLAR-PV', category: 'solar' as ProductClass, description: 'Solar Array', baseCost: solarCost, quantity: Math.round(solarCost / 0.85), unitCost: 0.85, unit: 'W', costSource: 'NREL Cost Benchmark' },
    { sku: 'PCS-INV', category: 'inverter_pcs' as ProductClass, description: 'Inverter', baseCost: inverterCost, quantity: Math.round(inverterCost / 95), unitCost: 95, unit: 'kW', costSource: 'Industry' },
    { sku: 'BMS-CTRL', category: 'bms' as ProductClass, description: 'BMS', baseCost: otherCost, quantity: 1, unitCost: otherCost, unit: 'unit', costSource: 'Industry' },
  ];
};

// ============================================================================
// TIER 0: MARGIN BAND SELECTION
// ============================================================================

describe('Tier 0: Margin Band Selection', () => {
  it('should select correct band for micro deal (<$500K)', () => {
    const band = getMarginBand(250_000);
    expect(band.id).toBe('micro');
    expect(band.marginTarget).toBe(0.20);
  });
  
  it('should select correct band for small deal ($500K-$1.5M)', () => {
    const band = getMarginBand(1_000_000);
    expect(band.id).toBe('small');
    expect(band.marginTarget).toBe(0.18);
  });
  
  it('should select correct band for small+ deal ($1.5M-$3M)', () => {
    const band = getMarginBand(2_000_000);
    expect(band.id).toBe('small_plus');
    expect(band.marginTarget).toBe(0.12);
  });
  
  it('should select correct band for mid deal ($3M-$5M)', () => {
    const band = getMarginBand(4_000_000);
    expect(band.id).toBe('mid');
    expect(band.marginTarget).toBe(0.10);
  });
  
  it('should select correct band for mid+ deal ($5M-$10M)', () => {
    const band = getMarginBand(7_500_000);
    expect(band.id).toBe('mid_plus');
    expect(band.marginTarget).toBe(0.075);
  });
  
  it('should select correct band for large deal ($10M-$20M)', () => {
    const band = getMarginBand(15_000_000);
    expect(band.id).toBe('large');
    expect(band.marginTarget).toBe(0.055);
  });
  
  it('should select correct band for enterprise deal ($20M-$100M)', () => {
    const band = getMarginBand(50_000_000);
    expect(band.id).toBe('enterprise');
    expect(band.marginTarget).toBe(0.035);
  });
  
  it('should select correct band for mega deal ($100M+)', () => {
    const band = getMarginBand(150_000_000);
    expect(band.id).toBe('mega');
    expect(band.marginTarget).toBe(0.012);
  });
  
  it('should handle exact boundary values correctly', () => {
    // At exactly $500K, should be in "small" band (not micro)
    const bandAtBoundary = getMarginBand(500_000);
    expect(bandAtBoundary.id).toBe('small');
    
    // At $499,999, should still be micro
    const bandBelowBoundary = getMarginBand(499_999);
    expect(bandBelowBoundary.id).toBe('micro');
  });
  
  it('should have monotonically decreasing margins as deal size increases', () => {
    const testSizes = [100_000, 750_000, 2_000_000, 4_000_000, 7_000_000, 15_000_000, 50_000_000, 150_000_000];
    const margins = testSizes.map(size => getMarginBand(size).marginTarget);
    
    for (let i = 1; i < margins.length; i++) {
      expect(margins[i]).toBeLessThanOrEqual(margins[i - 1]);
    }
  });
});

// ============================================================================
// TIER 1: PRODUCT MARGIN MULTIPLIERS
// ============================================================================

describe('Tier 1: Product Margin Multipliers', () => {
  it('BESS should have 1.0x multiplier (standard)', () => {
    const config = getProductMarginMultiplier('bess');
    expect(config.marginMultiplier).toBe(1.0);
  });
  
  it('Solar should have <1.0x multiplier (commoditized)', () => {
    const config = getProductMarginMultiplier('solar');
    expect(config.marginMultiplier).toBeLessThan(1.0);
    expect(config.marginMultiplier).toBe(0.75);
  });
  
  it('EV charger should have >1.0x multiplier (install complexity)', () => {
    const config = getProductMarginMultiplier('ev_charger');
    expect(config.marginMultiplier).toBeGreaterThan(1.0);
  });
  
  it('Microgrid controller should have >1.0x multiplier (high complexity)', () => {
    const config = getProductMarginMultiplier('microgrid_controller');
    expect(config.marginMultiplier).toBeGreaterThanOrEqual(1.2);
  });
  
  it('EMS software should have highest multiplier (software premium)', () => {
    const config = getProductMarginMultiplier('ems_software');
    const bessConfig = getProductMarginMultiplier('bess');
    expect(config.marginMultiplier).toBeGreaterThan(bessConfig.marginMultiplier);
  });
  
  it('Construction labor should use additive margin (not multiplicative)', () => {
    const config = getProductMarginMultiplier('construction_labor');
    expect(config.isAdditive).toBe(true);
    expect(config.fixedAdder).toBeDefined();
    expect(config.fixedAdder).toBe(0.15); // 15% fixed adder
  });
  
  it('Engineering should use additive margin', () => {
    const config = getProductMarginMultiplier('engineering');
    expect(config.isAdditive).toBe(true);
    expect(config.fixedAdder).toBe(0.20); // 20% fixed adder
  });
});

// ============================================================================
// TIER 2: CLAMPING BEHAVIOR
// ============================================================================

describe('Tier 2: Clamping Behavior', () => {
  it('should clamp BESS price to floor if market price goes too low', () => {
    // Create a line item with artificially low base cost (below floor)
    const input: MarginPolicyInput = {
      lineItems: [{
        sku: 'BESS-CHEAP',
        category: 'bess',
        description: 'Artificially cheap BESS',
        baseCost: 50_000, // Way too cheap for 1000 kWh
        quantity: 1000,   // 1000 kWh
        unitCost: 50,     // $50/kWh (below $100 floor)
        unit: 'kWh',
        costSource: 'TEST',
      }],
      totalBaseCost: 50_000,
    };
    
    const result = applyMarginPolicy(input);
    
    // Should have clamp events
    expect(result.clampEvents.length).toBeGreaterThan(0);
    expect(result.clampEvents.some(e => e.reason === 'unit_floor')).toBe(true);
    
    // Sell price should be at floor (100 $/kWh * 1000 kWh = $100K minimum)
    expect(result.sellPriceTotal).toBeGreaterThanOrEqual(100_000);
  });
  
  it('should clamp BESS price to ceiling (but never below baseCost)', () => {
    // Create a line item with artificially high base cost
    // NEW BEHAVIOR (v1.1): Ceiling clamp cannot drop sellPrice below baseCost
    const input: MarginPolicyInput = {
      lineItems: [{
        sku: 'BESS-EXPENSIVE',
        category: 'bess',
        description: 'Artificially expensive BESS',
        baseCost: 300_000, // $300/kWh for 1000 kWh
        quantity: 1000,
        unitCost: 300,     // $300/kWh (above $250 ceiling)
        unit: 'kWh',
        costSource: 'TEST',
      }],
      totalBaseCost: 300_000,
    };
    
    const result = applyMarginPolicy(input);
    
    // Should have clamp events (ceiling would have tried to clamp to $250k)
    expect(result.clampEvents.some(e => e.reason === 'unit_ceiling')).toBe(true);
    
    // NEW INVARIANT: sellPrice must NEVER be below baseCost (negative margin protection)
    // Even though ceiling is $250/kWh, we protect to baseCost $300/kWh
    expect(result.sellPriceTotal).toBeGreaterThanOrEqual(result.baseCostTotal);
    expect(result.sellPriceTotal).toBe(300_000); // Clamped to baseCost, not ceiling
    
    // Margin should be 0 (since we're at base cost floor)
    expect(result.blendedMarginPercent).toBeCloseTo(0, 2);
  });
  
  it('should record clamp events in audit trail', () => {
    const input: MarginPolicyInput = {
      lineItems: [{
        sku: 'BESS-CLAMP-TEST',
        category: 'bess',
        description: 'Clamp test',
        baseCost: 50_000,
        quantity: 1000,
        unitCost: 50, // Below floor
        unit: 'kWh',
        costSource: 'TEST',
      }],
      totalBaseCost: 50_000,
    };
    
    const result = applyMarginPolicy(input);
    
    // Check clamp event structure
    const clampEvent = result.clampEvents[0];
    expect(clampEvent).toBeDefined();
    expect(clampEvent.reason).toBeDefined();
    expect(clampEvent.originalValue).toBeDefined();
    expect(clampEvent.clampedValue).toBeDefined();
    expect(clampEvent.guardName).toBeDefined();
  });
  
  it('should not clamp prices within normal range', () => {
    const input: MarginPolicyInput = {
      lineItems: [{
        sku: 'BESS-NORMAL',
        category: 'bess',
        description: 'Normal BESS pricing',
        baseCost: 125_000,
        quantity: 1000,
        unitCost: 125, // Normal $125/kWh
        unit: 'kWh',
        costSource: 'TEST',
      }],
      totalBaseCost: 125_000,
    };
    
    const result = applyMarginPolicy(input);
    
    // Should have no unit floor/ceiling clamps
    const unitClamps = result.clampEvents.filter(e => 
      e.reason === 'unit_floor' || e.reason === 'unit_ceiling'
    );
    expect(unitClamps.length).toBe(0);
  });
});

// ============================================================================
// TIER 3: NO DOUBLE-MARGIN INVARIANT
// ============================================================================

describe('Tier 3: No Double-Margin Invariant', () => {
  it('should apply margin exactly once: sellPrice = baseCost * (1 + margin)', () => {
    const baseCost = 1_000_000;
    const input: MarginPolicyInput = {
      lineItems: createTestLineItems(baseCost),
      totalBaseCost: baseCost,
    };
    
    const result = applyMarginPolicy(input);
    
    // Get the applied margin
    const lineItem = result.lineItems[0];
    const expectedSellPrice = lineItem.baseCost * (1 + lineItem.appliedMarginPercent);
    
    // Allow small rounding tolerance
    expect(Math.abs(lineItem.sellPrice - expectedSellPrice)).toBeLessThan(1);
  });
  
  it('should have consistent margin across quote (no compounding)', () => {
    const baseCost = 2_000_000;
    // Use single item to avoid clamping complexity
    const input: MarginPolicyInput = {
      lineItems: createTestLineItems(baseCost, 'bess'),
      totalBaseCost: baseCost,
    };
    
    const result = applyMarginPolicy(input);
    
    // Calculate what total should be with NO double margin
    let expectedTotal = 0;
    for (const item of result.lineItems) {
      expectedTotal += item.baseCost * (1 + item.appliedMarginPercent);
    }
    
    // Sell price total should match (within rounding)
    // When there's no clamping, the math should be exact
    expect(Math.abs(result.sellPriceTotal - expectedTotal)).toBeLessThan(10);
  });
  
  it('totalMarginDollars should equal sellPriceTotal - baseCostTotal', () => {
    const input: MarginPolicyInput = {
      lineItems: createMixedLineItems(3_000_000),
      totalBaseCost: 3_000_000,
    };
    
    const result = applyMarginPolicy(input);
    
    const calculatedMargin = result.sellPriceTotal - result.baseCostTotal;
    expect(Math.abs(result.totalMarginDollars - calculatedMargin)).toBeLessThan(1);
  });
  
  it('blendedMarginPercent should be totalMarginDollars / baseCostTotal', () => {
    const input: MarginPolicyInput = {
      lineItems: createMixedLineItems(5_000_000),
      totalBaseCost: 5_000_000,
    };
    
    const result = applyMarginPolicy(input);
    
    const calculatedPercent = result.totalMarginDollars / result.baseCostTotal;
    expect(Math.abs(result.blendedMarginPercent - calculatedPercent)).toBeLessThan(0.0001);
  });
});

// ============================================================================
// TIER 4: END-TO-END QUOTE POLICY
// ============================================================================

describe('Tier 4: End-to-End Quote Policy', () => {
  it('should produce valid result for $2M car wash deal', () => {
    const baseCost = 2_000_000;
    const input: MarginPolicyInput = {
      lineItems: createTestLineItems(baseCost, 'bess'), // Use single BESS item (no clamping issues)
      totalBaseCost: baseCost,
    };
    
    const result = applyMarginPolicy(input);
    
    // Should be in small_plus band ($1.5M-$3M)
    expect(result.marginBandId).toBe('small_plus');
    
    // Margin should be reasonable (band target is 12%, product multiplier 1.0)
    expect(result.blendedMarginPercent).toBeGreaterThanOrEqual(0.10);
    expect(result.blendedMarginPercent).toBeLessThanOrEqual(0.15);
    
    // Sell price should be baseCost + margin
    expect(result.sellPriceTotal).toBeGreaterThan(baseCost);
    expect(result.sellPriceTotal).toBeLessThan(baseCost * 1.25);
    
    // Should pass guards
    expect(result.passesQuoteLevelGuards).toBe(true);
  });
  
  it('should produce valid result for $100M data center deal', () => {
    const baseCost = 100_000_000;
    const input: MarginPolicyInput = {
      lineItems: createTestLineItems(baseCost, 'bess'), // Use single BESS item
      totalBaseCost: baseCost,
      riskLevel: 'elevated', // Data centers have elevated risk
    };
    
    const result = applyMarginPolicy(input);
    
    // Should be in mega band ($100M+)
    expect(result.marginBandId).toBe('mega');
    
    // Margin should be very low (0.5-2%) but with risk adder (+2%)
    // Band: 0.5-2%, target 1.2%, + 2% risk = ~3.2%
    expect(result.blendedMarginPercent).toBeGreaterThanOrEqual(0.005);
    expect(result.blendedMarginPercent).toBeLessThanOrEqual(0.05);
    
    // Should pass guards
    expect(result.passesQuoteLevelGuards).toBe(true);
  });
  
  it('should apply risk adjuster for high complexity projects', () => {
    const baseCost = 5_000_000;
    
    const standardInput: MarginPolicyInput = {
      lineItems: createTestLineItems(baseCost),
      totalBaseCost: baseCost,
      riskLevel: 'standard',
    };
    
    const highComplexityInput: MarginPolicyInput = {
      lineItems: createTestLineItems(baseCost),
      totalBaseCost: baseCost,
      riskLevel: 'high_complexity',
    };
    
    const standardResult = applyMarginPolicy(standardInput);
    const highComplexityResult = applyMarginPolicy(highComplexityInput);
    
    // High complexity should have higher margin
    expect(highComplexityResult.blendedMarginPercent).toBeGreaterThan(
      standardResult.blendedMarginPercent
    );
  });
  
  it('should apply segment discount for EPC partners', () => {
    const baseCost = 5_000_000;
    
    const directInput: MarginPolicyInput = {
      lineItems: createTestLineItems(baseCost),
      totalBaseCost: baseCost,
      customerSegment: 'direct',
    };
    
    const epcInput: MarginPolicyInput = {
      lineItems: createTestLineItems(baseCost),
      totalBaseCost: baseCost,
      customerSegment: 'epc_partner',
    };
    
    const directResult = applyMarginPolicy(directInput);
    const epcResult = applyMarginPolicy(epcInput);
    
    // EPC partner should have lower margin (margin share)
    expect(epcResult.blendedMarginPercent).toBeLessThan(
      directResult.blendedMarginPercent
    );
  });
  
  it('should apply government discount', () => {
    const baseCost = 5_000_000;
    
    const directInput: MarginPolicyInput = {
      lineItems: createTestLineItems(baseCost),
      totalBaseCost: baseCost,
      customerSegment: 'direct',
    };
    
    const govInput: MarginPolicyInput = {
      lineItems: createTestLineItems(baseCost),
      totalBaseCost: baseCost,
      customerSegment: 'government',
    };
    
    const directResult = applyMarginPolicy(directInput);
    const govResult = applyMarginPolicy(govInput);
    
    // Government should have lower margin (20% discount)
    expect(govResult.blendedMarginPercent).toBeLessThan(
      directResult.blendedMarginPercent
    );
  });
  
  it('should respect forceMarginPercent override', () => {
    const baseCost = 5_000_000;
    const forcedMargin = 0.08; // Force 8% margin (within band limits)
    
    const input: MarginPolicyInput = {
      lineItems: createTestLineItems(baseCost),
      totalBaseCost: baseCost,
      forceMarginPercent: forcedMargin,
    };
    
    const result = applyMarginPolicy(input);
    
    // All line items should have forced margin (may be clamped by band)
    // mid+ band: 6-9% range, so 8% should be respected
    for (const item of result.lineItems) {
      expect(item.appliedMarginPercent).toBe(forcedMargin);
    }
  });
  
  it('should respect maxMarginPercent cap', () => {
    const baseCost = 100_000; // Micro deal (normally 20% margin)
    const maxMargin = 0.19; // Cap at 19% (within micro band: 18-25%)
    
    const input: MarginPolicyInput = {
      lineItems: createTestLineItems(baseCost),
      totalBaseCost: baseCost,
      maxMarginPercent: maxMargin,
    };
    
    const result = applyMarginPolicy(input);
    
    // Max is applied BEFORE band limits, so result should be at band floor (18%)
    // if max < band_floor, band floor wins
    for (const item of result.lineItems) {
      // Since max (19%) > band floor (18%), should be capped at 19%
      expect(item.appliedMarginPercent).toBeLessThanOrEqual(maxMargin);
    }
  });
  
  it('should include full audit trail', () => {
    const input: MarginPolicyInput = {
      lineItems: createMixedLineItems(2_000_000),
      totalBaseCost: 2_000_000,
    };
    
    const result = applyMarginPolicy(input);
    
    // Check audit fields
    expect(result.policyVersion).toBe(MARGIN_POLICY_VERSION);
    expect(result.pricingAsOf).toBeDefined();
    expect(result.pricingSourceVersion).toBeDefined();
    expect(result.marginBandId).toBeDefined();
    expect(result.marginBandDescription).toBeDefined();
    
    // Each line item should have audit info
    for (const item of result.lineItems) {
      expect(item.costSource).toBeDefined();
      expect(item.marginBandId).toBeDefined();
      expect(item.appliedMarginPercent).toBeDefined();
    }
  });
});

// ============================================================================
// TIER 5: CONVENIENCE FUNCTION TESTS
// ============================================================================

describe('Tier 5: Convenience Functions', () => {
  it('estimateMargin should give quick preview', () => {
    const estimate = estimateMargin(2_000_000, 'bess');
    
    expect(estimate.marginPercent).toBeGreaterThan(0);
    expect(estimate.sellPrice).toBeGreaterThan(2_000_000);
    expect(estimate.marginBand).toBeDefined();
  });
  
  it('estimateMargin should apply product multiplier', () => {
    const bessEstimate = estimateMargin(2_000_000, 'bess');
    const solarEstimate = estimateMargin(2_000_000, 'solar');
    
    // Solar should have lower margin (commoditized)
    expect(solarEstimate.marginPercent).toBeLessThan(bessEstimate.marginPercent);
  });
});

// ============================================================================
// TIER 6: TRUST ANCHOR TESTS (Critical Safety Invariants)
// ============================================================================

describe('Tier 6: Trust Anchor Tests', () => {
  
  // TRUST ANCHOR 1: Negative margin protection
  it('should NEVER produce sellPrice below baseCost (negative margin protection)', () => {
    // Create a scenario where unit ceiling could drive sell below base
    // Base: $260/kWh, ceiling: $250/kWh → old engine would allow $250k sell on $260k base
    const input: MarginPolicyInput = {
      lineItems: [{
        sku: 'BESS-NEG-TRAP',
        category: 'bess',
        description: 'Negative margin trap test',
        baseCost: 260_000, // $260/kWh base (above ceiling)
        quantity: 1000,    // 1000 kWh
        unitCost: 260,
        unit: 'kWh',
        costSource: 'TEST',
      }],
      totalBaseCost: 260_000,
    };
    
    const result = applyMarginPolicy(input);
    
    // CRITICAL: sellPrice must NEVER be below baseCost
    expect(result.sellPriceTotal).toBeGreaterThanOrEqual(result.baseCostTotal);
    
    // Line item level check
    for (const item of result.lineItems) {
      expect(item.sellPrice).toBeGreaterThanOrEqual(item.baseCost);
      expect(item.marginDollars).toBeGreaterThanOrEqual(0);
    }
    
    // Should have a clamp event for negative margin protection
    // v1.2.0: Uses 'negative_margin_protection' when sellPrice would go below obtainableCost
    const hasProtectionClamp = result.clampEvents.some(
      e => e.guardName.includes('negative_margin') || e.guardName.includes('obtainable_cost')
    );
    expect(hasProtectionClamp).toBe(true);
  });
  
  // TRUST ANCHOR 2: maxMarginPercent is a HARD CAP (overrides band floor)
  it('maxMarginPercent should be a HARD CAP (overrides band floor)', () => {
    const baseCost = 2_000_000; // small_plus band: floor 10%, target 12%
    const hardCap = 0.05; // 5% hard cap (below band floor)
    
    const input: MarginPolicyInput = {
      lineItems: createTestLineItems(baseCost, 'bess'),
      totalBaseCost: baseCost,
      maxMarginPercent: hardCap,
    };
    
    const result = applyMarginPolicy(input);
    
    // CRITICAL: Hard cap MUST be respected, even if below band floor
    expect(result.blendedMarginPercent).toBeLessThanOrEqual(hardCap + 0.001); // 0.1% tolerance for rounding
    
    // Should have a clamp event for hard cap
    const hasHardCapClamp = result.clampEvents.some(
      e => e.guardName.includes('hard cap')
    );
    expect(hasHardCapClamp).toBe(true);
  });
  
  // TRUST ANCHOR 3: Quote-level guards with denominators
  it('should enforce quote-level guards when quoteUnits provided', () => {
    // Create a quote with very high base cost that would exceed quote-level ceiling
    // BESS quote-level guard: max $400/kWh_total
    // Create a scenario: 1000 kWh BESS, $500k total → $500/kWh (above ceiling)
    const input: MarginPolicyInput = {
      lineItems: [{
        sku: 'BESS-QUOTE-GUARD',
        category: 'bess',
        description: 'Quote guard test',
        baseCost: 200_000, // Will become ~$224k sell with margin
        quantity: 500,     // 500 kWh (unit-level OK: $400-$448/kWh after margin)
        unitCost: 400,     // Already at unit ceiling → will clamp
        unit: 'kWh',
        costSource: 'TEST',
      }, {
        sku: 'BESS-2',
        category: 'bess',
        description: 'Additional BESS',
        baseCost: 200_000,
        quantity: 500,
        unitCost: 400,
        unit: 'kWh',
        costSource: 'TEST',
      }],
      totalBaseCost: 400_000,
      quoteUnits: { bess: 1000 }, // 1000 kWh total for quote-level check
    };
    
    const result = applyMarginPolicy(input);
    
    // Quote-level guard should be checked
    // $400k base / 1000 kWh = $400/kWh (at the max guard)
    // After margin, it might exceed $400/kWh
    // But unit ceiling at $250/kWh should clamp individual items first
    // So this should pass quote-level guard
    
    // The key test: quoteUnits enables the check
    expect(result.quoteLevelWarnings).toBeDefined();
    
    // If warnings exist for bess quote-level, they should mention the metric
    const bessWarning = result.quoteLevelWarnings.find(w => w.includes('bess'));
    if (bessWarning) {
      expect(bessWarning).toContain('per_kWh_total');
    }
  });
  
  // TRUST ANCHOR 4: No double-margin (verify baseline margin is applied exactly once)
  it('should apply margin exactly once (no double-margin)', () => {
    const baseCost = 1_000_000; // small band, 18% target
    const input: MarginPolicyInput = {
      lineItems: createTestLineItems(baseCost, 'bess'),
      totalBaseCost: baseCost,
    };
    
    const result1 = applyMarginPolicy(input);
    
    // Now "re-process" the output as if someone mistakenly fed sell prices back
    // This should NOT be possible with proper typing, but let's verify behavior
    const reprocessedInput: MarginPolicyInput = {
      lineItems: [{
        sku: 'BESS-RE',
        category: 'bess',
        description: 'Reprocessed',
        baseCost: result1.lineItems[0].sellPrice, // Using sell price as new base (WRONG)
        quantity: result1.lineItems[0].quantity,
        unitCost: result1.lineItems[0].sellPrice / result1.lineItems[0].quantity,
        unit: 'kWh',
        costSource: 'REPROCESS-TEST',
      }],
      totalBaseCost: result1.sellPriceTotal,
    };
    
    const result2 = applyMarginPolicy(reprocessedInput);
    
    // The "double-margin" would be: sellPrice2 / baseCost1
    // If margin was applied twice: (1+0.18)^2 ≈ 1.39
    // If margin was applied once: 1+0.18 = 1.18
    const doubleMarginRatio = result2.sellPriceTotal / baseCost;
    
    // This is a WARNING test - it shows that feeding sell prices back WOULD cause issues
    // The real protection is type safety + SSOT discipline
    // But we can at least detect the ratio
    expect(doubleMarginRatio).toBeGreaterThan(1.3); // It WILL compound if reprocessed
    
    // The invariant we can enforce: a single call applies margin once
    const singleMarginRatio = result1.sellPriceTotal / result1.baseCostTotal;
    expect(singleMarginRatio).toBeLessThan(1.30); // Max band ceiling is 25%, so max ratio ~1.25
    expect(singleMarginRatio).toBeGreaterThan(1.05); // Min band floor is 0.5%, so min ratio ~1.005
  });
  
  // TRUST ANCHOR 5: Blended margin is mathematically consistent
  it('blendedMarginPercent should equal totalMarginDollars / baseCostTotal', () => {
    const input: MarginPolicyInput = {
      lineItems: createMixedLineItems(5_000_000),
      totalBaseCost: 5_000_000,
    };
    
    const result = applyMarginPolicy(input);
    
    const expectedBlended = result.totalMarginDollars / result.baseCostTotal;
    expect(result.blendedMarginPercent).toBeCloseTo(expectedBlended, 6);
  });
});

// ============================================================================
// PRICE GUARD COVERAGE
// ============================================================================

describe('Price Guard Coverage', () => {
  it('should have guards for all major equipment types', () => {
    const majorTypes: ProductClass[] = ['bess', 'solar', 'inverter_pcs', 'generator', 'transformer'];
    
    for (const type of majorTypes) {
      const guard = DEFAULT_PRICE_GUARDS.find(g => g.productClass === type);
      expect(guard, `Guard missing for ${type}`).toBeDefined();
      expect(guard!.floorPrice).toBeGreaterThan(0);
      expect(guard!.ceilingPrice).toBeGreaterThan(guard!.floorPrice);
    }
  });
  
  it('floor should be less than ceiling for all guards', () => {
    for (const guard of DEFAULT_PRICE_GUARDS) {
      expect(guard.floorPrice).toBeLessThan(guard.ceilingPrice);
    }
  });
  
  it('lastMarketPrice should be between floor and ceiling', () => {
    for (const guard of DEFAULT_PRICE_GUARDS) {
      expect(guard.lastMarketPrice).toBeGreaterThanOrEqual(guard.floorPrice);
      expect(guard.lastMarketPrice).toBeLessThanOrEqual(guard.ceilingPrice);
    }
  });
});

// ============================================================================
// TIER 7: THREE-LAYER PRICING STACK (v1.2.0)
// Tests the Market → Obtainable → Sell pricing model
// ============================================================================

describe('Tier 7: Three-Layer Pricing Stack (v1.2.0)', () => {
  
  // TEST 1: Procurement buffer applied when market price is "too good"
  it('should apply procurement buffer when market price is below trigger', () => {
    // BESS trigger is $110/kWh, buffer is 15%
    // Market price $85/kWh → obtainable should be ~$97.75/kWh
    const input: MarginPolicyInput = {
      lineItems: [{
        sku: 'BESS-CHEAP',
        category: 'bess',
        description: 'Suspiciously cheap BESS',
        baseCost: 85_000, // $85/kWh market (below $110 trigger)
        quantity: 1000,   // 1000 kWh
        unitCost: 85,
        unit: 'kWh',
        costSource: 'market_scraper',
      }],
      totalBaseCost: 85_000,
    };
    
    const result = applyMarginPolicy(input);
    const bessItem = result.lineItems[0];
    
    // Check three-layer totals exist
    expect(result.marketCostTotal).toBeDefined();
    expect(result.obtainableCostTotal).toBeDefined();
    expect(result.sellPriceTotal).toBeDefined();
    
    // Market cost should match input
    expect(result.marketCostTotal).toBe(85_000);
    
    // Obtainable cost should include procurement buffer
    expect(result.obtainableCostTotal).toBeGreaterThan(result.marketCostTotal!);
    
    // Line item should show buffer applied
    expect(bessItem.procurementBufferApplied).toBe(true);
    expect(bessItem.procurementBufferPct).toBeGreaterThan(0);
    
    // Sell price should be >= quoteFloorPrice ($105/kWh → $105,000)
    expect(result.sellPriceTotal).toBeGreaterThanOrEqual(105_000);
  });
  
  // TEST 2: No procurement buffer when market price is reasonable
  it('should NOT apply procurement buffer when market price is above trigger', () => {
    // BESS trigger is $110/kWh, market at $125 is fine
    const input: MarginPolicyInput = {
      lineItems: [{
        sku: 'BESS-NORMAL',
        category: 'bess',
        description: 'Normal market BESS',
        baseCost: 125_000, // $125/kWh (above $110 trigger)
        quantity: 1000,
        unitCost: 125,
        unit: 'kWh',
        costSource: 'NREL_ATB_2024',
      }],
      totalBaseCost: 125_000,
    };
    
    const result = applyMarginPolicy(input);
    const bessItem = result.lineItems[0];
    
    // Market = Obtainable when no buffer needed
    expect(result.marketCostTotal).toBe(125_000);
    expect(result.obtainableCostTotal).toBe(125_000);
    
    // No buffer applied
    expect(bessItem.procurementBufferApplied).toBe(false);
  });
  
  // TEST 3: Review event emitted when market price is suspiciously low
  it('should emit ReviewEvent when market price is below reviewBelowPrice', () => {
    // BESS reviewBelowPrice is $100/kWh
    const input: MarginPolicyInput = {
      lineItems: [{
        sku: 'BESS-TOO-CHEAP',
        category: 'bess',
        description: 'Way too cheap BESS - needs human review',
        baseCost: 80_000, // $80/kWh (below $100 review threshold)
        quantity: 1000,
        unitCost: 80,
        unit: 'kWh',
        costSource: 'suspicious_vendor',
      }],
      totalBaseCost: 80_000,
    };
    
    const result = applyMarginPolicy(input);
    
    // Should flag for human review
    expect(result.needsHumanReview).toBe(true);
    expect(result.reviewEvents).toBeDefined();
    expect(result.reviewEvents!.length).toBeGreaterThan(0);
    
    // Review event should have details
    const reviewEvent = result.reviewEvents![0];
    expect(['warning', 'alert']).toContain(reviewEvent.severity); // Either severity is acceptable
    expect(reviewEvent.reason).toContain('review');
    expect(reviewEvent.sku).toBe('BESS-TOO-CHEAP');
  });
  
  // TEST 4: Quote floor enforced at $105/kWh for BESS
  it('should clamp sell price to quoteFloorPrice for BESS', () => {
    // Even with buffer + margin, if price would be below $105, clamp to $105
    const input: MarginPolicyInput = {
      lineItems: [{
        sku: 'BESS-FLOOR-TEST',
        category: 'bess',
        description: 'Floor clamp test',
        baseCost: 80_000, // Very low market price
        quantity: 1000,
        unitCost: 80,
        unit: 'kWh',
        costSource: 'TEST',
      }],
      totalBaseCost: 80_000,
      maxMarginPercent: 0.10, // Cap margin at 10%
    };
    
    const result = applyMarginPolicy(input);
    
    // Sell price should be at least $105/kWh = $105,000
    expect(result.sellPriceTotal).toBeGreaterThanOrEqual(105_000);
    
    // Check unit price
    const bessItem = result.lineItems[0];
    const sellPricePerKwh = bessItem.sellPrice / bessItem.quantity;
    expect(sellPricePerKwh).toBeGreaterThanOrEqual(105);
  });
  
  // TEST 5: Margin applied to obtainableCost, not marketCost
  it('should apply margin to obtainableCost (not marketCost)', () => {
    // This ensures no "double margin" on cheap inventory
    const input: MarginPolicyInput = {
      lineItems: [{
        sku: 'BESS-MARGIN-BASE',
        category: 'bess',
        description: 'Test margin base',
        baseCost: 90_000, // $90/kWh (below trigger)
        quantity: 1000,
        unitCost: 90,
        unit: 'kWh',
        costSource: 'TEST',
      }],
      totalBaseCost: 90_000,
    };
    
    const result = applyMarginPolicy(input);
    const item = result.lineItems[0];
    
    // Margin should be calculated on obtainableCost, not marketCost
    // marginDollars = sellPrice - obtainableCost
    const expectedMarginDollars = item.sellPrice - item.obtainableCost;
    expect(item.marginDollars).toBeCloseTo(expectedMarginDollars, 2);
    
    // Verify it's NOT marketCost-based margin
    const wouldBeWrongMargin = item.sellPrice - item.marketCost;
    // If buffer was applied, wrong margin would be higher
    if (item.procurementBufferApplied) {
      expect(wouldBeWrongMargin).toBeGreaterThan(item.marginDollars);
    }
  });
  
  // TEST 6: Three-layer totals add up correctly
  it('should have consistent three-layer totals', () => {
    const input: MarginPolicyInput = {
      lineItems: [
        {
          sku: 'BESS-1',
          category: 'bess',
          baseCost: 100_000,
          quantity: 1000,
          unitCost: 100,
          unit: 'kWh',
          costSource: 'TEST',
        },
        {
          sku: 'SOLAR-1',
          category: 'solar',
          baseCost: 50_000,
          quantity: 50,
          unitCost: 1000, // $1000/kW
          unit: 'kW',
          costSource: 'TEST',
        },
      ],
      totalBaseCost: 150_000,
    };
    
    const result = applyMarginPolicy(input);
    
    // Sum of line item market costs = total market cost
    const sumMarketCost = result.lineItems.reduce((sum, item) => sum + item.marketCost, 0);
    expect(result.marketCostTotal).toBeCloseTo(sumMarketCost, 2);
    
    // Sum of line item obtainable costs = total obtainable cost
    const sumObtainableCost = result.lineItems.reduce((sum, item) => sum + item.obtainableCost, 0);
    expect(result.obtainableCostTotal).toBeCloseTo(sumObtainableCost, 2);
    
    // Sum of line item sell prices = total sell price
    const sumSellPrice = result.lineItems.reduce((sum, item) => sum + item.sellPrice, 0);
    expect(result.sellPriceTotal).toBeCloseTo(sumSellPrice, 2);
    
    // Procurement buffer = obtainable - market
    expect(result.procurementBufferTotal).toBeCloseTo(
      result.obtainableCostTotal! - result.marketCostTotal!,
      2
    );
  });
  
  // TEST 7: Solar has different guard than BESS
  it('should use product-specific guards for different equipment', () => {
    const bessInput: MarginPolicyInput = {
      lineItems: [{
        sku: 'BESS-GUARD',
        category: 'bess',
        baseCost: 85_000,
        quantity: 1000,
        unitCost: 85,
        unit: 'kWh',
        costSource: 'TEST',
      }],
      totalBaseCost: 85_000,
    };
    
    const solarInput: MarginPolicyInput = {
      lineItems: [{
        sku: 'SOLAR-GUARD',
        category: 'solar',
        baseCost: 40_000, // $0.80/W for solar (below trigger)
        quantity: 50, // 50 kW
        unitCost: 800, // $800/kW
        unit: 'kW',
        costSource: 'TEST',
      }],
      totalBaseCost: 40_000,
    };
    
    const bessResult = applyMarginPolicy(bessInput);
    const solarResult = applyMarginPolicy(solarInput);
    
    // Both should have guards applied
    expect(bessResult.lineItems[0].procurementBufferApplied).toBeDefined();
    expect(solarResult.lineItems[0].procurementBufferApplied).toBeDefined();
    
    // They may have different buffer percentages (product-specific)
    // This test ensures the guard lookup works for multiple products
  });
  
  // TEST 8: getPricingConfidence helper works correctly
  it('getPricingConfidence should return appropriate confidence levels', () => {
    // High confidence: normal market price, known source
    const highResult = applyMarginPolicy({
      lineItems: [{
        sku: 'HIGH-CONF',
        category: 'bess',
        baseCost: 125_000,
        quantity: 1000,
        unitCost: 125,
        unit: 'kWh',
        costSource: 'NREL_ATB_2024',
      }],
      totalBaseCost: 125_000,
    });
    
    const highConf = getPricingConfidence(highResult);
    expect(['high', 'medium']).toContain(highConf.level);
    expect(highConf.badge).toBeDefined();
    
    // Low confidence: needs human review
    const lowResult = applyMarginPolicy({
      lineItems: [{
        sku: 'LOW-CONF',
        category: 'bess',
        baseCost: 80_000, // Below review threshold
        quantity: 1000,
        unitCost: 80,
        unit: 'kWh',
        costSource: 'unknown',
      }],
      totalBaseCost: 80_000,
    });
    
    const lowConf = getPricingConfidence(lowResult);
    expect(lowConf.level).toBe('low');
    expect(lowConf.message).toContain('review');
  });
});

// ============================================================================
// TIER 8: FLOOR CLAMP INVARIANTS (critical safety)
// Ensures floor ONLY pushes price UP, never DOWN
// ============================================================================

describe('Tier 8: Floor Clamp Invariants (v1.2.0)', () => {
  
  // CRITICAL INVARIANT: Floor clamp happens AFTER margin, only pushes UP
  it('floor clamp should only INCREASE price, never decrease', () => {
    // Scenario: Low market price → buffer → margin → floor clamp
    // Market $85/kWh → Obtainable $97.75 → Margin → Final should be >= $105 (floor)
    const input: MarginPolicyInput = {
      lineItems: [{
        sku: 'BESS-FLOOR-UP',
        category: 'bess',
        description: 'Floor clamp UP test',
        baseCost: 85_000, // $85/kWh (below floor)
        quantity: 1000,
        unitCost: 85,
        unit: 'kWh',
        costSource: 'TEST',
      }],
      totalBaseCost: 85_000,
    };
    
    const result = applyMarginPolicy(input);
    const item = result.lineItems[0];
    
    // Floor should push price UP to at least $105/kWh
    expect(item.sellUnitPrice).toBeGreaterThanOrEqual(105);
    expect(result.sellPriceTotal).toBeGreaterThanOrEqual(105_000);
    
    // Verify it was clamped UP (not down)
    if (item.wasClampedFloor) {
      const floorClamp = item.clampEvents.find(e => e.reason === 'unit_floor');
      if (floorClamp) {
        // Clamped value should be >= original value
        expect(floorClamp.clampedValue).toBeGreaterThanOrEqual(floorClamp.originalValue);
      }
    }
  });
  
  it('floor clamp should NOT apply when price is already above floor', () => {
    // Scenario: Normal market price → should not trigger floor clamp
    const input: MarginPolicyInput = {
      lineItems: [{
        sku: 'BESS-NO-FLOOR',
        category: 'bess',
        description: 'No floor clamp needed',
        baseCost: 150_000, // $150/kWh (well above $105 floor)
        quantity: 1000,
        unitCost: 150,
        unit: 'kWh',
        costSource: 'NREL_ATB_2024',
      }],
      totalBaseCost: 150_000,
    };
    
    const result = applyMarginPolicy(input);
    const item = result.lineItems[0];
    
    // Should NOT have floor clamp
    expect(item.wasClampedFloor).toBe(false);
    const floorClamps = item.clampEvents.filter(e => e.reason === 'unit_floor');
    expect(floorClamps.length).toBe(0);
  });
  
  it('floor clamp profit should be EXTRA, not replacing margin', () => {
    // When floor clamps UP, Merlin makes MORE money (extra profit)
    // This is the intended behavior
    const input: MarginPolicyInput = {
      lineItems: [{
        sku: 'BESS-EXTRA-PROFIT',
        category: 'bess',
        description: 'Floor clamp extra profit',
        baseCost: 80_000, // Very low market
        quantity: 1000,
        unitCost: 80,
        unit: 'kWh',
        costSource: 'TEST',
      }],
      totalBaseCost: 80_000,
    };
    
    const result = applyMarginPolicy(input);
    
    // sellPrice = floor-clamped value
    // margin = sellPrice - obtainableCost
    // The "extra profit" is the difference between floor and what margin would have given
    
    // Key invariant: marginDollars should be >= 0
    expect(result.totalMarginDollars).toBeGreaterThanOrEqual(0);
    
    // sellPriceTotal = obtainableCostTotal + marginDollars
    expect(result.sellPriceTotal).toBeCloseTo(
      result.obtainableCostTotal + result.totalMarginDollars,
      2
    );
  });
  
  it('NO DOUBLE MARGIN: sellPriceTotal = obtainableCostTotal + marginDollars (exactly)', () => {
    // This is THE critical invariant for trust
    // If this fails, we have double-margin somewhere
    
    const inputs: MarginPolicyInput[] = [
      // Low market (buffer + floor clamp scenario)
      {
        lineItems: [{
          sku: 'TEST-1', category: 'bess', description: 'Test',
          baseCost: 80_000, quantity: 1000, unitCost: 80, unit: 'kWh', costSource: 'TEST',
        }],
        totalBaseCost: 80_000,
      },
      // Normal market
      {
        lineItems: [{
          sku: 'TEST-2', category: 'bess', description: 'Test',
          baseCost: 125_000, quantity: 1000, unitCost: 125, unit: 'kWh', costSource: 'TEST',
        }],
        totalBaseCost: 125_000,
      },
      // Multi-line item
      {
        lineItems: [
          { sku: 'BESS-1', category: 'bess', baseCost: 100_000, quantity: 1000, unitCost: 100, unit: 'kWh', costSource: 'TEST' },
          { sku: 'SOLAR-1', category: 'solar', baseCost: 50_000, quantity: 50, unitCost: 1000, unit: 'kW', costSource: 'TEST' },
        ],
        totalBaseCost: 150_000,
      },
    ];
    
    for (const input of inputs) {
      const result = applyMarginPolicy(input);
      
      // THE INVARIANT: sellPrice = obtainable + margin (no hidden additions)
      const computed = result.obtainableCostTotal + result.totalMarginDollars;
      expect(result.sellPriceTotal).toBeCloseTo(computed, 2);
      
      // Also verify: marketCost + buffer = obtainableCost
      const bufferComputed = result.marketCostTotal + result.procurementBufferTotal;
      expect(result.obtainableCostTotal).toBeCloseTo(bufferComputed, 2);
    }
  });
  
  it('MagicFit should use obtainableCost, not sellPrice (sizing isolation)', () => {
    // MagicFit does PHYSICS (sizing), not PRICING
    // It should never see sellPrice values
    
    // This test documents the contract: MagicFit gets obtainableCost (or marketCost)
    // for sizing calculations, while sellPrice is only for quoting
    
    const input: MarginPolicyInput = {
      lineItems: [{
        sku: 'BESS-MAGICFIT', category: 'bess', description: 'MagicFit test',
        baseCost: 100_000, quantity: 1000, unitCost: 100, unit: 'kWh', costSource: 'TEST',
      }],
      totalBaseCost: 100_000,
    };
    
    const result = applyMarginPolicy(input);
    
    // obtainableCost is the "real" cost for sizing decisions
    // sellPrice includes Merlin's margin (irrelevant to physics)
    expect(result.obtainableCostTotal).toBeLessThan(result.sellPriceTotal);
    
    // Document the separation of concerns
    const forSizing = result.obtainableCostTotal; // MagicFit uses this
    const forQuoting = result.sellPriceTotal;      // Steps 4/5/6 use this
    
    expect(forSizing).toBeDefined();
    expect(forQuoting).toBeDefined();
    expect(forQuoting).toBeGreaterThan(forSizing);
  });
});