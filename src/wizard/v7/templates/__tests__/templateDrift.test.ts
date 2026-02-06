/**
 * TEMPLATE DRIFT DETECTION TESTS
 * ===============================
 *
 * Created: January 26, 2026
 * Purpose: Prevent template/calculator drift with hard failures
 *
 * ENFORCES:
 * - Data center template NEVER ships with 6 questions again
 * - Template calculator.id matches registered contract
 * - All calculator requiredInputs are mapped
 * - All mapping.from references exist in questions
 * - Question count stays within 16-18 range
 *
 * FAILURE MODE:
 * - Test fails LOUDLY at build time
 * - CI/CD blocks deployment if drift detected
 * - Detailed error messages show exactly what broke
 *
 * EXTENSION:
 * - Add one test per industry template
 * - Copy/paste data_center test and adjust for hotel, car_wash, etc.
 */

import { describe, it, expect } from "vitest";
import type { IndustryTemplateV1 } from "../types";
import { validateTemplateAgainstCalculator } from "../validator";
import { CALCULATORS_BY_ID, DC_LOAD_V1_SSOT } from "../../calculators/registry";
import { applyTemplateMapping } from "../applyMapping";

// Import JSON templates (Vite supports JSON import)
import dcTemplate from "../data_center.v1.json";
import hotelTemplate from "../hotel.v1.json";
import carWashTemplate from "../car_wash.v1.json";
import evChargingTemplate from "../ev_charging.v1.json";
import hospitalTemplate from "../hospital.v1.json";
import manufacturingTemplate from "../manufacturing.v1.json";
import officeTemplate from "../office.v1.json";

/**
 * Type-safe JSON import helper
 */
function asTemplate(x: unknown): IndustryTemplateV1 {
  return x as IndustryTemplateV1;
}

describe("Industry templates drift detection", () => {
  /**
   * DATA CENTER TEMPLATE CONTRACT TEST
   *
   * CRITICAL: This test prevents the "6 questions for data centers" regression
   *
   * ENFORCES:
   * - Exactly 18 questions (16-18 range allowed, but DC needs 18)
   * - Calculator ID: dc_load_v1
   * - All 16 required inputs mapped
   * - All mapping refs exist
   * - No duplicate question IDs
   */
  it("data_center template validates against dc_load_v1 contract", () => {
    const tpl = asTemplate(dcTemplate);

    // 1) Calculator must exist in registry
    const calc = CALCULATORS_BY_ID[tpl.calculator.id];
    expect(calc).toBeTruthy();
    expect(calc?.id).toBe(DC_LOAD_V1_SSOT.id);

    // 2) Template must validate against contract
    const res = validateTemplateAgainstCalculator(tpl, calc!, {
      minQuestions: 16,
      maxQuestions: 18,
    });

    // If validation fails, print all issues for debugging
    if (!res.ok) {
      const errorMsg = res.issues
        .filter((i) => i.level === "error")
        .map((i) => `${i.code}: ${i.message}`)
        .join("\n");
      throw new Error(`Template validation failed:\n${errorMsg}`);
    }

    // Log warnings (non-blocking but good to see)
    const warnings = res.issues.filter((i) => i.level === "warn");
    if (warnings.length > 0) {
      console.warn("[drift test] Warnings:", warnings.map((w) => w.message).join(", "));
    }

    // 3) Hard assertion: Data center MUST have exactly 18 questions
    expect(tpl.questions.length).toBe(18);
  });

  /**
   * DATA CENTER TEMPLATE MAPPING TEST
   *
   * ENFORCES:
   * - Sample answers produce non-null outputs
   * - Transforms work correctly (ifDemandChargeElseZero)
   * - Calculator compute() doesn't throw
   */
  it("data_center template mapping produces valid calculator inputs", () => {
    const tpl = asTemplate(dcTemplate);
    const calc = CALCULATORS_BY_ID[tpl.calculator.id];
    expect(calc).toBeTruthy();

    // Sample answers (minimal valid input)
    const answers: Record<string, unknown> = {
      it_load_kw: 500,
      peak_it_load_kw: 650,
      avg_utilization_pct: 75,
      growth_pct_24mo: 15,
      power_capacity_kw: 1000,
      tier: "Tier III",
      redundancy: "N+1",
      required_runtime_min: 30,
      generator_present: true,
      generator_kw: 750,
      ups_present: true,
      ups_runtime_min: 15,
      cooling_type: "CRAH/CRAC",
      pue: 1.5,
      cooling_peak_kw: 200,
      monthly_kwh: 360000,
      demand_charge: false, // Transform test: should force demand_charge_rate → 0
      demand_charge_rate: 25, // Should be ignored because demand_charge = false
    };

    // Apply mapping
    const inputs = applyTemplateMapping(tpl, answers);

    // Verify transform worked
    expect(inputs.demand_charge_rate).toBe(0); // ifDemandChargeElseZero applied

    // CRITICAL: Verify required calculator keys are present in mapped output
    for (const req of calc!.requiredInputs) {
      expect(inputs).toHaveProperty(req);
    }
    expect(inputs.itLoadCapacity).toBe(500);
    expect(inputs.currentPUE).toBe(1.5);
    expect(inputs.itUtilization).toBe(75);
    expect(inputs.dataCenterTier).toBe("Tier III");

    // Run calculator
    const result = calc!.compute(inputs);

    // Verify outputs exist
    expect(result.baseLoadKW).toBeGreaterThan(0);
    expect(result.peakLoadKW).toBeGreaterThan(0);
    expect(result.peakLoadKW).toBeGreaterThanOrEqual(result.baseLoadKW!);

    // Log result for debugging
    console.log("[drift test] DC calc result:", {
      baseLoadKW: result.baseLoadKW,
      peakLoadKW: result.peakLoadKW,
      energyKWhPerDay: result.energyKWhPerDay,
      warnings: result.warnings,
    });
  });

  /**
   * HOTEL TEMPLATE CONTRACT TEST
   *
   * ENFORCES:
   * - 18 questions for hotel (room-based + amenities)
   * - Calculator ID: hotel_load_v1
   * - All required inputs mapped
   * - ifDemandChargeElseZero transform applied
   */
  it("hotel template validates against hotel_load_v1 contract", () => {
    const tpl = asTemplate(hotelTemplate);
    const calc = CALCULATORS_BY_ID[tpl.calculator.id];
    expect(calc).toBeTruthy();

    const res = validateTemplateAgainstCalculator(tpl, calc!, {
      minQuestions: 16,
      maxQuestions: 20,
    });

    if (!res.ok) {
      const errorMsg = res.issues
        .filter((i) => i.level === "error")
        .map((i) => `${i.code}: ${i.message}`)
        .join("\n");
      throw new Error(`Hotel template validation failed:\n${errorMsg}`);
    }

    // Log warnings
    const warnings = res.issues.filter((i) => i.level === "warn");
    if (warnings.length > 0) {
      console.warn("[drift test] Hotel warnings:", warnings.map((w) => w.message).join(", "));
    }

    // Hotel has 18 questions
    expect(tpl.questions.length).toBe(18);
  });

  /**
   * CAR WASH TEMPLATE CONTRACT TEST
   *
   * ENFORCES:
   * - 18 questions for car wash (equipment-based)
   * - Calculator ID: car_wash_load_v1
   * - All required inputs mapped
   * - ifDemandChargeElseZero transform applied
   */
  it("car_wash template validates against car_wash_load_v1 contract", () => {
    const tpl = asTemplate(carWashTemplate);
    const calc = CALCULATORS_BY_ID[tpl.calculator.id];
    expect(calc).toBeTruthy();

    const res = validateTemplateAgainstCalculator(tpl, calc!, {
      minQuestions: 16,
      maxQuestions: 18,
    });

    if (!res.ok) {
      const errorMsg = res.issues
        .filter((i) => i.level === "error")
        .map((i) => `${i.code}: ${i.message}`)
        .join("\n");
      throw new Error(`Car wash template validation failed:\n${errorMsg}`);
    }

    // Log warnings
    const warnings = res.issues.filter((i) => i.level === "warn");
    if (warnings.length > 0) {
      console.warn("[drift test] Car wash warnings:", warnings.map((w) => w.message).join(", "));
    }

    // Car wash should have 18 questions
    expect(tpl.questions.length).toBe(18);
  });

  /**
   * EV CHARGING TEMPLATE CONTRACT TEST
   *
   * ENFORCES:
   * - 16 questions for EV charging (charger mix + site config + billing)
   * - Calculator ID: ev_charging_load_v1
   * - All required inputs mapped
   * - Demand cap + HPC support
   */
  it("ev_charging template validates against ev_charging_load_v1 contract", () => {
    const tpl = asTemplate(evChargingTemplate);
    const calc = CALCULATORS_BY_ID[tpl.calculator.id];
    expect(calc).toBeTruthy();

    const res = validateTemplateAgainstCalculator(tpl, calc!, {
      minQuestions: 16,
      maxQuestions: 18,
    });

    if (!res.ok) {
      const errorMsg = res.issues
        .filter((i) => i.level === "error")
        .map((i) => `${i.code}: ${i.message}`)
        .join("\n");
      throw new Error(`EV charging template validation failed:\n${errorMsg}`);
    }

    const warnings = res.issues.filter((i) => i.level === "warn");
    if (warnings.length > 0) {
      console.warn("[drift test] EV charging warnings:", warnings.map((w) => w.message).join(", "));
    }

    // EV charging has 16 questions
    expect(tpl.questions.length).toBe(16);
  });

  it("hospital template validates against hospital_load_v1 contract", () => {
    const tpl = asTemplate(hospitalTemplate);
    const calc = CALCULATORS_BY_ID[tpl.calculator.id];
    expect(calc).toBeTruthy();

    const res = validateTemplateAgainstCalculator(tpl, calc!, {
      minQuestions: 16,
      maxQuestions: 18,
    });

    if (!res.ok) {
      const errorMsg = res.issues
        .filter((i) => i.level === "error")
        .map((i) => `${i.code}: ${i.message}`)
        .join("\n");
      throw new Error(`Hospital template validation failed:\n${errorMsg}`);
    }

    const warnings = res.issues.filter((i) => i.level === "warn");
    if (warnings.length > 0) {
      console.warn("[drift test] Hospital warnings:", warnings.map((w) => w.message).join(", "));
    }

    // Hospital has 16 questions
    expect(tpl.questions.length).toBe(16);
  });

  it("manufacturing template validates against manufacturing_load_v1 contract", () => {
    const tpl = asTemplate(manufacturingTemplate);
    const calc = CALCULATORS_BY_ID[tpl.calculator.id];
    expect(calc).toBeTruthy();

    const res = validateTemplateAgainstCalculator(tpl, calc!, {
      minQuestions: 16,
      maxQuestions: 18,
    });

    if (!res.ok) {
      const errorMsg = res.issues
        .filter((i) => i.level === "error")
        .map((i) => `${i.code}: ${i.message}`)
        .join("\n");
      throw new Error(`Manufacturing template validation failed:\n${errorMsg}`);
    }

    const warnings = res.issues.filter((i) => i.level === "warn");
    if (warnings.length > 0) {
      console.warn(
        "[drift test] Manufacturing warnings:",
        warnings.map((w) => w.message).join(", ")
      );
    }

    // Manufacturing has 17 questions
    expect(tpl.questions.length).toBe(17);
  });

  /**
   * OFFICE TEMPLATE CONTRACT TEST
   *
   * ENFORCES:
   * - 17 questions for office (facility + systems + additions + billing)
   * - Calculator ID: office_load_v1
   * - All required inputs mapped
   * - mapOfficeType + ifDemandChargeElseZero transforms applied
   */
  it("office template validates against office_load_v1 contract", () => {
    const tpl = asTemplate(officeTemplate);
    const calc = CALCULATORS_BY_ID[tpl.calculator.id];
    expect(calc).toBeTruthy();
    expect(calc?.id).toBe("office_load_v1");

    const res = validateTemplateAgainstCalculator(tpl, calc!, {
      minQuestions: 16,
      maxQuestions: 18,
    });

    if (!res.ok) {
      const errorMsg = res.issues
        .filter((i) => i.level === "error")
        .map((i) => `${i.code}: ${i.message}`)
        .join("\n");
      throw new Error(`Office template validation failed:\n${errorMsg}`);
    }

    const warnings = res.issues.filter((i) => i.level === "warn");
    if (warnings.length > 0) {
      console.warn("[drift test] Office warnings:", warnings.map((w) => w.message).join(", "));
    }

    // Office has 17 questions
    expect(tpl.questions.length).toBe(17);
  });

  it("office template mapping produces valid calculator inputs", () => {
    const tpl = asTemplate(officeTemplate);
    const calc = CALCULATORS_BY_ID[tpl.calculator.id];
    expect(calc).toBeTruthy();

    // Sample answers
    const answers: Record<string, unknown> = {
      office_type: "Corporate / Multi-tenant",
      square_footage: 50000,
      floor_count: 3,
      occupancy_pct: 80,
      hvac_type: "Central rooftop HVAC",
      hvac_age_years: 10,
      lighting_type: "LED",
      has_server_room: "Yes",
      server_room_kw: 20,
      elevator_count: 2,
      ev_chargers_count: 4,
      ev_charger_power_kw: 7.2,
      has_rooftop_solar: "No",
      monthly_kwh: 75000,
      peak_demand_kw: 250,
      demand_charge: true,
      demand_charge_rate: 15,
    };

    const inputs = applyTemplateMapping(tpl, answers);

    // Verify transform: mapOfficeType converts label → slug
    expect(inputs.officeType).toBe("corporate");

    // Verify required calculator key present
    for (const req of calc!.requiredInputs) {
      expect(inputs).toHaveProperty(req);
    }
    expect(inputs.squareFootage).toBe(50000);
    expect(inputs.serverRoomKW).toBe(20);
    expect(inputs.evChargersCount).toBe(4);

    // Verify demand charge transform
    expect(inputs.demand_charge_rate).toBe(15);

    // Run calculator — should not throw
    const result = calc!.compute(inputs);
    expect(result.baseLoadKW).toBeGreaterThan(0);
    expect(result.peakLoadKW).toBeGreaterThan(0);
    expect(result.peakLoadKW).toBeGreaterThanOrEqual(result.baseLoadKW!);
  });

  /**
   * REGISTRY COMPLETENESS TEST
   *
   * ENFORCES:
   * - All templates reference calculators that exist in registry
   * - No orphaned templates
   */
  it("all templates reference registered calculators", () => {
    const templates = [
      dcTemplate,
      hotelTemplate,
      carWashTemplate,
      evChargingTemplate,
      hospitalTemplate,
      manufacturingTemplate,
      officeTemplate,
    ];

    for (const tpl of templates) {
      const template = asTemplate(tpl);
      const calc = CALCULATORS_BY_ID[template.calculator.id];
      expect(calc).toBeTruthy();
      expect(calc?.id).toBe(template.calculator.id);
    }
  });

  /**
   * MAPPING KEY CORRECTNESS TEST (Phase 1 truth pipeline)
   *
   * CRITICAL: Ensures mapping output keys match what calculator adapters ACTUALLY READ
   *
   * This catches the "plausible nonsense" bug where mapping sends bay_count
   * but calculator reads bayTunnelCount — producing silently wrong results
   * based on defaults instead of user answers.
   */
  it("all template mapping output keys include calculator.requiredInputs", () => {
    const templates = [
      { tpl: asTemplate(dcTemplate), name: "data_center" },
      { tpl: asTemplate(hotelTemplate), name: "hotel" },
      { tpl: asTemplate(carWashTemplate), name: "car_wash" },
      { tpl: asTemplate(evChargingTemplate), name: "ev_charging" },
      { tpl: asTemplate(hospitalTemplate), name: "hospital" },
      { tpl: asTemplate(manufacturingTemplate), name: "manufacturing" },
      { tpl: asTemplate(officeTemplate), name: "office" },
    ];

    for (const { tpl, name } of templates) {
      const calc = CALCULATORS_BY_ID[tpl.calculator.id];
      expect(calc).toBeTruthy();

      const mappingOutputKeys = new Set(Object.keys(tpl.mapping));

      for (const req of calc!.requiredInputs) {
        expect(
          mappingOutputKeys.has(req),
          `${name}: mapping must produce key "${req}" (required by calculator ${calc!.id})`
        ).toBe(true);
      }
    }
  });
});

/**
 * EXTENSION TEMPLATE (copy/paste for new industries)
 *
 * import hotelTemplate from "../hotel.v1.json";
 *
 * it("hotel template validates against hotel_load_v1 contract", () => {
 *   const tpl = asTemplate(hotelTemplate);
 *   const calc = CALCULATORS_BY_ID[tpl.calculator.id];
 *   expect(calc).toBeTruthy();
 *
 *   const res = validateTemplateAgainstCalculator(tpl, calc!, {
 *     minQuestions: 16,
 *     maxQuestions: 18,
 *   });
 *
 *   if (!res.ok) {
 *     const errorMsg = res.issues
 *       .filter((i) => i.level === "error")
 *       .map((i) => `${i.code}: ${i.message}`)
 *       .join("\n");
 *     throw new Error(`Template validation failed:\n${errorMsg}`);
 *   }
 *
 *   expect(tpl.questions.length).toBeGreaterThanOrEqual(16);
 *   expect(tpl.questions.length).toBeLessThanOrEqual(18);
 * });
 */
