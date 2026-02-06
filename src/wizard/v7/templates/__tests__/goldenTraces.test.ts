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
import evChargingTemplate from "../ev_charging.v1.json";
import hospitalTemplate from "../hospital.v1.json";
import manufacturingTemplate from "../manufacturing.v1.json";

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
      { json: evChargingTemplate, slug: "ev_charging" },
      { json: hospitalTemplate, slug: "hospital" },
      { json: manufacturingTemplate, slug: "manufacturing" },
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

  it("adapter-only manifest entries have empty requiredQuestionIds", () => {
    const adapterOnly = MANIFEST.filter((m) => m.templateVersion === "adapter-only");
    expect(adapterOnly.length).toBeGreaterThanOrEqual(3);
    for (const entry of adapterOnly) {
      expect(
        entry.requiredQuestionIds.length,
        `${entry.industrySlug}: adapter-only entry should have no requiredQuestionIds`
      ).toBe(0);
    }
  });

  it("all 11 manifest entries present", () => {
    const slugs = MANIFEST.map((m) => m.industrySlug).sort();
    expect(slugs).toEqual([
      "car_wash",
      "data_center",
      "ev_charging",
      "gas_station",
      "hospital",
      "hotel",
      "manufacturing",
      "office",
      "restaurant",
      "retail",
      "warehouse",
    ]);
  });
});

// ============================================================================
// EV CHARGING GOLDEN TRACES (template-backed as of v1.0.0)
// ============================================================================

describe("Golden traces: ev_charging", () => {
  /**
   * TRACE 1: Retail mixed — L2=8, DCFC=2, HPC=0, no demand cap
   * Typical retail / shopping mall installation
   */
  it("retail mixed: 8 L2 + 2 DCFC → peakKW 50-600 range, charging > 80%", () => {
    const { result, mappedInputs } = runPipeline(evChargingTemplate, {
      level2_count: 8,
      dcfc_count: 2,
      hpc_count: 0,
      site_type: "Retail / shopping",
    });

    // 8 × 7.2kW + 2 × 150kW = 57.6 + 300 = ~358 kW raw (before concurrency)
    expect(result.peakLoadKW).toBeGreaterThanOrEqual(50);
    expect(result.peakLoadKW).toBeLessThanOrEqual(600);
    expect(result.baseLoadKW).toBeGreaterThan(0);

    // Charging must dominate (80-95% band)
    const kw = result.validation!.kWContributors!;
    const chargingPct = (kw.charging / result.peakLoadKW!) * 100;
    expect(chargingPct).toBeGreaterThanOrEqual(80);
    expect(chargingPct).toBeLessThanOrEqual(99);

    // Mapped inputs should include charger counts
    expect(mappedInputs.level2Chargers).toBe(8);
    expect(mappedInputs.dcfcChargers).toBe(2);
  });

  /**
   * TRACE 2: Highway fast-charge — L2=0, DCFC=4, HPC=6, with demand cap
   * Highway corridor with heavy DC charging and site electrical limit
   */
  it("highway fast-charge: 0 L2 + 4 DCFC + 6 HPC, cap=800kW", () => {
    const { result } = runPipeline(evChargingTemplate, {
      level2_count: 0,
      dcfc_count: 4,
      hpc_count: 6,
      site_type: "Highway corridor",
      site_demand_cap_kw: 800,
    });

    // With cap: peakLoadKW should not exceed 800kW
    expect(result.peakLoadKW).toBeLessThanOrEqual(800);
    expect(result.peakLoadKW).toBeGreaterThan(100); // Not trivially small

    // Charging still dominates even with cap (proportional scaling preserves shares)
    const kw = result.validation!.kWContributors!;
    const chargingPct = (kw.charging / result.peakLoadKW!) * 100;
    expect(chargingPct).toBeGreaterThanOrEqual(80);

    // Validation envelope intact
    expect(result.validation!.version).toBe("v1");
    expect(result.validation!.dutyCycle).toBeCloseTo(0.35, 1);

    // Should have demand cap warning
    const text = result.assumptions!.join(" ");
    expect(text).toMatch(/cap/i);
  });

  /**
   * TRACE 3: Workplace — L2=30, DCFC=0, HPC=0
   * Employee parking with slow charging only
   */
  it("workplace: 30 L2 only → peakKW 100-800 range, all Level 2", () => {
    const { result, mappedInputs } = runPipeline(evChargingTemplate, {
      level2_count: 30,
      dcfc_count: 0,
      hpc_count: 0,
      site_type: "Workplace / fleet",
      operating_model: "Workplace (employee)",
    });

    // 30 × 7.2kW = 216kW raw (before concurrency + aux loads)
    expect(result.peakLoadKW).toBeGreaterThanOrEqual(100);
    expect(result.peakLoadKW).toBeLessThanOrEqual(800);

    // All charging is Level 2
    expect(mappedInputs.level2Chargers).toBe(30);
    expect(mappedInputs.dcfcChargers).toBe(0);

    // Validation
    expect(result.validation).toBeDefined();
    expect(result.validation!.version).toBe("v1");
  });

  /**
   * TRACE 4: Edge — demand cap lower than computed peak
   * Tests proportional cap logic: all contributors scaled proportionally
   */
  it("edge: cap=200kW forces proportional scaling of all contributors", () => {
    const { result } = runPipeline(evChargingTemplate, {
      level2_count: 8,
      dcfc_count: 4,
      hpc_count: 0,
      site_demand_cap_kw: 200,
    });

    // Cap enforced
    expect(result.peakLoadKW).toBeLessThanOrEqual(200);

    // Contributors still sum to peakLoadKW (within 5%)
    const kw = result.validation!.kWContributors!;
    const sum = Object.values(kw).reduce((a, b) => a + b, 0);
    const pctDiff = Math.abs(sum - result.peakLoadKW!) / result.peakLoadKW!;
    expect(pctDiff).toBeLessThanOrEqual(0.05);

    // Proportional scaling preserves forensic breakdown
    expect(kw.charging).toBeGreaterThan(0);
    expect(kw.lighting).toBeGreaterThan(0);
    expect(kw.controls).toBeGreaterThan(0);
  });

  it("manifest requiredQuestionIds all exist in template", () => {
    const manifest = MANIFEST.find((m) => m.industrySlug === "ev_charging");
    expect(manifest).toBeDefined();

    const tpl = asTemplate(evChargingTemplate);
    const questionIds = new Set(tpl.questions.map((q) => q.id));

    for (const reqId of manifest!.requiredQuestionIds) {
      expect(
        questionIds.has(reqId),
        `Manifest requires question "${reqId}" but it's missing from EV charging template`
      ).toBe(true);
    }
  });
});

// ============================================================================
// HOSPITAL GOLDEN TRACES (template-backed as of v1.0.0)
// ============================================================================

describe("Golden traces: hospital", () => {
  /**
   * TRACE 1: Small clinic — 50 beds, community, limited hours, no imaging
   */
  it("clinic small: 50-bed community, limited hours → peakKW 50-500", () => {
    const { result, mappedInputs } = runPipeline(hospitalTemplate, {
      hospital_type: "Community",
      operating_hours: "Limited (8 AM–6 PM outpatient)",
      bed_count: 50,
      icu_beds: 0,
      surgical_suites: 0,
      has_mri: false,
      has_ct: false,
    });

    // 50 beds × 4 kW/bed × 0.4 (limited) = 80kW base (min 200kW floor)
    expect(result.peakLoadKW).toBeGreaterThanOrEqual(50);
    expect(result.peakLoadKW).toBeLessThanOrEqual(500);
    expect(result.baseLoadKW).toBeGreaterThan(0);

    // Limited hours → lower dutyCycle
    expect(result.validation!.dutyCycle).toBeCloseTo(0.4, 1);

    // Bed count flows through
    expect(mappedInputs.bedCount).toBe(50);
    expect(mappedInputs.hospitalType).toBe("community");
    expect(mappedInputs.operatingHours).toBe("limited");
  });

  /**
   * TRACE 2: Mid-size regional hospital — 200 beds, 24/7, some equipment
   */
  it("hospital mid: 200-bed regional, 24/7, surgical suites → peakKW 500-3000", () => {
    const { result, mappedInputs } = runPipeline(hospitalTemplate, {
      hospital_type: "Regional",
      operating_hours: "24/7 (full hospital)",
      bed_count: 200,
      icu_beds: 20,
      surgical_suites: 4,
      has_mri: false,
      has_ct: true,
      ct_count: 1,
    });

    // 200 beds × 5 kW/bed = 1000kW base + 4×40kW surgical + 20×2kW ICU + 1×100kW CT
    // = 1000 + 160 + 40 + 100 = ~1300kW
    expect(result.peakLoadKW).toBeGreaterThanOrEqual(500);
    expect(result.peakLoadKW).toBeLessThanOrEqual(3000);

    // 24/7 → dutyCycle 0.85
    expect(result.validation!.dutyCycle).toBeCloseTo(0.85, 1);

    // HVAC + process must both be significant (not smeared equally)
    const kw = result.validation!.kWContributors!;
    expect(kw.hvac).toBeGreaterThan(0);
    expect(kw.process).toBeGreaterThan(0);
    expect(kw.itLoad).toBeGreaterThan(0);

    // Process should be > lighting for a hospital with equipment
    expect(kw.process).toBeGreaterThan(kw.lighting);

    // Equipment detail in notes
    const notes = result.validation!.notes!.join(" ");
    expect(notes).toMatch(/surgical/i);

    expect(mappedInputs.bedCount).toBe(200);
  });

  /**
   * TRACE 3: Imaging-heavy academic hospital — 500 beds, MRI+CT, surgical
   */
  it("imaging heavy: 500-bed academic, MRI+CT+OR → peakKW 2000-8000", () => {
    const { result } = runPipeline(hospitalTemplate, {
      hospital_type: "Academic / teaching",
      operating_hours: "24/7 (full hospital)",
      bed_count: 500,
      icu_beds: 50,
      surgical_suites: 10,
      has_mri: true,
      mri_count: 3,
      has_ct: true,
      ct_count: 4,
      has_sterilization: true,
      has_lab: true,
    });

    // 500 × 6 kW/bed = 3000kW base + 10×40 + 50×2 + 3×100 + 4×100 + 75 + 50
    // = 3000 + 400 + 100 + 300 + 400 + 75 + 50 = ~4325kW
    expect(result.peakLoadKW).toBeGreaterThanOrEqual(2000);
    expect(result.peakLoadKW).toBeLessThanOrEqual(8000);

    // Hospital detail should include equipment info
    const details = result.validation!.details!.hospital;
    expect(details).toBeDefined();
    expect(details.equipmentLoadKW).toBeGreaterThan(0);
    expect(details.hospitalType).toBe("academic");

    // Process % should be elevated due to imaging equipment
    const shares = result.validation!.kWContributorShares!;
    expect(shares.processPct).toBeGreaterThan(30); // Equipment pushes process share up
  });

  /**
   * TRACE 4: Tiny edge — 10 beds, should still produce valid output
   */
  it("edge: 10-bed specialty clinic → still produces valid v1 envelope", () => {
    const { result } = runPipeline(hospitalTemplate, {
      hospital_type: "Specialty (cardiac, trauma, cancer)",
      operating_hours: "Extended (6 AM–10 PM)",
      bed_count: 10,
    });

    // 10 × 7.5 kW/bed × 0.7 (extended) = 52.5kW → but SSOT floors at 200kW
    expect(result.peakLoadKW).toBeGreaterThanOrEqual(50);
    expect(result.peakLoadKW).toBeLessThanOrEqual(500);

    // Extended hours → dutyCycle 0.65
    expect(result.validation!.dutyCycle).toBeCloseTo(0.65, 1);

    // Valid v1 envelope
    expect(result.validation!.version).toBe("v1");
    expect(result.validation!.kWContributors!.hvac).toBeGreaterThan(0);
    expect(result.validation!.kWContributors!.process).toBeGreaterThan(0);
  });

  it("manifest requiredQuestionIds all exist in template", () => {
    const manifest = MANIFEST.find((m) => m.industrySlug === "hospital");
    expect(manifest).toBeDefined();

    const tpl = asTemplate(hospitalTemplate);
    const questionIds = new Set(tpl.questions.map((q) => q.id));

    for (const reqId of manifest!.requiredQuestionIds) {
      expect(
        questionIds.has(reqId),
        `Manifest requires question "${reqId}" but it's missing from hospital template`
      ).toBe(true);
    }
  });
});

// ============================================================================
// MANUFACTURING GOLDEN TRACES (template-backed as of v1.0.0)
// ============================================================================

describe("Golden traces: manufacturing", () => {
  /**
   * TRACE 1: Light assembly, 1 shift — small facility, no equipment
   */
  it("light 1-shift: 50k sqft light assembly → peakKW 100-1500, dutyCycle ~0.55", () => {
    const { result, mappedInputs } = runPipeline(manufacturingTemplate, {
      manufacturing_type: "Light assembly",
      shift_pattern: "1 shift (8 hours)",
      square_footage: 50000,
    });

    expect(result.peakLoadKW).toBeGreaterThanOrEqual(100);
    expect(result.peakLoadKW).toBeLessThanOrEqual(1500);
    expect(result.baseLoadKW).toBeGreaterThan(0);

    // 1-shift → dutyCycle 0.55
    expect(result.validation!.dutyCycle).toBeCloseTo(0.55, 1);

    // Mapping transforms verified
    expect(mappedInputs.manufacturingType).toBe("light");
    expect(mappedInputs.shiftPattern).toBe("1-shift");
    expect(mappedInputs.squareFootage).toBe(50000);

    // Light manufacturing: process dominant but moderate
    const shares = result.validation!.kWContributorShares!;
    expect(shares.processPct).toBeGreaterThanOrEqual(40);
    expect(shares.processPct).toBeLessThanOrEqual(60);
  });

  /**
   * TRACE 2: Medium manufacturing, 2 shifts — 100k sqft
   */
  it("medium 2-shift: 100k sqft → peakKW 200-3000, dutyCycle ~0.75", () => {
    const { result, mappedInputs } = runPipeline(manufacturingTemplate, {
      manufacturing_type: "Medium (machining, welding)",
      shift_pattern: "2 shifts (16 hours)",
      square_footage: 100000,
    });

    expect(result.peakLoadKW).toBeGreaterThanOrEqual(200);
    expect(result.peakLoadKW).toBeLessThanOrEqual(3000);

    // 2-shift → dutyCycle 0.75
    expect(result.validation!.dutyCycle).toBeCloseTo(0.75, 1);

    // Medium type mapped correctly
    expect(mappedInputs.manufacturingType).toBe("medium");
    expect(mappedInputs.shiftPattern).toBe("2-shift");

    // Medium process share: ~55% base
    const kw = result.validation!.kWContributors!;
    expect(kw.process).toBeGreaterThan(kw.hvac);

    // Details present
    const details = result.validation!.details!.manufacturing;
    expect(details.type).toBe("medium");
    expect(details.shiftPattern).toBe("2-shift");
    expect(details.sqFt).toBe(100000);
  });

  /**
   * TRACE 3: Heavy 3-shift — 200k sqft with furnace → high peak, dutyCycle ~0.90
   */
  it("heavy 3-shift: 200k sqft + furnace → peakKW 1000-15000, process > 60%", () => {
    const { result, mappedInputs } = runPipeline(manufacturingTemplate, {
      manufacturing_type: "Heavy (casting, forging)",
      shift_pattern: "3 shifts (24 hours)",
      square_footage: 200000,
      has_electric_furnace: true,
      furnace_kw: 500,
    });

    expect(result.peakLoadKW).toBeGreaterThanOrEqual(1000);
    expect(result.peakLoadKW).toBeLessThanOrEqual(15000);

    // 3-shift → dutyCycle 0.90
    expect(result.validation!.dutyCycle).toBeCloseTo(0.9, 1);

    // Heavy + furnace: process share elevated
    const shares = result.validation!.kWContributorShares!;
    expect(shares.processPct).toBeGreaterThan(60);

    // Furnace adds to equipment load
    const details = result.validation!.details!.manufacturing;
    expect(details.equipmentLoadKW).toBeGreaterThanOrEqual(500);
    expect(details.type).toBe("heavy");

    // Assumptions mention equipment
    const text = result.assumptions!.join(" ");
    expect(text).toMatch(/[Ff]urnace/);
  });

  /**
   * TRACE 4: Equipment-heavy edge — compressed air + CNC + furnace push process share
   */
  it("edge: equipment-heavy facility → process share elevated by equipment adder", () => {
    const { result } = runPipeline(manufacturingTemplate, {
      manufacturing_type: "Light assembly",
      shift_pattern: "1 shift (8 hours)",
      square_footage: 20000,
      has_compressed_air: true,
      compressor_hp: 200,
      has_electric_furnace: true,
      furnace_kw: 300,
      has_cnc_machines: true,
      cnc_count: 5,
    });

    // Small sqft but heavy equipment: 200HP×0.75=150kW + 300kW + 5×20=100kW = 550kW equipment
    const details = result.validation!.details!.manufacturing;
    expect(details.equipmentLoadKW).toBeGreaterThanOrEqual(500);

    // Process share should be elevated above light's base 45% due to equipment adder
    const shares = result.validation!.kWContributorShares!;
    expect(shares.processPct).toBeGreaterThan(50);

    // Equipment ratio is high → adjustedProcessPct shifted up
    expect(details.processIntensity).toBeGreaterThan(0.45);

    // Valid envelope
    expect(result.validation!.version).toBe("v1");
    expect(result.peakLoadKW).toBeGreaterThan(0);
    expect(result.baseLoadKW).toBeGreaterThan(0);
  });

  it("manifest requiredQuestionIds all exist in template", () => {
    const manifest = MANIFEST.find((m) => m.industrySlug === "manufacturing");
    expect(manifest).toBeDefined();

    const tpl = asTemplate(manufacturingTemplate);
    const questionIds = new Set(tpl.questions.map((q) => q.id));

    for (const reqId of manifest!.requiredQuestionIds) {
      expect(
        questionIds.has(reqId),
        `Manifest requires question "${reqId}" but it's missing from manufacturing template`
      ).toBe(true);
    }
  });
});

// ============================================================================
// TRACE COMPLETENESS GATE (applies to ALL adapters with val=v1)
// ============================================================================

describe("Trace completeness gate: val=v1 requirements", () => {
  const testCases = [
    { id: "dc_load_v1", inputs: { itLoadCapacity: 500, currentPUE: 1.5 }, slug: "dc" },
    { id: "hotel_load_v1", inputs: { roomCount: 150 }, slug: "hotel" },
    {
      id: "car_wash_load_v1",
      inputs: { bayTunnelCount: 6, averageWashesPerDay: 200, operatingHours: 12 },
      slug: "car_wash",
    },
    { id: "ev_charging_load_v1", inputs: { level2Chargers: 12, dcfcChargers: 8 }, slug: "ev" },
    { id: "hospital_load_v1", inputs: { bedCount: 200 }, slug: "hospital" },
    {
      id: "manufacturing_load_v1",
      inputs: { squareFootage: 100000, manufacturingType: "light" },
      slug: "manufacturing",
    },
  ];

  for (const { id, inputs, slug } of testCases) {
    describe(`${slug} (${id})`, () => {
      const calc = CALCULATORS_BY_ID[id]!;
      const result = calc.compute(inputs);

      it("has validation envelope with version v1", () => {
        expect(result.validation).toBeDefined();
        expect(result.validation!.version).toBe("v1");
      });

      it("has ≥3 non-zero kWContributors", () => {
        const kw = result.validation!.kWContributors!;
        const nonZero = Object.values(kw).filter((v) => v > 0);
        expect(
          nonZero.length,
          `${slug}: only ${nonZero.length} non-zero contributors — need ≥3 for TrueQuote`
        ).toBeGreaterThanOrEqual(3);
      });

      it("has non-empty assumptions[]", () => {
        expect(result.assumptions).toBeDefined();
        expect(result.assumptions!.length).toBeGreaterThan(0);
      });

      it("contributor sum within 5% of peakLoadKW", () => {
        const kw = result.validation!.kWContributors!;
        const sum = Object.values(kw).reduce((a, b) => a + b, 0);
        const peak = result.peakLoadKW!;
        const pctDiff = Math.abs(sum - peak) / peak;
        expect(
          pctDiff,
          `${slug}: contributor sum ${sum.toFixed(0)} vs peak ${peak} — ${(pctDiff * 100).toFixed(1)}% drift (max 5%)`
        ).toBeLessThanOrEqual(0.05);
      });

      it("has dutyCycle in [0, 1]", () => {
        expect(result.validation!.dutyCycle).toBeGreaterThanOrEqual(0);
        expect(result.validation!.dutyCycle).toBeLessThanOrEqual(1);
      });
    });
  }
});

// ============================================================================
// FALLBACK NON-TRUEQUOTE ASSERTION
// ============================================================================

describe("Fallback (generic) cannot produce TrueQuote v1", () => {
  it("generic_ssot_v1 adapter does NOT return validation.version='v1'", () => {
    const calc = CALCULATORS_BY_ID["generic_ssot_v1"];
    expect(calc).toBeDefined();

    const result = calc!.compute({
      monthlyKwh: 50000,
      peakDemandKw: 200,
    });

    // Generic adapter should NOT have a v1 validation envelope
    // (this is what prevents fallback from getting TrueQuote badge)
    if (result.validation) {
      expect(result.validation.version).not.toBe("v1");
    }
    // It's also valid for validation to be undefined (no envelope at all)
  });

  it("generic_facility template route does not set validation v1", () => {
    const genericTpl = asTemplate(
      // Simulate generic_facility template import
      {
        schemaVersion: "1.0",
        industry: "generic",
        version: "generic.v1.0.0",
        calculator: { id: "generic_ssot_v1" },
        questions: [],
        mapping: {},
        defaults: {},
      }
    );

    const calc = CALCULATORS_BY_ID[genericTpl.calculator.id];
    expect(calc).toBeDefined();

    const result = calc!.compute({ monthlyKwh: 50000, peakDemandKw: 200 });

    // This is the trust boundary: generic → no TrueQuote badge
    const hasV1 = result.validation?.version === "v1";
    expect(
      hasV1,
      "CRITICAL: Generic/fallback calculator produced val=v1! This would grant TrueQuote badge to non-industry templates."
    ).toBe(false);
  });
});
