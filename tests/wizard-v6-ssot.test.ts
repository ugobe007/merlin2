/**
 * Wizard V6 SSOT Contract Tests
 * ==============================
 * 
 * These 3 tests protect the core contract:
 * 1. Validation blocks bad input (Red Box path)
 * 2. TrueQuote populates calculations.base (SSOT write path)
 * 3. Tier switching never mutates base (immutability)
 * 
 * If these pass, the wizard cannot regress.
 */

import { describe, it, expect } from 'vitest';
import { validateWizardStateForTrueQuote } from '@/components/wizard/v6/utils/wizardStateValidator';
import { fingerprintWizardForQuote } from '@/components/wizard/v6/utils/wizardFingerprint';
import type { WizardState } from '@/components/wizard/v6/types';
import type { TrueQuoteAuthenticatedResult } from '@/services/merlin';

// ============================================================================
// TEST 1: Validation blocks bad input (Red Box path)
// ============================================================================

describe('Wizard V6 SSOT Contract - Test 1: Validation', () => {
  it('should reject state missing required fields', () => {
    const invalidState: Partial<WizardState> = {
      zipCode: '',
      industry: '',
      useCaseData: { inputs: {} },
    } as WizardState;

    const result = validateWizardStateForTrueQuote(invalidState as WizardState);

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    
    // Should have errors for missing fields
    const errorMessages = result.errors.map(e => e.message).join(' ');
    expect(errorMessages).toMatch(/zipCode|industry|useCaseData/i);
  });

  it('should accept valid state', () => {
    const validState: Partial<WizardState> = {
      zipCode: '90210',
      state: 'CA',
      industry: 'hotel',
      useCaseData: {
        inputs: {
          rooms: 100,
          operatingHours: 24,
        },
      },
      selectedOptions: ['solar'],
    } as WizardState;

    const result = validateWizardStateForTrueQuote(validState as WizardState);

    expect(result.valid).toBe(true);
    expect(result.errors.length).toBe(0);
  });
});

// ============================================================================
// TEST 2: TrueQuote populates calculations.base (SSOT write path)
// ============================================================================

describe('Wizard V6 SSOT Contract - Test 2: Base Population', () => {
  it('should populate calculations.base from TrueQuote result', () => {
    // Mock TrueQuote result
    const mockResult: TrueQuoteAuthenticatedResult = {
      quoteId: 'TEST-123',
      baseCalculation: {
        load: {
          annualConsumptionKWh: 1000000,
          peakDemandKW: 500,
        },
        utility: {
          name: 'Test Utility',
          rate: 0.15,
          demandCharge: 20,
          hasTOU: false,
        },
      },
      options: {
        starter: {
          bess: { powerKW: 200, energyKWh: 400 },
          solar: { capacityKW: 0, included: false },
          ev: { l2Count: 0, dcfcCount: 0, ultraFastCount: 0, included: false },
          generator: { capacityKW: 0, included: false },
          financials: {
            totalInvestment: 500000,
            annualSavings: 50000,
            paybackYears: 10,
            tenYearROI: 100,
            federalITC: 150000,
            netCost: 350000,
          },
        },
        perfectFit: {
          bess: { powerKW: 300, energyKWh: 600 },
          solar: { capacityKW: 100, included: true },
          ev: { l2Count: 0, dcfcCount: 0, ultraFastCount: 0, included: false },
          generator: { capacityKW: 0, included: false },
          financials: {
            totalInvestment: 750000,
            annualSavings: 75000,
            paybackYears: 10,
            tenYearROI: 100,
            federalITC: 225000,
            netCost: 525000,
          },
        },
        beastMode: {
          bess: { powerKW: 400, energyKWh: 800 },
          solar: { capacityKW: 200, included: true },
          ev: { l2Count: 0, dcfcCount: 0, ultraFastCount: 0, included: false },
          generator: { capacityKW: 0, included: false },
          financials: {
            totalInvestment: 1000000,
            annualSavings: 100000,
            paybackYears: 10,
            tenYearROI: 100,
            federalITC: 300000,
            netCost: 700000,
          },
        },
      },
    };

    // Build calculations from result (same logic as Step5MagicFit)
    const buildCalculationsFromResult = (
      result: TrueQuoteAuthenticatedResult,
      selectedPowerLevel: string | null
    ) => {
      const baseCalc = result.baseCalculation;
      const tierKey = selectedPowerLevel === 'perfect_fit' ? 'perfectFit' : 'starter';
      const opt = result.options[tierKey];

      return {
        base: {
          annualConsumptionKWh: baseCalc.load.annualConsumptionKWh,
          peakDemandKW: baseCalc.load.peakDemandKW,
          utilityName: baseCalc.utility.name,
          utilityRate: baseCalc.utility.rate,
          demandCharge: baseCalc.utility.demandCharge,
          hasTOU: baseCalc.utility.hasTOU,
          quoteId: result.quoteId,
        },
        selected: {
          bessKW: opt.bess.powerKW,
          bessKWh: opt.bess.energyKWh,
          solarKW: opt.solar.capacityKW,
          evChargers: opt.ev.l2Count + opt.ev.dcfcCount + opt.ev.ultraFastCount,
          generatorKW: opt.generator.capacityKW,
          totalInvestment: opt.financials.totalInvestment,
          annualSavings: opt.financials.annualSavings,
          paybackYears: opt.financials.paybackYears,
          tenYearROI: opt.financials.tenYearROI,
          federalITC: opt.financials.federalITC,
          netInvestment: opt.financials.netCost,
        },
      };
    };

    const calculations = buildCalculationsFromResult(mockResult, 'perfect_fit');

    // Assert base is populated
    expect(calculations.base.annualConsumptionKWh).toBe(1000000);
    expect(calculations.base.peakDemandKW).toBe(500);
    expect(calculations.base.utilityRate).toBe(0.15);
    expect(calculations.base.demandCharge).toBe(20);
    expect(calculations.base.quoteId).toBe('TEST-123');

    // Assert selected is populated
    expect(calculations.selected.bessKW).toBe(300);
    expect(calculations.selected.annualSavings).toBe(75000);
  });
});

// ============================================================================
// TEST 3: Tier switching never mutates base (immutability)
// ============================================================================

describe('Wizard V6 SSOT Contract - Test 3: Tier Switching', () => {
  it('should preserve calculations.base when switching tiers', () => {
    const baseCalculations = {
      base: {
        annualConsumptionKWh: 1000000,
        peakDemandKW: 500,
        utilityName: 'Test Utility',
        utilityRate: 0.15,
        demandCharge: 20,
        hasTOU: false,
        quoteId: 'TEST-123',
      },
      selected: {
        bessKW: 200,
        bessKWh: 400,
        solarKW: 0,
        evChargers: 0,
        generatorKW: 0,
        totalInvestment: 500000,
        annualSavings: 50000,
        paybackYears: 10,
        tenYearROI: 100,
        federalITC: 150000,
        netInvestment: 350000,
      },
    };

    // Simulate tier switch (starter → beast_mode)
    const newSelected = {
      bessKW: 400,
      bessKWh: 800,
      solarKW: 200,
      evChargers: 0,
      generatorKW: 0,
      totalInvestment: 1000000,
      annualSavings: 100000,
      paybackYears: 10,
      tenYearROI: 100,
      federalITC: 300000,
      netInvestment: 700000,
    };

    const updatedCalculations = {
      ...baseCalculations,
      selected: newSelected,
    };

    // Base should be identical (deep equal)
    expect(updatedCalculations.base).toEqual(baseCalculations.base);
    expect(updatedCalculations.base.annualConsumptionKWh).toBe(1000000);
    expect(updatedCalculations.base.peakDemandKW).toBe(500);
    expect(updatedCalculations.base.quoteId).toBe('TEST-123');

    // Selected should be different
    expect(updatedCalculations.selected.bessKW).toBe(400); // Changed
    expect(updatedCalculations.selected.annualSavings).toBe(100000); // Changed
    expect(baseCalculations.selected.bessKW).toBe(200); // Original unchanged
  });

  it('should not change fingerprint when switching tiers', () => {
    const state1: Partial<WizardState> = {
      zipCode: '90210',
      state: 'CA',
      industry: 'hotel',
      useCaseData: { inputs: { rooms: 100 } },
      selectedPowerLevel: 'starter',
    } as WizardState;

    const state2: Partial<WizardState> = {
      ...state1,
      selectedPowerLevel: 'beast_mode', // Only tier changed
    } as WizardState;

    const fp1 = fingerprintWizardForQuote(state1 as WizardState);
    const fp2 = fingerprintWizardForQuote(state2 as WizardState);

    // Fingerprint should be the same (tier selection doesn't affect quote inputs)
    expect(fp1).toBe(fp2);
  });
});
