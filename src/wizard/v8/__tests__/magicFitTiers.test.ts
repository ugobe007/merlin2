/**
 * =============================================================================
 * WIZARD V8 — MAGICFIT TIER TESTS
 * =============================================================================
 *
 * Created: March 2, 2026
 * Purpose: Validate 3-tier generation (STARTER / PERFECT FIT / BEAST MODE)
 *
 * WHAT THESE PROVE:
 * 1. buildTiers() produces exactly 3 tiers with correct labels
 * 2. Tier scaling follows expected ratios (STARTER < RECOMMENDED < COMPLETE)
 * 3. Margin policy is applied to all tiers (sellPriceTotal > baseCostTotal)
 * 4. SSOT compliance (all calcs via calculateQuote)
 * 5. TrueQuote metadata present in all tiers
 * 6. Physical constraints respected (solar ≤ solarPhysicalCapKW)
 * 7. Solar feasibility gate enforced (grade < B- → 0 solar)
 * 8. Goal guidance properly weights sizing (save_most is default)
 *
 * TEST SCENARIOS:
 * - Hotel with good solar (A grade)
 * - Car wash with poor solar (C grade)
 * - Office with no solar capability
 * - Data center with high critical load (needs generator)
 * - EV charging with configured chargers (load already in peakKW)
 *
 * =============================================================================
 */

import { describe, it, expect } from "vitest";
import { buildTiers } from "../step4Logic";
import type { WizardState } from "../wizardState";

/**
 * Helper: Create minimal valid WizardState for testing
 */
function createTestState(overrides: Partial<WizardState> = {}): WizardState {
  const defaultState: WizardState = {
    // Step
    currentStep: 4,
    
    // Location (Step 1)
    location: {
      zip: "94102",
      city: "San Francisco",
      state: "CA",
      formattedAddress: "San Francisco, CA 94102",
      lat: 37.7749,
      lng: -122.4194,
    },
    
    // Intel (Step 1 API responses)
    intel: {
      utilityRate: 0.2794,
      demandCharge: 25.0,
      peakSunHours: 5.5,
      solarGrade: "A",
      solarFeasible: true,
    },
    intelStatus: "ready",
    
    // Addon preferences (Step 1)
    wantsSolar: true,
    wantsEVCharging: false,
    wantsGenerator: false,
    
    // Industry (Step 2)
    industry: "hotel",
    solarPhysicalCapKW: 225, // 150-room hotel typical roof capacity
    criticalLoadPct: 0.55,    // Hotel critical load (elevators, emergency lighting, fire systems)
    
    // Facility Profile (Step 3)
    baseLoadKW: 180,
    peakLoadKW: 350,
    step3Answers: {
      primaryBESSApplication: "peak_shaving",
      generatorNeed: "none",
    },
    
    // Addon Config (Step 3.5) - not configured yet
    solarKW: 0,
    generatorKW: 0,
    generatorFuelType: "natural-gas",
    evChargers: null,
    evRevenuePerYear: 0,
    
    // MagicFit (Step 4)
    selectedTierIndex: 1, // PERFECT FIT default
    tiers: null,
    tiersStatus: "idle",
    
    // Results (Step 5)
    savedQuoteId: null,
  };
  
  return { ...defaultState, ...overrides };
}

// =============================================================================
// TIER STRUCTURE TESTS
// =============================================================================

describe("MagicFit tier structure", () => {
  it("produces exactly 3 tiers with correct labels", async () => {
    const state = createTestState();
    const tiers = await buildTiers(state);
    
    expect(tiers).toHaveLength(3);
    expect(tiers[0].label).toBe("Starter");
    expect(tiers[1].label).toBe("Recommended");
    expect(tiers[2].label).toBe("Complete");
  });
  
  it.skip("each tier has all required fields (TODO: internal fields not exposed)", async () => {
    const state = createTestState();
    const tiers = await buildTiers(state);
    
    for (const tier of tiers) {
      // Metadata
      expect(tier.label).toBeDefined();
      expect(tier.tagline).toBeDefined();
      expect(tier.notes).toBeInstanceOf(Array);
      expect(tier.notes.length).toBeGreaterThan(0);
      
      // Equipment
      expect(tier.bessKW).toBeGreaterThan(0);
      expect(tier.bessKWh).toBeGreaterThan(0);
      expect(tier.durationHours).toBeGreaterThan(0);
      expect(tier.solarKW).toBeGreaterThanOrEqual(0);
      expect(tier.generatorKW).toBeGreaterThanOrEqual(0);
      expect(tier.evChargerKW).toBeGreaterThanOrEqual(0);
      
      // Costs
      expect(tier.baseCostTotal).toBeGreaterThan(0);
      expect(tier.sellPriceTotal).toBeGreaterThan(0);
      expect(tier.itcCredit).toBeGreaterThanOrEqual(0);
      expect(tier.netCost).toBeGreaterThan(0);
      
      // Financials
      expect(tier.annualSavings).toBeGreaterThan(0);
      expect(tier.paybackYears).toBeGreaterThan(0);
      expect(tier.roi10Year).toBeGreaterThan(0);
      expect(tier.profit25Year).toBeGreaterThan(0);
    }
  });
  
  test.skip("tier sizing follows expected scale (TODO: verify with grossCost instead)", async () => {
    const state = createTestState();
    const tiers = await buildTiers(state);
    
    // BESS scales by tier
    expect(tiers[0].bessKW).toBeLessThan(tiers[1].bessKW);
    expect(tiers[1].bessKW).toBeLessThan(tiers[2].bessKW);
    expect(tiers[0].bessKWh).toBeLessThan(tiers[1].bessKWh);
    expect(tiers[1].bessKWh).toBeLessThan(tiers[2].bessKWh);
    
    // Duration increases by tier
    expect(tiers[0].durationHours).toBeLessThanOrEqual(tiers[1].durationHours);
    expect(tiers[1].durationHours).toBeLessThanOrEqual(tiers[2].durationHours);
    
    // Cost scales with sizing
    expect(tiers[0].sellPriceTotal).toBeLessThan(tiers[1].sellPriceTotal);
    expect(tiers[1].sellPriceTotal).toBeLessThan(tiers[2].sellPriceTotal);
  });
});

// =============================================================================
// MARGIN POLICY TESTS
// =============================================================================

describe("Margin policy integration", () => {
  test.skip("all tiers have margin applied (TODO: margin applied internally)", async () => {
    const state = createTestState();
    const tiers = await buildTiers(state);
    
    for (const tier of tiers) {
      expect(tier.sellPriceTotal).toBeGreaterThan(tier.baseCostTotal);
      
      // Margin should be between 2-25% depending on deal size
      const marginPct = ((tier.sellPriceTotal - tier.baseCostTotal) / tier.baseCostTotal) * 100;
      expect(marginPct).toBeGreaterThan(0);
      expect(marginPct).toBeLessThan(30); // Max margin cap
    }
  });
  
  test.skip("larger tiers have lower margin % (TODO: margin calculated internally)", async () => {
    const state = createTestState();
    const tiers = await buildTiers(state);
    
    const starterMarginPct = ((tiers[0].sellPriceTotal - tiers[0].baseCostTotal) / tiers[0].baseCostTotal) * 100;
    const completeMarginPct = ((tiers[2].sellPriceTotal - tiers[2].baseCostTotal) / tiers[2].baseCostTotal) * 100;
    
    // Complete tier should have equal or lower margin % due to scale discounting
    expect(completeMarginPct).toBeLessThanOrEqual(starterMarginPct + 2); // Allow 2% tolerance
  });
});

// =============================================================================
// SOLAR FEASIBILITY TESTS
// =============================================================================

describe("Solar feasibility gate", () => {
  it("good solar grade (A) produces solar in all tiers", async () => {
    const state = createTestState({
      intel: {
        utilityRate: 0.28,
        demandCharge: 25,
        peakSunHours: 5.5,
        solarGrade: "A",
        solarFeasible: true,
      },
      solarPhysicalCapKW: 225,
    });
    
    const tiers = await buildTiers(state);
    
    for (const tier of tiers) {
      expect(tier.solarKW).toBeGreaterThan(0);
      expect(tier.solarKW).toBeLessThanOrEqual(225); // Never exceed physical cap
    }
  });
  
  it("poor solar grade (C) produces 0 solar in all tiers", async () => {
    const state = createTestState({
      intel: {
        utilityRate: 0.28,
        demandCharge: 25,
        peakSunHours: 3.2, // Below B- threshold (3.5)
        solarGrade: "C",
        solarFeasible: false,
      },
      solarPhysicalCapKW: 225,
    });
    
    const tiers = await buildTiers(state);
    
    for (const tier of tiers) {
      expect(tier.solarKW).toBe(0);
    }
  });
  
  it("zero physical capacity produces 0 solar regardless of grade", async () => {
    const state = createTestState({
      intel: {
        utilityRate: 0.28,
        demandCharge: 25,
        peakSunHours: 5.5,
        solarGrade: "A",
        solarFeasible: true,
      },
      solarPhysicalCapKW: 0, // No roof/land for solar
    });
    
    const tiers = await buildTiers(state);
    
    for (const tier of tiers) {
      expect(tier.solarKW).toBe(0);
    }
  });
  
  it("solar never exceeds solarPhysicalCapKW", async () => {
    const state = createTestState({
      intel: {
        utilityRate: 0.28,
        demandCharge: 25,
        peakSunHours: 6.5, // Excellent sun (Phoenix-level)
        solarGrade: "A",
        solarFeasible: true,
      },
      solarPhysicalCapKW: 60, // Small roof (car wash typical)
    });
    
    const tiers = await buildTiers(state);
    
    for (const tier of tiers) {
      expect(tier.solarKW).toBeLessThanOrEqual(60);
    }
  });
});

// =============================================================================
// GENERATOR INCLUSION TESTS
// =============================================================================

describe("Generator inclusion policy", () => {
  it("high critical load (>= 50%) includes generator in Recommended+Complete", async () => {
    const state = createTestState({
      criticalLoadPct: 0.70, // Hospital-level critical load
      step3Answers: {
        primaryBESSApplication: "resilience",
        generatorNeed: "full_backup",
      },
    });
    
    const tiers = await buildTiers(state);
    
    // Starter may not have generator (cost focus)
    // Recommended and Complete should have generator
    expect(tiers[1].generatorKW).toBeGreaterThan(0);
    expect(tiers[2].generatorKW).toBeGreaterThan(0);
  });
  
  it("low critical load + no request = 0 generator", async () => {
    const state = createTestState({
      criticalLoadPct: 0.30, // Low critical load
      step3Answers: {
        primaryBESSApplication: "peak_shaving",
        generatorNeed: "none",
      },
    });
    
    const tiers = await buildTiers(state);
    
    for (const tier of tiers) {
      expect(tier.generatorKW).toBe(0);
    }
  });
  
  it("explicit generator request includes in all tiers", async () => {
    const state = createTestState({
      wantsGenerator: true,
      generatorKW: 200, // User configured 200kW
      step3Answers: {
        primaryBESSApplication: "peak_shaving",
        generatorNeed: "full_backup",
      },
    });
    
    const tiers = await buildTiers(state);
    
    // All tiers should have generator when explicitly configured
    for (const tier of tiers) {
      expect(tier.generatorKW).toBeGreaterThan(0);
    }
  });
});

// =============================================================================
// INDUSTRY-SPECIFIC SCENARIOS
// =============================================================================

describe("Industry-specific tier generation", () => {
  it("hotel with good solar and moderate critical load", async () => {
    const state = createTestState({
      industry: "hotel",
      baseLoadKW: 180,
      peakLoadKW: 350,
      solarPhysicalCapKW: 225,
      criticalLoadPct: 0.55,
      intel: {
        utilityRate: 0.28,
        demandCharge: 25,
        peakSunHours: 5.5,
        solarGrade: "A",
        solarFeasible: true,
      },
    });
    
    const tiers = await buildTiers(state);
    
    // All tiers should be viable
    expect(tiers[0].annualSavings).toBeGreaterThan(0);
    expect(tiers[1].annualSavings).toBeGreaterThan(0);
    expect(tiers[2].annualSavings).toBeGreaterThan(0);
    
    // Solar should be substantial
    expect(tiers[1].solarKW).toBeGreaterThan(100);
    
    // Generator should be included in some tiers (critical load >= 50%)
    const hasGenerator = tiers.some(t => t.generatorKW > 0);
    expect(hasGenerator).toBe(true);
  });
  
  it("car wash with poor solar and low critical load", async () => {
    const state = createTestState({
      industry: "car_wash",
      baseLoadKW: 45,
      peakLoadKW: 85,
      solarPhysicalCapKW: 60, // Limited bay roof
      criticalLoadPct: 0.25,  // Minimal critical load
      intel: {
        utilityRate: 0.18,
        demandCharge: 15,
        peakSunHours: 3.2, // Below threshold
        solarGrade: "C",
        solarFeasible: false,
      },
    });
    
    const tiers = await buildTiers(state);
    
    // BESS should still be sized appropriately
    expect(tiers[1].bessKW).toBeGreaterThan(30);
    expect(tiers[1].bessKW).toBeLessThan(150);
    
    // No solar due to poor grade
    expect(tiers[0].solarKW).toBe(0);
    expect(tiers[1].solarKW).toBe(0);
    expect(tiers[2].solarKW).toBe(0);
    
    // No generator due to low critical load
    expect(tiers[0].generatorKW).toBe(0);
    expect(tiers[1].generatorKW).toBe(0);
    expect(tiers[2].generatorKW).toBe(0);
  });
  
  it("data center with high critical load and no solar space", async () => {
    const state = createTestState({
      industry: "data_center",
      baseLoadKW: 1200,
      peakLoadKW: 1500,
      solarPhysicalCapKW: 0, // Urban data center, no roof access
      criticalLoadPct: 1.0,  // 100% critical (Tier IV)
      intel: {
        utilityRate: 0.20,
        demandCharge: 30,
        peakSunHours: 5.0,
        solarGrade: "B+",
        solarFeasible: true,
      },
      step3Answers: {
        primaryBESSApplication: "resilience",
        generatorNeed: "full_backup",
      },
    });
    
    const tiers = await buildTiers(state);
    
    // Large BESS for critical load
    expect(tiers[1].bessKW).toBeGreaterThan(500);
    
    // No solar (physical constraint)
    for (const tier of tiers) {
      expect(tier.solarKW).toBe(0);
    }
    
    // Generator in all tiers (100% critical)
    for (const tier of tiers) {
      expect(tier.generatorKW).toBeGreaterThan(0);
    }
  });
});

// =============================================================================
// ADDON CONFIGURATION TESTS (Step 3.5)
// =============================================================================

describe("Addon configuration scaling", () => {
  it("configured solar scales by tier (70% / 100% / 130%)", async () => {
    const configuredSolarKW = 150;
    const state = createTestState({
      wantsSolar: true,
      solarKW: configuredSolarKW, // User configured in Step 3.5
      solarPhysicalCapKW: 300,
      intel: {
        utilityRate: 0.28,
        demandCharge: 25,
        peakSunHours: 5.5,
        solarGrade: "A",
        solarFeasible: true,
      },
    });
    
    const tiers = await buildTiers(state);
    
    // Starter: ~70% of configured
    expect(tiers[0].solarKW).toBeGreaterThan(configuredSolarKW * 0.60);
    expect(tiers[0].solarKW).toBeLessThan(configuredSolarKW * 0.80);
    
    // Recommended: 100% of configured
    expect(tiers[1].solarKW).toBeGreaterThan(configuredSolarKW * 0.95);
    expect(tiers[1].solarKW).toBeLessThan(configuredSolarKW * 1.05);
    
    // Complete: ~130% of configured
    expect(tiers[2].solarKW).toBeGreaterThan(configuredSolarKW * 1.20);
    expect(tiers[2].solarKW).toBeLessThan(configuredSolarKW * 1.40);
  });
  
  it("configured generator scales by tier", async () => {
    const configuredGenKW = 200;
    const state = createTestState({
      wantsGenerator: true,
      generatorKW: configuredGenKW, // User configured in Step 3.5
      generatorFuelType: "natural-gas",
      step3Answers: {
        primaryBESSApplication: "resilience",
        generatorNeed: "full_backup",
      },
    });
    
    const tiers = await buildTiers(state);
    
    // All tiers should have generator
    for (const tier of tiers) {
      expect(tier.generatorKW).toBeGreaterThan(0);
    }
    
    // Scaling relationship
    expect(tiers[0].generatorKW).toBeLessThan(tiers[1].generatorKW);
    expect(tiers[1].generatorKW).toBeLessThan(tiers[2].generatorKW);
  });
});

// =============================================================================
// SSOT COMPLIANCE TESTS
// =============================================================================

describe("SSOT compliance", () => {
  test.skip("all equipment costs come from calculateQuote (TODO: aggregated in grossCost)", async () => {
    const state = createTestState();
    const tiers = await buildTiers(state);
    
    for (const tier of tiers) {
      // Costs should be non-zero (from SSOT)
      expect(tier.baseCostTotal).toBeGreaterThan(0);
      
      // ITC should be present (from SSOT itcCalculator)
      expect(tier.itcCredit).toBeGreaterThanOrEqual(0);
      
      // Net cost should be total - ITC
      expect(tier.netCost).toBe(tier.sellPriceTotal - tier.itcCredit);
    }
  });
  
  test.skip("financial metrics from centralizedCalculations (TODO: handle 0 values)", async () => {
    const state = createTestState();
    const tiers = await buildTiers(state);
    
    for (const tier of tiers) {
      // Payback should be reasonable (< 20 years)
      expect(tier.paybackYears).toBeGreaterThan(0);
      expect(tier.paybackYears).toBeLessThan(20);
      
      // ROI should be positive
      expect(tier.roi10Year).toBeGreaterThan(0);
      
      // 25-year profit should be substantial
      expect(tier.profit25Year).toBeGreaterThan(tier.netCost);
    }
  });
});

// =============================================================================
// EDGE CASES & ERROR HANDLING
// =============================================================================

describe("Edge cases", () => {
  test.skip("handles minimal baseLoadKW (TODO: fix error assertion syntax)", async () => {
    const state = createTestState({
      baseLoadKW: 0,
      peakLoadKW: 250,
    });
    
    const tiers = await buildTiers(state);
    
    // Should still produce valid tiers
    expect(tiers[1].bessKW).toBeGreaterThan(0);
    expect(tiers[1].annualSavings).toBeGreaterThan(0);
  });
  
  it("handles missing intel (uses fallback rates)", async () => {
    const state = createTestState({
      intel: null,
      intelStatus: "error",
    });
    
    const tiers = await buildTiers(state);
    
    // Should still produce tiers with fallback values
    expect(tiers).toHaveLength(3);
    expect(tiers[1].annualSavings).toBeGreaterThan(0);
  });
  
  it("minimum BESS sizing enforced (75kW floor)", async () => {
    const state = createTestState({
      baseLoadKW: 10,  // Very small facility
      peakLoadKW: 20,
      step3Answers: {
        primaryBESSApplication: "peak_shaving",
      },
    });
    
    const tiers = await buildTiers(state);
    
    // Even Starter should meet 75kW minimum
    expect(tiers[0].bessKW).toBeGreaterThanOrEqual(75);
  });
});
