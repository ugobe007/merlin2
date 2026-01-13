/**
 * Performance Tests: Wizard Fingerprint
 * 
 * Verifies that fingerprint generation is fast enough for production use.
 */

import { describe, it, expect } from "vitest";
import { fingerprintWizardForQuote } from "@/components/wizard/v6/utils/wizardFingerprint";
import { INITIAL_WIZARD_STATE } from "@/components/wizard/v6/types";
import type { WizardState } from "@/components/wizard/v6/types";

describe("perf: wizardFingerprint", () => {
  it("computes fingerprint fast (<5ms average)", () => {
    const state: WizardState = {
      ...INITIAL_WIZARD_STATE,
      zipCode: "94107",
      state: "CA",
      industry: "hotel",
      industryName: "Hotel / Hospitality",
      useCaseData: {
        inputs: {
          squareFootage: 120000,
          operatingHours: 16,
          roomCount: 100,
        },
      },
      selectedOptions: ["solar", "ev"],
    };

    const iterations = 200;
    const t0 = performance.now();
    
    for (let i = 0; i < iterations; i++) {
      fingerprintWizardForQuote(state);
    }
    
    const t1 = performance.now();
    const avg = (t1 - t0) / iterations;

    expect(avg).toBeLessThan(5);
    
    // Log for visibility
    console.log(`[perf] Fingerprint avg: ${avg.toFixed(3)}ms (${iterations} iterations)`);
  });

  it("fingerprint is stable for same inputs", () => {
    const state: WizardState = {
      ...INITIAL_WIZARD_STATE,
      zipCode: "90210",
      state: "CA",
      industry: "car_wash",
      useCaseData: {
        inputs: {
          facilityType: "tunnel_express",
          vehiclesPerDay: 150,
        },
      },
    };

    const fp1 = fingerprintWizardForQuote(state);
    const fp2 = fingerprintWizardForQuote(state);

    expect(fp1).toBe(fp2);
  });

  it("fingerprint changes when inputs change", () => {
    const state1: WizardState = {
      ...INITIAL_WIZARD_STATE,
      zipCode: "90210",
      state: "CA",
      industry: "hotel",
      useCaseData: {
        inputs: { roomCount: 100 },
      },
    };

    const state2: WizardState = {
      ...INITIAL_WIZARD_STATE,
      zipCode: "90210",
      state: "CA",
      industry: "hotel",
      useCaseData: {
        inputs: { roomCount: 200 }, // Different input
      },
    };

    const fp1 = fingerprintWizardForQuote(state1);
    const fp2 = fingerprintWizardForQuote(state2);

    expect(fp1).not.toBe(fp2);
  });
});
