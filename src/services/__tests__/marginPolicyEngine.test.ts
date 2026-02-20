/**
 * =============================================================================
 * MARGIN POLICY ENGINE UNIT TESTS
 * =============================================================================
 *
 * Tests the three-layer pricing stack: Market → Obtainable → Sell.
 * Validates band selection, product multipliers, risk/segment adjusters,
 * price guards, clamping, negative-margin protection, and convenience fns.
 *
 * Created: Feb 2026 — SSOT Pillar Test Coverage
 */

import { describe, test, expect, it } from 'vitest';
import {
  applyMarginPolicy,
  estimateMargin,
  formatMarginInfo,
  getPricingConfidence,
  getMarginBand,
  getProductMarginMultiplier,
  getRiskAdjuster,
  getSegmentAdjuster,
  getPriceGuard,
  DEFAULT_MARGIN_BANDS,
  DEFAULT_PRODUCT_MARGINS,
  DEFAULT_RISK_ADJUSTERS,
  DEFAULT_SEGMENT_ADJUSTERS,
  DEFAULT_PRICE_GUARDS,
  DEFAULT_QUOTE_GUARDS,
  MARGIN_POLICY_VERSION,
  type MarginPolicyInput,
  type ProductClass,
} from '../marginPolicyEngine';

// ============================================================================
// HELPERS
// ============================================================================

function makeLineItem(overrides: Partial<MarginPolicyInput['lineItems'][0]> = {}) {
  return {
    sku: 'BESS-001',
    category: 'bess' as ProductClass,
    description: 'Battery Energy Storage System',
    baseCost: 500_000,
    quantity: 4000,      // 4000 kWh
    unitCost: 125,       // $125/kWh
    unit: 'kWh',
    costSource: 'NREL ATB 2024',
    ...overrides,
  };
}

function makeInput(overrides: Partial<MarginPolicyInput> = {}): MarginPolicyInput {
  const items = overrides.lineItems || [makeLineItem()];
  return {
    lineItems: items,
    totalBaseCost: overrides.totalBaseCost ?? items.reduce((s, i) => s + i.baseCost, 0),
    ...overrides,
  };
}

// ============================================================================
// 1. BAND SELECTION
// ============================================================================

describe('Margin Band Selection', () => {
  test('$100K → micro band', () => {
    expect(getMarginBand(100_000).id).toBe('micro');
  });

  test('$500K → small band (boundary)', () => {
    expect(getMarginBand(500_000).id).toBe('small');
  });

  test('$2M → small_plus band', () => {
    expect(getMarginBand(2_000_000).id).toBe('small_plus');
  });

  test('$4M → mid band', () => {
    expect(getMarginBand(4_000_000).id).toBe('mid');
  });

  test('$7M → mid_plus band', () => {
    expect(getMarginBand(7_000_000).id).toBe('mid_plus');
  });

  test('$15M → large band', () => {
    expect(getMarginBand(15_000_000).id).toBe('large');
  });

  test('$50M → enterprise band', () => {
    expect(getMarginBand(50_000_000).id).toBe('enterprise');
  });

  test('$200M → mega band', () => {
    expect(getMarginBand(200_000_000).id).toBe('mega');
  });

  test('$0 → micro band', () => {
    expect(getMarginBand(0).id).toBe('micro');
  });

  test('bands are contiguous (no gaps)', () => {
    for (let i = 0; i < DEFAULT_MARGIN_BANDS.length - 1; i++) {
      expect(DEFAULT_MARGIN_BANDS[i].maxTotal).toBe(DEFAULT_MARGIN_BANDS[i + 1].minTotal);
    }
  });

  test('last band has null maxTotal (unbounded)', () => {
    expect(DEFAULT_MARGIN_BANDS[DEFAULT_MARGIN_BANDS.length - 1].maxTotal).toBeNull();
  });
});

// ============================================================================
// 2. PRODUCT MARGIN MULTIPLIERS
// ============================================================================

describe('Product Margin Multipliers', () => {
  test('BESS is 1.0x (baseline)', () => {
    expect(getProductMarginMultiplier('bess').marginMultiplier).toBe(1.0);
  });

  test('solar is 0.75x (commoditized)', () => {
    expect(getProductMarginMultiplier('solar').marginMultiplier).toBe(0.75);
  });

  test('EV charger is 1.1x (install complexity)', () => {
    expect(getProductMarginMultiplier('ev_charger').marginMultiplier).toBe(1.1);
  });

  test('microgrid controller is 1.2x', () => {
    expect(getProductMarginMultiplier('microgrid_controller').marginMultiplier).toBe(1.2);
  });

  test('construction labor is additive 15%', () => {
    const config = getProductMarginMultiplier('construction_labor');
    expect(config.isAdditive).toBe(true);
    expect(config.fixedAdder).toBe(0.15);
  });

  test('unknown product returns 1.0x default', () => {
    const config = getProductMarginMultiplier('unknown_thing' as ProductClass);
    expect(config.marginMultiplier).toBe(1.0);
  });
});

// ============================================================================
// 3. RISK & SEGMENT ADJUSTERS
// ============================================================================

describe('Risk Adjusters', () => {
  test('standard risk adds 0%', () => {
    expect(getRiskAdjuster('standard').marginAddPercent).toBe(0);
  });

  test('elevated risk adds 2%', () => {
    expect(getRiskAdjuster('elevated').marginAddPercent).toBe(0.02);
  });

  test('high_complexity adds 4%', () => {
    expect(getRiskAdjuster('high_complexity').marginAddPercent).toBe(0.04);
  });
});

describe('Segment Adjusters', () => {
  test('direct customer is 1.0x', () => {
    expect(getSegmentAdjuster('direct').marginMultiplier).toBe(1.0);
  });

  test('EPC partner gets 15% discount', () => {
    expect(getSegmentAdjuster('epc_partner').marginMultiplier).toBe(0.85);
  });

  test('government gets 20% discount', () => {
    expect(getSegmentAdjuster('government').marginMultiplier).toBe(0.80);
  });
});

// ============================================================================
// 4. PRICE GUARDS
// ============================================================================

describe('Price Guards', () => {
  test('BESS has floor of $105/kWh', () => {
    const guard = getPriceGuard('bess');
    expect(guard).toBeDefined();
    expect(guard!.quoteFloorPrice).toBe(105);
  });

  test('BESS ceiling is $250/kWh', () => {
    expect(getPriceGuard('bess')!.ceilingPrice).toBe(250);
  });

  test('solar floor is $0.65/W', () => {
    expect(getPriceGuard('solar')!.quoteFloorPrice).toBe(0.65);
  });

  test('unknown product has no guard', () => {
    expect(getPriceGuard('unknown' as ProductClass)).toBeUndefined();
  });
});

// ============================================================================
// 5. applyMarginPolicy — FULL QUOTE
// ============================================================================

describe('applyMarginPolicy — Full Quote', () => {
  test('returns all three pricing layers', () => {
    const result = applyMarginPolicy(makeInput());
    expect(result.marketCostTotal).toBeGreaterThan(0);
    expect(result.obtainableCostTotal).toBeGreaterThanOrEqual(result.marketCostTotal);
    expect(result.sellPriceTotal).toBeGreaterThan(result.obtainableCostTotal);
  });

  test('sellPriceTotal > baseCostTotal (positive margin)', () => {
    const result = applyMarginPolicy(makeInput());
    expect(result.sellPriceTotal).toBeGreaterThan(result.baseCostTotal);
  });

  test('totalMarginDollars = sellPriceTotal - obtainableCostTotal', () => {
    const result = applyMarginPolicy(makeInput());
    expect(result.totalMarginDollars).toBeCloseTo(
      result.sellPriceTotal - result.obtainableCostTotal, 2
    );
  });

  test('blendedMarginPercent is within reasonable range', () => {
    const result = applyMarginPolicy(makeInput());
    expect(result.blendedMarginPercent).toBeGreaterThanOrEqual(0);
    expect(result.blendedMarginPercent).toBeLessThanOrEqual(0.30);
  });

  test('small deal ($100K) gets higher margin than large deal ($50M)', () => {
    const small = applyMarginPolicy(makeInput({
      totalBaseCost: 100_000,
      lineItems: [makeLineItem({ baseCost: 100_000 })],
    }));
    const large = applyMarginPolicy(makeInput({
      totalBaseCost: 50_000_000,
      lineItems: [makeLineItem({ baseCost: 50_000_000, quantity: 400_000 })],
    }));
    expect(small.blendedMarginPercent).toBeGreaterThan(large.blendedMarginPercent);
  });

  test('audit trail includes version and date', () => {
    const result = applyMarginPolicy(makeInput());
    expect(result.policyVersion).toBe(MARGIN_POLICY_VERSION);
    expect(result.pricingAsOf).toBeTruthy();
  });
});

// ============================================================================
// 6. NEGATIVE MARGIN PROTECTION
// ============================================================================

describe('Negative Margin Protection', () => {
  test('sellPrice never below obtainableCost for any line item', () => {
    const result = applyMarginPolicy(makeInput({
      maxMarginPercent: 0,
    }));
    for (const item of result.lineItems) {
      expect(item.sellPrice).toBeGreaterThanOrEqual(item.obtainableCost);
    }
  });

  test('sellPriceTotal >= obtainableCostTotal at quote level', () => {
    const result = applyMarginPolicy(makeInput({
      maxMarginPercent: 0,
    }));
    expect(result.sellPriceTotal).toBeGreaterThanOrEqual(result.obtainableCostTotal);
  });
});

// ============================================================================
// 7. maxMarginPercent HARD CAP
// ============================================================================

describe('maxMarginPercent Hard Cap', () => {
  test('hard cap overrides band floor', () => {
    const uncapped = applyMarginPolicy(makeInput());
    const capped = applyMarginPolicy(makeInput({ maxMarginPercent: 0.05 }));
    expect(capped.blendedMarginPercent).toBeLessThanOrEqual(0.05 + 0.01); // small tolerance for clamping
  });

  test('hard cap at 0 still results in sellPrice >= obtainableCost', () => {
    const result = applyMarginPolicy(makeInput({ maxMarginPercent: 0 }));
    expect(result.sellPriceTotal).toBeGreaterThanOrEqual(result.obtainableCostTotal);
  });
});

// ============================================================================
// 8. CUSTOMER SEGMENT EFFECTS
// ============================================================================

describe('Customer Segment Effects', () => {
  test('government segment pays less than direct', () => {
    const direct = applyMarginPolicy(makeInput({ customerSegment: 'direct' }));
    const govt = applyMarginPolicy(makeInput({ customerSegment: 'government' }));
    expect(govt.blendedMarginPercent).toBeLessThan(direct.blendedMarginPercent);
  });

  test('EPC partner pays less than direct', () => {
    const direct = applyMarginPolicy(makeInput({ customerSegment: 'direct' }));
    const epc = applyMarginPolicy(makeInput({ customerSegment: 'epc_partner' }));
    expect(epc.blendedMarginPercent).toBeLessThan(direct.blendedMarginPercent);
  });
});

// ============================================================================
// 9. RISK LEVEL EFFECTS
// ============================================================================

describe('Risk Level Effects', () => {
  test('high complexity project has higher margin than standard', () => {
    const std = applyMarginPolicy(makeInput({ riskLevel: 'standard' }));
    const high = applyMarginPolicy(makeInput({ riskLevel: 'high_complexity' }));
    expect(high.blendedMarginPercent).toBeGreaterThanOrEqual(std.blendedMarginPercent);
  });
});

// ============================================================================
// 10. MULTI-PRODUCT QUOTE
// ============================================================================

describe('Multi-Product Quote', () => {
  test('blended margin reflects product mix', () => {
    const result = applyMarginPolicy(makeInput({
      totalBaseCost: 2_000_000,
      lineItems: [
        makeLineItem({ category: 'bess', baseCost: 1_000_000, quantity: 8000, unitCost: 125 }),
        makeLineItem({ sku: 'SOL-001', category: 'solar', baseCost: 500_000, quantity: 500_000, unitCost: 1, unit: 'W', description: 'Solar PV' }),
        makeLineItem({ sku: 'INV-001', category: 'inverter_pcs', baseCost: 200_000, quantity: 2000, unitCost: 100, unit: 'kW', description: 'Inverter/PCS' }),
        makeLineItem({ sku: 'LABOR-001', category: 'construction_labor', baseCost: 300_000, quantity: 1, unitCost: 300_000, unit: 'lot', description: 'Installation' }),
      ],
    }));
    expect(result.lineItems.length).toBe(4);
    expect(result.sellPriceTotal).toBeGreaterThan(result.obtainableCostTotal);
    // Each item should have margin applied
    for (const item of result.lineItems) {
      expect(item.sellPrice).toBeGreaterThanOrEqual(item.obtainableCost);
    }
  });
});

// ============================================================================
// 11. PROCUREMENT BUFFER (LAYER 1)
// ============================================================================

describe('Procurement Buffer (Layer 1)', () => {
  test('low market price triggers procurement buffer for BESS', () => {
    // BESS buffer trigger is $110/kWh. $85/kWh should trigger 15% buffer
    const result = applyMarginPolicy(makeInput({
      lineItems: [makeLineItem({ baseCost: 340_000, quantity: 4000, unitCost: 85 })],
      totalBaseCost: 340_000,
    }));
    const item = result.lineItems[0];
    expect(item.procurementBufferApplied).toBe(true);
    expect(item.obtainableCost).toBeGreaterThan(item.marketCost);
  });

  test('normal market price does NOT trigger buffer', () => {
    // $125/kWh is above trigger ($110)
    const result = applyMarginPolicy(makeInput());
    const item = result.lineItems[0];
    expect(item.procurementBufferApplied).toBe(false);
    expect(item.obtainableCost).toBe(item.marketCost);
  });
});

// ============================================================================
// 12. REVIEW EVENTS
// ============================================================================

describe('Review Events', () => {
  test('very low market price triggers human review alert', () => {
    // BESS reviewBelowPrice is $100/kWh. $80/kWh should trigger review
    const result = applyMarginPolicy(makeInput({
      lineItems: [makeLineItem({ baseCost: 320_000, quantity: 4000, unitCost: 80 })],
      totalBaseCost: 320_000,
    }));
    expect(result.needsHumanReview).toBe(true);
    expect(result.reviewEvents.length).toBeGreaterThan(0);
  });

  test('normal price does NOT trigger review', () => {
    const result = applyMarginPolicy(makeInput());
    expect(result.needsHumanReview).toBe(false);
  });
});

// ============================================================================
// 13. estimateMargin — CONVENIENCE FUNCTION
// ============================================================================

describe('estimateMargin', () => {
  test('returns margin, sell price, and band', () => {
    const est = estimateMargin(1_000_000, 'bess');
    expect(est.marginPercent).toBeGreaterThan(0);
    expect(est.sellPrice).toBeGreaterThan(1_000_000);
    expect(est.marginBand).toBeTruthy();
  });

  test('sell price = baseCost × (1 + margin)', () => {
    const est = estimateMargin(2_000_000, 'bess');
    expect(est.sellPrice).toBeCloseTo(2_000_000 * (1 + est.marginPercent), 0);
  });

  test('solar has lower margin than BESS (0.75x multiplier)', () => {
    const bess = estimateMargin(1_000_000, 'bess');
    const solar = estimateMargin(1_000_000, 'solar');
    expect(solar.marginPercent).toBeLessThan(bess.marginPercent);
  });
});

// ============================================================================
// 14. formatMarginInfo
// ============================================================================

describe('formatMarginInfo', () => {
  test('returns readable string with band and margin %', () => {
    const result = applyMarginPolicy(makeInput());
    const info = formatMarginInfo(result);
    expect(info).toContain('%');
    expect(info).toContain('margin');
  });
});

// ============================================================================
// 15. getPricingConfidence
// ============================================================================

describe('getPricingConfidence', () => {
  test('normal quote returns high confidence', () => {
    const result = applyMarginPolicy(makeInput());
    const conf = getPricingConfidence(result);
    expect(conf.level).toBe('high');
  });

  test('quote needing review returns low confidence', () => {
    const result = applyMarginPolicy(makeInput({
      lineItems: [makeLineItem({ baseCost: 320_000, quantity: 4000, unitCost: 80 })],
      totalBaseCost: 320_000,
    }));
    const conf = getPricingConfidence(result);
    expect(conf.level).toBe('low');
  });
});
