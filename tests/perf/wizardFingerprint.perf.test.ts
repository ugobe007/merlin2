import { describe, it, expect } from "vitest";
import { initialState, type WizardState } from "@/wizard/v8/wizardState";

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, nestedValue]) => `${JSON.stringify(key)}:${stableStringify(nestedValue)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function fingerprintWizardForQuote(state: WizardState): string {
  return stableStringify({
    location: state.location,
    intel: state.intel,
    industry: state.industry,
    solarPhysicalCapKW: state.solarPhysicalCapKW,
    criticalLoadPct: state.criticalLoadPct,
    baseLoadKW: state.baseLoadKW,
    peakLoadKW: state.peakLoadKW,
    wantsSolar: state.wantsSolar,
    wantsEVCharging: state.wantsEVCharging,
    wantsGenerator: state.wantsGenerator,
    solarKW: state.solarKW,
    generatorKW: state.generatorKW,
    generatorFuelType: state.generatorFuelType,
    level2Chargers: state.level2Chargers,
    dcfcChargers: state.dcfcChargers,
    hpcChargers: state.hpcChargers,
  });
}

function createV8State(overrides: Partial<WizardState> = {}): WizardState {
  return {
    ...initialState(),
    location: {
      zip: "90210",
      city: "Beverly Hills",
      state: "CA",
      formattedAddress: "Beverly Hills, CA 90210",
    },
    intel: {
      utilityRate: 0.22,
      demandCharge: 18,
      utilityProvider: "SCE",
      hasTOU: true,
      solarGrade: "A",
      solarFeasible: true,
      peakSunHours: 5.8,
      weatherRisk: "Low",
      weatherProfile: "Sunny",
      avgTempF: 72,
    },
    industry: "hotel",
    solarPhysicalCapKW: 225,
    criticalLoadPct: 0.55,
    baseLoadKW: 180,
    peakLoadKW: 350,
    wantsSolar: true,
    wantsEVCharging: true,
    level2Chargers: 6,
    dcfcChargers: 2,
    ...overrides,
  };
}

describe("perf: wizardFingerprint", () => {
  it("computes fingerprint fast (<5ms average)", () => {
    const state = createV8State();

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
    const state = createV8State({ industry: "car_wash", peakLoadKW: 250 });

    const fp1 = fingerprintWizardForQuote(state);
    const fp2 = fingerprintWizardForQuote(state);

    expect(fp1).toBe(fp2);
  });

  it("fingerprint changes when inputs change", () => {
    const state1 = createV8State({ peakLoadKW: 350 });
    const state2 = createV8State({ peakLoadKW: 700 });

    const fp1 = fingerprintWizardForQuote(state1);
    const fp2 = fingerprintWizardForQuote(state2);

    expect(fp1).not.toBe(fp2);
  });
});
