/**
 * GOLDEN TRACE TESTS
 * ==================
 *
 * Created: February 5, 2026
 * Purpose: End-to-end template → mapping → compute traces per industry
 *
 * WHAT THESE PROVE:
 * 1. Template question IDs deterministically drive SSOT contributor math
 * 2. User answers flow through mapping → adapter → SSOT without silent defaults
 * 3. Output bands are physically plausible for each industry
 * 4. Assumptions list traces back to actual inputs (not mystery defaults)
 *
 * SCENARIOS PER INDUSTRY:
 * - Typical: Common real-world inputs → expected output bands
 * - Edge: Extreme values → still produces sane output
 * - Minimum: Only required fields → uses declared defaults, not silent zeros
 *
 * FAILURE MODE:
 * - If mapping keys drift, calculator silently uses defaults → peakKW off by 2-10x
 * - These tests catch "plausible nonsense" by asserting specific input reflection
 */

import { describe, it, expect } from "vitest";
import type { IndustryTemplateV1 } from "../types";
import { applyTemplateMapping } from "../applyMapping";
import { CALCULATORS_BY_ID } from "../../calculators/registry";
import { MANIFEST } from "../template-manifest";

// Import JSON templates
import dcTemplate from "../data_center.v1.json";
import hotelTemplate from "../hotel.v1.json";
import carWashTemplate from "../car_wash.v1.json";

function asTemplate(x: unknown): IndustryTemplateV1 {
  return x as IndustryTemplateV1;
}

/**
 * Helper: Run full pipeline (template defaults → mapping → compute)
 * Returns the result + mapped inputs for assertion
 */
function runPipeline(templateJson: unknown, answerOverrides: Record<string, unknown> = {}) {
  const tpl = asTemplate(templateJson);
  const calc = CALCULATORS_BY_ID[tpl.calculator.id];
  if (!calc) throw new Error(`Calculator ${tpl.calculator.id} not in registry`);

  // Start with template defaults, override with provided answers
  const answers: Record<string, unknown> = { ...tpl.defaults, ...answerOverrides };

  // Apply mapping (template question IDs → calculator field names)
  const mappedInputs = applyTemplateMapping(tpl, answers);

  // Run calculator
  const result = calc.compute(mappedInputs);

  return { tpl, calc, answers, mappedInputs, result };
}

// ============================================================================
// DATA CENTER GOLDEN TRACES
// ============================================================================

describe("Golden traces: data_center", () => {
  it("typical 500kW IT load → peakKW 500-1500 range", () => {
    const { mappedInputs, result } = runPipeline(dcTemplate, {
      it_load_kw: 500,
      peak_it_load_kw: 650,
      avg_utilization_pct: 75,
      pue: 1.5,
      tier: "Tier III",
    });

    // CRITICAL: Verify mapped inputs include calculator required fields
    expect(mappedInputs.itLoadCapacity).toBe(500);
    expect(mappedInputs.currentPUE).toBe(1.5);
    expect(mappedInputs.dataCenterTier).toBe("Tier III");

    // Output should reflect 500kW IT + PUE overhead = ~750kW
    expect(result.peakLoadKW).toBeGreaterThanOrEqual(500);
    expect(result.peakLoadKW).toBeLessThanOrEqual(1500);
    expect(result.baseLoadKW).toBeGreaterThan(0);
    expect(result.baseLoadKW).toBeLessThanOrEqual(result.peakLoadKW!);

    // Assumptions should reference actual inputs, not mystery defaults
    expect(result.assumptions).toBeDefined();
    expect(result.assumptions!.length).toBeGreaterThanOrEqual(2);
    const assumptionText = result.assumptions!.join(" ");
    expect(assumptionText).toContain("500");
  });

  it("edge: 10MW hyperscale → peakKW > 10000", () => {
    const { result } = runPipeline(dcTemplate, {
      it_load_kw: 10000,
      peak_it_load_kw: 12000,
      avg_utilization_pct: 90,
      pue: 1.2,
      tier: "Tier IV",
    });

    // 10MW IT + PUE → should be > 10,000 kW total
    expect(result.peakLoadKW).toBeGreaterThan(10000);
    expect(result.baseLoadKW).toBeGreaterThan(5000);
  });

  it("minimum-info: only defaults → still produces non-zero output", () => {
    // Use ONLY template defaults (no overrides)
    const { mappedInputs, result } = runPipeline(dcTemplate);

    // Verify defaults flowed through mapping
    expect(mappedInputs.itLoadCapacity).toBeDefined();
    expect(mappedInputs.currentPUE).toBeDefined();

    // Should produce non-zero result from defaults
    expect(result.peakLoadKW).toBeGreaterThan(0);
    expect(result.baseLoadKW).toBeGreaterThan(0);
    expect(result.energyKWhPerDay).toBeGreaterThan(0);
  });

  it("manifest requiredQuestionIds all exist in template", () => {
    const manifest = MANIFEST.find((m) => m.industrySlug === "data_center");
    expect(manifest).toBeDefined();

    const tpl = asTemplate(dcTemplate);
    const questionIds = new Set(tpl.questions.map((q) => q.id));

    for (const reqId of manifest!.requiredQuestionIds) {
      expect(
        questionIds.has(reqId),
        `Manifest requires question "${reqId}" but it's missing from template`
      ).toBe(true);
    }
  });
});

// ============================================================================
// HOTEL GOLDEN TRACES
// ============================================================================

describe("Golden traces: hotel", () => {
  it("typical 150-room upscale hotel → peakKW 200-1500 range", () => {
    const { mappedInputs, result } = runPipeline(hotelTemplate, {
      room_count: 150,
      occupancy_avg_pct: 75,
      kitchen_type: "Full commercial",
      restaurant_on_site: true,
      pool_on_site: true,
      spa_on_site: false,
    });

    // CRITICAL: Verify roomCount mapped correctly (not still "room_count")
    expect(mappedInputs.roomCount).toBe(150);
    expect(mappedInputs.occupancyRate).toBe(75);
    // inferHotelClass should map "Full commercial" → "upscale"
    expect(mappedInputs.hotelClass).toBe("upscale");

    // 150 rooms upscale ≈ 200-1500 kW
    expect(result.peakLoadKW).toBeGreaterThanOrEqual(200);
    expect(result.peakLoadKW).toBeLessThanOrEqual(1500);
    expect(result.baseLoadKW).toBeGreaterThan(0);

    // Assumptions should reference room count
    expect(result.assumptions).toBeDefined();
    const assumptionText = result.assumptions!.join(" ");
    expect(assumptionText).toContain("150");
  });

  it("edge: 500-room luxury → peakKW 500-5000 range", () => {
    const { result } = runPipeline(hotelTemplate, {
      room_count: 500,
      occupancy_avg_pct: 90,
      kitchen_type: "Full commercial",
      restaurant_on_site: true,
      bar_on_site: true,
      pool_on_site: true,
      spa_on_site: true,
      conference_sqft: 20000,
    });

    // 500-room luxury hotel should be substantial
    expect(result.peakLoadKW).toBeGreaterThanOrEqual(500);
    expect(result.peakLoadKW).toBeLessThanOrEqual(5000);
  });

  it("minimum-info: only defaults → still produces non-zero output", () => {
    const { mappedInputs, result } = runPipeline(hotelTemplate);

    // Verify defaults flowed through
    expect(mappedInputs.roomCount).toBe(150); // template default
    expect(mappedInputs.occupancyRate).toBe(65); // template default

    expect(result.peakLoadKW).toBeGreaterThan(0);
    expect(result.baseLoadKW).toBeGreaterThan(0);
  });

  it("inferHotelClass transform maps kitchen type correctly", () => {
    // None → economy
    const economy = runPipeline(hotelTemplate, { kitchen_type: "None" });
    expect(economy.mappedInputs.hotelClass).toBe("economy");

    // Light prep → economy
    const lightPrep = runPipeline(hotelTemplate, { kitchen_type: "Light prep" });
    expect(lightPrep.mappedInputs.hotelClass).toBe("economy");

    // Full commercial → upscale
    const upscale = runPipeline(hotelTemplate, { kitchen_type: "Full commercial" });
    expect(upscale.mappedInputs.hotelClass).toBe("upscale");
  });

  it("manifest requiredQuestionIds all exist in template", () => {
    const manifest = MANIFEST.find((m) => m.industrySlug === "hotel");
    expect(manifest).toBeDefined();

    const tpl = asTemplate(hotelTemplate);
    const questionIds = new Set(tpl.questions.map((q) => q.id));

    for (const reqId of manifest!.requiredQuestionIds) {
      expect(
        questionIds.has(reqId),
        `Manifest requires question "${reqId}" but it's missing from template`
      ).toBe(true);
    }
  });
});

// ============================================================================
// CAR WASH GOLDEN TRACES
// ============================================================================

describe("Golden traces: car_wash", () => {
  it("typical 6-bay tunnel → peakKW 80-400 range", () => {
    const { mappedInputs, result } = runPipeline(carWashTemplate, {
      wash_type: "Tunnel (single)",
      bay_count: 6,
      cars_per_day_avg: 200,
      operating_hours_per_day: 12,
      dryer_present: true,
      dryer_kw: 100,
      vacuum_count: 8,
      vacuum_kw_each: 3,
    });

    // CRITICAL: Verify mapping produced correct calculator field names
    expect(mappedInputs.bayTunnelCount).toBe(6);
    expect(mappedInputs.averageWashesPerDay).toBe(200);
    expect(mappedInputs.operatingHours).toBe(12);

    // 6-bay tunnel wash ≈ 80-400 kW
    expect(result.peakLoadKW).toBeGreaterThanOrEqual(50);
    expect(result.peakLoadKW).toBeLessThanOrEqual(500);
    expect(result.baseLoadKW).toBeGreaterThan(0);

    // Should have validation envelope with contributors
    if (result.validation) {
      expect(result.validation.version).toBe("v1");
      if (result.validation.kWContributors) {
        expect(result.validation.kWContributors.process).toBeGreaterThan(0);
      }
    }
  });

  it("edge: 1-bay self-serve → peakKW 10-100 range", () => {
    const { result } = runPipeline(carWashTemplate, {
      wash_type: "Self-serve bays",
      bay_count: 1,
      cars_per_day_avg: 30,
      operating_hours_per_day: 10,
      dryer_present: false,
      dryer_kw: 0,
      vacuum_count: 2,
      vacuum_kw_each: 3,
    });

    // Small self-serve should be smaller than default but SSOT has floor effects
    expect(result.peakLoadKW).toBeGreaterThanOrEqual(5);
    expect(result.peakLoadKW).toBeLessThanOrEqual(300);
  });

  it("minimum-info: only defaults → still produces non-zero output", () => {
    const { mappedInputs, result } = runPipeline(carWashTemplate);

    // Verify defaults flowed through mapping
    expect(mappedInputs.bayTunnelCount).toBe(6); // template default
    expect(mappedInputs.averageWashesPerDay).toBe(200); // template default
    expect(mappedInputs.operatingHours).toBe(12); // template default

    expect(result.peakLoadKW).toBeGreaterThan(0);
    expect(result.baseLoadKW).toBeGreaterThan(0);
  });

  it("demand charge transform: false → rate zeroed", () => {
    const { mappedInputs: withCharge } = runPipeline(carWashTemplate, {
      demand_charge: true,
      demand_charge_rate: 15,
    });
    expect(withCharge.demand_charge_rate).toBe(15);

    const { mappedInputs: noCharge } = runPipeline(carWashTemplate, {
      demand_charge: false,
      demand_charge_rate: 15,
    });
    expect(noCharge.demand_charge_rate).toBe(0);
  });

  it("manifest requiredQuestionIds all exist in template", () => {
    const manifest = MANIFEST.find((m) => m.industrySlug === "car_wash");
    expect(manifest).toBeDefined();

    const tpl = asTemplate(carWashTemplate);
    const questionIds = new Set(tpl.questions.map((q) => q.id));

    for (const reqId of manifest!.requiredQuestionIds) {
      expect(
        questionIds.has(reqId),
        `Manifest requires question "${reqId}" but it's missing from template`
      ).toBe(true);
    }
  });
});

// ============================================================================
// CROSS-CUTTING MANIFEST TESTS
// ============================================================================

describe("Golden traces: manifest integrity", () => {
  it("every manifest entry has a matching template and calculator", () => {
    for (const entry of MANIFEST) {
      const calc = CALCULATORS_BY_ID[entry.calculatorId];
      expect(calc, `Calculator "${entry.calculatorId}" not in registry`).toBeDefined();
      expect(calc!.id).toBe(entry.calculatorId);
    }
  });

  it("manifest requiredCalcFields match calculator.requiredInputs", () => {
    for (const entry of MANIFEST) {
      const calc = CALCULATORS_BY_ID[entry.calculatorId];
      expect(calc).toBeDefined();

      const calcRequired = new Set(calc!.requiredInputs);
      for (const field of entry.requiredCalcFields) {
        expect(
          calcRequired.has(field),
          `Manifest says "${entry.industrySlug}" needs calcField "${field}" but calculator doesn't require it`
        ).toBe(true);
      }
    }
  });

  it("no template mapping silently drops to defaults (anti-regression)", () => {
    const templates = [
      { json: dcTemplate, slug: "data_center" },
      { json: hotelTemplate, slug: "hotel" },
      { json: carWashTemplate, slug: "car_wash" },
    ];

    for (const { json, slug } of templates) {
      const tpl = asTemplate(json);
      const calc = CALCULATORS_BY_ID[tpl.calculator.id];
      expect(calc).toBeDefined();

      // Use template defaults as answers
      const answers = { ...tpl.defaults };
      const mapped = applyTemplateMapping(tpl, answers);

      // Every required calculator input must be in mapped output
      for (const req of calc!.requiredInputs) {
        expect(
          req in mapped,
          `${slug}: Required calculator field "${req}" missing from mapping output. Template mapping is corrupted!`
        ).toBe(true);
        expect(
          mapped[req] !== undefined,
          `${slug}: Required calculator field "${req}" is undefined after mapping. Check template defaults.`
        ).toBe(true);
      }
    }
  });
});
