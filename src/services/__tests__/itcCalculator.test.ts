/**
 * =============================================================================
 * ITC CALCULATOR UNIT TESTS
 * =============================================================================
 *
 * Tests the IRA 2022 Investment Tax Credit calculator.
 * Validates base rates, PWA compliance, bonus adders, phase-out,
 * and energy community ZIP code lookups.
 *
 * Created: Feb 2026 — SSOT Pillar Test Coverage
 */

import { describe, test, expect, it } from 'vitest';
import {
  calculateITC,
  estimateITC,
  isEnergyCommunity,
  getMaxITCRate,
  getITCDocumentation,
  ITC_BASE_RATES,
  ITC_BONUS_ADDERS,
  PWA_REQUIREMENTS,
  type ITCProjectInput,
} from '../itcCalculator';

// ============================================================================
// HELPERS
// ============================================================================

function makeInput(overrides: Partial<ITCProjectInput> = {}): ITCProjectInput {
  return {
    projectType: 'bess',
    capacityMW: 5.0,
    totalCost: 5_000_000,
    inServiceDate: new Date('2025-06-01'),
    state: 'CA',
    prevailingWage: true,
    apprenticeship: true,
    gridConnected: true,
    ...overrides,
  };
}

// ============================================================================
// 1. ITC_BASE_RATES CONSTANTS
// ============================================================================

describe('ITC Base Rate Constants', () => {
  test('all technology types have base, withPWA, and maxWithAdders rates', () => {
    const types = ['solar', 'bess', 'wind', 'geothermal', 'fuel-cell', 'hybrid'] as const;
    for (const t of types) {
      const rates = ITC_BASE_RATES[t];
      expect(rates.base).toBe(0.06);
      expect(rates.withPWA).toBe(0.30);
      expect(rates.maxWithAdders).toBeGreaterThanOrEqual(0.50);
    }
  });

  test('wind has lower maxWithAdders than BESS/solar', () => {
    expect(ITC_BASE_RATES.wind.maxWithAdders).toBe(0.50);
    expect(ITC_BASE_RATES.bess.maxWithAdders).toBe(0.70);
    expect(ITC_BASE_RATES.solar.maxWithAdders).toBe(0.70);
  });
});

// ============================================================================
// 2. calculateITC — BASE RATE LOGIC
// ============================================================================

describe('calculateITC — Base Rate', () => {
  test('project WITH PWA compliance gets 30% base', () => {
    const result = calculateITC(makeInput({ prevailingWage: true, apprenticeship: true }));
    expect(result.baseRate).toBe(0.30);
  });

  test('project WITHOUT PWA compliance gets 6% base (≥1 MW)', () => {
    const result = calculateITC(makeInput({ prevailingWage: false, apprenticeship: false }));
    expect(result.baseRate).toBe(0.06);
  });

  test('project < 1 MW is exempt from PWA — gets 30% regardless', () => {
    const result = calculateITC(makeInput({
      capacityMW: 0.5,
      prevailingWage: false,
      apprenticeship: false,
    }));
    expect(result.baseRate).toBe(0.30);
  });

  test('missing only apprenticeship still loses PWA bonus (≥1 MW)', () => {
    const result = calculateITC(makeInput({ prevailingWage: true, apprenticeship: false }));
    expect(result.baseRate).toBe(0.06);
  });

  test('credit amount = totalRate * totalCost', () => {
    const result = calculateITC(makeInput());
    expect(result.creditAmount).toBeCloseTo(result.totalRate * 5_000_000, 0);
  });
});

// ============================================================================
// 3. calculateITC — BONUS ADDERS
// ============================================================================

describe('calculateITC — Bonus Adders', () => {
  test('energy community bonus adds +10%', () => {
    const base = calculateITC(makeInput({ energyCommunity: false }));
    const bonus = calculateITC(makeInput({ energyCommunity: 'coal-closure' }));
    expect(bonus.totalRate - base.totalRate).toBeCloseTo(0.10, 2);
  });

  test('domestic content bonus adds +10%', () => {
    const base = calculateITC(makeInput({ domesticContent: false }));
    const bonus = calculateITC(makeInput({ domesticContent: true, domesticContentPct: 50 }));
    expect(bonus.totalRate - base.totalRate).toBeCloseTo(0.10, 2);
  });

  test('low-income tier 1 adds +10% for <5 MW', () => {
    const base = calculateITC(makeInput({ capacityMW: 3, lowIncomeProject: false }));
    const bonus = calculateITC(makeInput({ capacityMW: 3, lowIncomeProject: 'located-in' }));
    expect(bonus.totalRate - base.totalRate).toBeCloseTo(0.10, 2);
  });

  test('low-income tier 2 adds +20% for <5 MW', () => {
    const base = calculateITC(makeInput({ capacityMW: 3, lowIncomeProject: false }));
    const bonus = calculateITC(makeInput({ capacityMW: 3, lowIncomeProject: 'serves' }));
    expect(bonus.totalRate - base.totalRate).toBeCloseTo(0.20, 2);
  });

  test('low-income bonus NOT available for ≥5 MW projects', () => {
    const base = calculateITC(makeInput({ capacityMW: 10, lowIncomeProject: false }));
    const attempt = calculateITC(makeInput({ capacityMW: 10, lowIncomeProject: 'serves' }));
    expect(attempt.totalRate).toBe(base.totalRate);
  });

  test('stacking all adders capped at maxWithAdders (70%)', () => {
    const result = calculateITC(makeInput({
      capacityMW: 3,
      energyCommunity: 'coal-closure',
      domesticContent: true,
      domesticContentPct: 60,
      lowIncomeProject: 'serves',
    }));
    // 30% base + 10% EC + 10% DC + 20% LI = 70% → capped at 70%
    expect(result.totalRate).toBeLessThanOrEqual(0.70);
    expect(result.totalRate).toBe(ITC_BASE_RATES.bess.maxWithAdders);
  });
});

// ============================================================================
// 4. calculateITC — QUALIFICATIONS DETAIL
// ============================================================================

describe('calculateITC — Qualifications', () => {
  test('returns qualification status for all categories', () => {
    const result = calculateITC(makeInput());
    expect(result.qualifications).toHaveProperty('prevailingWage');
    expect(result.qualifications).toHaveProperty('energyCommunity');
    expect(result.qualifications).toHaveProperty('domesticContent');
    expect(result.qualifications).toHaveProperty('lowIncome');
  });

  test('audit trail has sources and methodology', () => {
    const result = calculateITC(makeInput());
    expect(result.audit.methodology).toContain('IRA 2022');
    expect(result.audit.sources.length).toBeGreaterThan(0);
    expect(result.audit.calculatedAt).toBeTruthy();
  });
});

// ============================================================================
// 5. estimateITC — SIMPLIFIED FUNCTION
// ============================================================================

describe('estimateITC', () => {
  test('returns 30% base for standard BESS with PWA', () => {
    const result = estimateITC('bess', 5_000_000, 5, true);
    expect(result.baseRate).toBe(0.30);
    expect(result.totalRate).toBe(0.30);
    expect(result.creditAmount).toBe(1_500_000);
  });

  test('returns 6% for large project without PWA', () => {
    const result = estimateITC('bess', 5_000_000, 5, false);
    expect(result.baseRate).toBe(0.06);
    expect(result.creditAmount).toBe(300_000);
  });

  test('sub-1 MW always gets 30% even without PWA flag', () => {
    const result = estimateITC('solar', 500_000, 0.5, false);
    expect(result.baseRate).toBe(0.30);
  });

  test('energy community bonus stacks (+10%)', () => {
    const result = estimateITC('bess', 1_000_000, 2, true, { energyCommunity: true });
    expect(result.totalRate).toBe(0.40);
    expect(result.creditAmount).toBe(400_000);
  });

  test('domestic content bonus stacks (+10%)', () => {
    const result = estimateITC('bess', 1_000_000, 2, true, { domesticContent: true });
    expect(result.totalRate).toBe(0.40);
  });

  test('low-income tier 1 (+10%) for <5 MW', () => {
    const result = estimateITC('bess', 1_000_000, 3, true, { lowIncome: 'located-in' });
    expect(result.totalRate).toBe(0.40);
  });

  test('low-income tier 2 (+20%) for <5 MW', () => {
    const result = estimateITC('bess', 1_000_000, 3, true, { lowIncome: 'serves' });
    expect(result.totalRate).toBe(0.50);
  });

  test('low-income blocked for ≥5 MW', () => {
    const result = estimateITC('bess', 1_000_000, 6, true, { lowIncome: 'serves' });
    expect(result.totalRate).toBe(0.30); // no LI bonus
  });

  test('capped at maxWithAdders', () => {
    const result = estimateITC('bess', 1_000_000, 3, true, {
      energyCommunity: true,
      domesticContent: true,
      lowIncome: 'serves',
    });
    // 30 + 10 + 10 + 20 = 70 → capped at 70%
    expect(result.totalRate).toBe(0.70);
  });

  test('returns meaningful notes array', () => {
    const result = estimateITC('bess', 1_000_000, 5, true);
    expect(result.notes.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// 6. isEnergyCommunity — ZIP CODE LOOKUPS
// ============================================================================

describe('isEnergyCommunity', () => {
  test('West Virginia coal closure ZIPs return true', () => {
    expect(isEnergyCommunity('24701')).toBe(true);
    expect(isEnergyCommunity('25801')).toBe(true);
  });

  test('Kentucky coal closure ZIPs return true', () => {
    expect(isEnergyCommunity('40701')).toBe(true);
  });

  test('Wyoming fossil fuel ZIPs return true', () => {
    expect(isEnergyCommunity('82601')).toBe(true);
  });

  test('Texas Permian Basin ZIPs return true', () => {
    expect(isEnergyCommunity('79701')).toBe(true);
  });

  test('random non-energy-community ZIP returns false', () => {
    expect(isEnergyCommunity('90210')).toBe(false);
    expect(isEnergyCommunity('10001')).toBe(false);
    expect(isEnergyCommunity('00000')).toBe(false);
  });

  test('empty string returns false', () => {
    expect(isEnergyCommunity('')).toBe(false);
  });
});

// ============================================================================
// 7. getMaxITCRate
// ============================================================================

describe('getMaxITCRate', () => {
  test('BESS max is 70%', () => {
    expect(getMaxITCRate('bess')).toBe(0.70);
  });

  test('solar max is 70%', () => {
    expect(getMaxITCRate('solar')).toBe(0.70);
  });

  test('wind max is 50%', () => {
    expect(getMaxITCRate('wind')).toBe(0.50);
  });
});

// ============================================================================
// 8. getITCDocumentation
// ============================================================================

describe('getITCDocumentation', () => {
  test('returns valid documentation object', () => {
    const doc = getITCDocumentation();
    expect(doc.methodology).toContain('Inflation Reduction Act');
    expect(doc.sources.length).toBeGreaterThanOrEqual(3);
    expect(doc.effectiveDate).toBeTruthy();
  });
});

// ============================================================================
// 9. EDGE CASES
// ============================================================================

describe('Edge Cases', () => {
  test('zero cost project returns zero credit', () => {
    const result = calculateITC(makeInput({ totalCost: 0 }));
    expect(result.creditAmount).toBe(0);
    expect(result.totalRate).toBeGreaterThan(0); // rate is still computed
  });

  test('very large project (100 MW) still computes', () => {
    const result = calculateITC(makeInput({ capacityMW: 100, totalCost: 100_000_000 }));
    expect(result.creditAmount).toBeGreaterThan(0);
    expect(result.totalRate).toBeGreaterThanOrEqual(0.06);
  });

  test('all project types produce valid result', () => {
    const types: ITCProjectInput['projectType'][] = ['bess', 'solar', 'wind', 'hybrid', 'geothermal', 'fuel-cell'];
    for (const pt of types) {
      const result = calculateITC(makeInput({ projectType: pt }));
      expect(result.totalRate).toBeGreaterThanOrEqual(0.06);
      expect(result.totalRate).toBeLessThanOrEqual(0.70);
      expect(result.creditAmount).toBeGreaterThanOrEqual(0);
    }
  });
});
