/**
 * TRUEQUOTE RUNTIME SANITY + MAPPING ALIGNMENT TESTS
 * =====================================================
 *
 * Created: February 6, 2026
 * Purpose: Comprehensive validation of the entire template pipeline
 *
 * THREE AUDIT CLASSES:
 *
 * 1. Runtime Sanity: Every template-backed entry runs with defaults → no throws,
 *    non-zero kW, contributor sum sanity, dutyCycle sane, validation envelope present.
 *
 * 2. Mapping Alignment: No duplicate questionIds, all manifest requiredQuestionIds
 *    exist in template, mapping output keys include all calculator.requiredInputs,
 *    no "orphan" mapping keys that nothing reads.
 *
 * 3. Power Profile Alignment: Key driver inputs actually change output (not silently
 *    defaulted). The "squareFeet entered but pipeline uses squareFootage default" bug class.
 *
 * FAILURE MODE:
 * - Silent defaults: User enters data, mapping drops it, calculator uses default → wrong kW
 * - Snake/camel drift: Template maps to snake_case but calculator reads camelCase
 * - Orphan questions: Template asks question but mapping never references it
 * - Contributor sum: Contributors don't sum to peakLoadKW (rounding OK, >20% drift NOT OK)
 */

import { describe, it, expect } from "vitest";
import type { IndustryTemplateV1 } from "../types";
import { applyTemplateMapping } from "../applyMapping";
import { CALCULATORS_BY_ID } from "../../calculators/registry";
import { MANIFEST, type ManifestEntry } from "../template-manifest";
import { canonicalizeSlug, getIndustryMeta } from "../../industryMeta";
import { getTemplate, hasTemplate } from "../templateIndex";

// Import ALL template-backed JSON files
import dcTemplate from "../data_center.v1.json";
import hotelTemplate from "../hotel.v1.json";
import carWashTemplate from "../car_wash.v1.json";
import evChargingTemplate from "../ev_charging.v1.json";
import hospitalTemplate from "../hospital.v1.json";
import manufacturingTemplate from "../manufacturing.v1.json";
import officeTemplate from "../office.v1.json";

function asTemplate(x: unknown): IndustryTemplateV1 {
  return x as IndustryTemplateV1;
}

/** Map of industry slug → template JSON (only template-backed entries) */
const TEMPLATE_MAP: Record<string, unknown> = {
  data_center: dcTemplate,
  hotel: hotelTemplate,
  car_wash: carWashTemplate,
  ev_charging: evChargingTemplate,
  hospital: hospitalTemplate,
  manufacturing: manufacturingTemplate,
  office: officeTemplate,
};

/** Template-backed manifest entries (exclude adapter-only) */
const TEMPLATE_BACKED = MANIFEST.filter(
  (m) => m.templateVersion !== "adapter-only" && TEMPLATE_MAP[m.industrySlug]
);

/** Helper: run full pipeline with template defaults */
function runWithDefaults(templateJson: unknown) {
  const tpl = asTemplate(templateJson);
  const calc = CALCULATORS_BY_ID[tpl.calculator.id];
  if (!calc) throw new Error(`Calculator ${tpl.calculator.id} not in registry`);

  const answers: Record<string, unknown> = { ...tpl.defaults };
  const mappedInputs = applyTemplateMapping(tpl, answers);
  const result = calc.compute(mappedInputs);
  return { tpl, calc, answers, mappedInputs, result };
}

// ============================================================================
// 1. RUNTIME SANITY: Every template runs with defaults
// ============================================================================

describe("TrueQuote runtime sanity: all templates with defaults", () => {
  it.each(TEMPLATE_BACKED.map((m) => [m.industrySlug, m]))(
    "%s: defaults produce non-zero kW + valid envelope",
    (_slug, manifest: ManifestEntry) => {
      const templateJson = TEMPLATE_MAP[manifest.industrySlug];
      expect(templateJson).toBeDefined();

      // MUST NOT THROW
      const { result } = runWithDefaults(templateJson);

      // Non-zero kW
      expect(result.peakLoadKW).toBeGreaterThan(0);
      expect(result.baseLoadKW).toBeGreaterThan(0);
      expect(result.energyKWhPerDay).toBeGreaterThan(0);

      // peak >= base (physics)
      expect(result.peakLoadKW).toBeGreaterThanOrEqual(result.baseLoadKW!);

      // Validation envelope present (TrueQuote badge gate)
      expect(result.validation).toBeDefined();
      expect(result.validation!.version).toBe("v1");

      // Duty cycle sane: 0 < dutyCycle <= 1.25
      const dc = result.validation!.dutyCycle;
      expect(dc).toBeDefined();
      expect(dc).toBeGreaterThan(0);
      expect(dc).toBeLessThanOrEqual(1.25);

      // peakKW within manifest's expected range
      expect(result.peakLoadKW).toBeGreaterThanOrEqual(manifest.typicalPeakKWRange[0]);
      expect(result.peakLoadKW).toBeLessThanOrEqual(manifest.typicalPeakKWRange[1]);

      // Assumptions trace (audit trail)
      expect(result.assumptions).toBeDefined();
      expect(result.assumptions!.length).toBeGreaterThan(0);

      // No warnings when using defaults (clean input)
      // Some templates may have warnings for unusual defaults, but should be < 3
      expect(result.warnings!.length).toBeLessThan(3);
    }
  );

  it.each(TEMPLATE_BACKED.map((m) => [m.industrySlug, m]))(
    "%s: contributor sum within 20%% of peakLoadKW",
    (_slug, manifest: ManifestEntry) => {
      const templateJson = TEMPLATE_MAP[manifest.industrySlug];
      const { result } = runWithDefaults(templateJson!);

      const v = result.validation!;
      expect(v.kWContributors).toBeDefined();
      expect(v.kWContributorsTotalKW).toBeDefined();

      const peakKW = result.peakLoadKW!;
      const contribSum = v.kWContributorsTotalKW!;

      // Allow 20% tolerance (rounding, additive loads distributed differently)
      const ratio = contribSum / peakKW;
      expect(
        ratio,
        `${manifest.industrySlug}: contributor sum ${contribSum.toFixed(0)}kW vs peakLoadKW ${peakKW}kW (ratio=${ratio.toFixed(3)})`
      ).toBeGreaterThan(0.8);
      expect(
        ratio,
        `${manifest.industrySlug}: contributor sum ${contribSum.toFixed(0)}kW vs peakLoadKW ${peakKW}kW (ratio=${ratio.toFixed(3)})`
      ).toBeLessThan(1.2);
    }
  );

  it.each(TEMPLATE_BACKED.map((m) => [m.industrySlug, m]))(
    "%s: expected contributor keys present in envelope",
    (_slug, manifest: ManifestEntry) => {
      const templateJson = TEMPLATE_MAP[manifest.industrySlug];
      const { result } = runWithDefaults(templateJson!);

      const contribs = result.validation!.kWContributors!;
      for (const key of manifest.contributorKeysExpected) {
        expect(
          key in contribs,
          `${manifest.industrySlug}: expected contributor key "${key}" missing from envelope`
        ).toBe(true);
      }
    }
  );
});

// ============================================================================
// 2. MAPPING ALIGNMENT: questions ↔ templates ↔ calculators
// ============================================================================

describe("Mapping alignment: template question/mapping/calculator contracts", () => {
  it.each(TEMPLATE_BACKED.map((m) => [m.industrySlug, m]))(
    "%s: no duplicate question IDs in template",
    (_slug, manifest: ManifestEntry) => {
      const tpl = asTemplate(TEMPLATE_MAP[manifest.industrySlug]);
      const ids = tpl.questions.map((q) => q.id);
      const uniqueIds = new Set(ids);
      expect(
        ids.length,
        `${manifest.industrySlug}: duplicate question IDs found: ${ids.filter((id, i) => ids.indexOf(id) !== i).join(", ")}`
      ).toBe(uniqueIds.size);
    }
  );

  it.each(TEMPLATE_BACKED.map((m) => [m.industrySlug, m]))(
    "%s: all manifest requiredQuestionIds exist in template",
    (_slug, manifest: ManifestEntry) => {
      const tpl = asTemplate(TEMPLATE_MAP[manifest.industrySlug]);
      const questionIds = new Set(tpl.questions.map((q) => q.id));

      for (const reqId of manifest.requiredQuestionIds) {
        expect(
          questionIds.has(reqId),
          `${manifest.industrySlug}: manifest requires "${reqId}" but not in template questions`
        ).toBe(true);
      }
    }
  );

  it.each(TEMPLATE_BACKED.map((m) => [m.industrySlug, m]))(
    "%s: mapping output keys include all calculator.requiredInputs",
    (_slug, manifest: ManifestEntry) => {
      const tpl = asTemplate(TEMPLATE_MAP[manifest.industrySlug]);
      const calc = CALCULATORS_BY_ID[tpl.calculator.id];
      expect(calc).toBeDefined();

      const mappingOutputKeys = new Set(Object.keys(tpl.mapping));

      for (const req of calc!.requiredInputs) {
        expect(
          mappingOutputKeys.has(req),
          `${manifest.industrySlug}: mapping must produce "${req}" (required by ${calc!.id})`
        ).toBe(true);
      }
    }
  );

  it.each(TEMPLATE_BACKED.map((m) => [m.industrySlug, m]))(
    "%s: all mapping 'from' refs exist as question IDs",
    (_slug, manifest: ManifestEntry) => {
      const tpl = asTemplate(TEMPLATE_MAP[manifest.industrySlug]);
      const questionIds = new Set(tpl.questions.map((q) => q.id));
      const mappingRules = tpl.mapping as Record<string, { from: string }>;

      for (const [outputKey, rule] of Object.entries(mappingRules)) {
        if (!rule.from) continue; // passthrough
        expect(
          questionIds.has(rule.from),
          `${manifest.industrySlug}: mapping "${outputKey}" references question "${rule.from}" which doesn't exist`
        ).toBe(true);
      }
    }
  );

  it.each(TEMPLATE_BACKED.map((m) => [m.industrySlug, m]))(
    "%s: no orphan questions (every question is referenced by mapping)",
    (_slug, manifest: ManifestEntry) => {
      const tpl = asTemplate(TEMPLATE_MAP[manifest.industrySlug]);
      const mappingRules = tpl.mapping as Record<string, { from: string }>;
      const mappedFromIds = new Set(Object.values(mappingRules).map((r) => r.from));

      const orphans = tpl.questions
        .map((q) => q.id)
        .filter((id) => !mappedFromIds.has(id));

      expect(
        orphans,
        `${manifest.industrySlug}: orphan questions (not referenced by mapping): ${orphans.join(", ")}`
      ).toEqual([]);
    }
  );

  it.each(TEMPLATE_BACKED.map((m) => [m.industrySlug, m]))(
    "%s: select/multiselect questions have options defined",
    (_slug, manifest: ManifestEntry) => {
      const tpl = asTemplate(TEMPLATE_MAP[manifest.industrySlug]);
      for (const q of tpl.questions) {
        if (q.type === "select" || q.type === "multiselect") {
          expect(
            q.options && q.options.length > 0,
            `${manifest.industrySlug}: question "${q.id}" is ${q.type} but has no options`
          ).toBe(true);
        }
      }
    }
  );

  it.each(TEMPLATE_BACKED.map((m) => [m.industrySlug, m]))(
    "%s: all defaults have matching question IDs",
    (_slug, manifest: ManifestEntry) => {
      const tpl = asTemplate(TEMPLATE_MAP[manifest.industrySlug]);
      const questionIds = new Set(tpl.questions.map((q) => q.id));

      for (const defaultKey of Object.keys(tpl.defaults || {})) {
        expect(
          questionIds.has(defaultKey),
          `${manifest.industrySlug}: default "${defaultKey}" has no matching question`
        ).toBe(true);
      }
    }
  );
});

// ============================================================================
// 3. POWER PROFILE ALIGNMENT: key drivers actually change output
// ============================================================================

describe("Power profile alignment: key drivers change output (not silently defaulted)", () => {
  /**
   * For each industry, we identify the PRIMARY driver input(s) and verify:
   * - Changing the driver DOES change peakLoadKW
   * - The mapped input name matches what the calculator reads
   * - The output is not the same as defaults (proving the input flowed through)
   */

  it("office: squareFootage drives peakKW (not silently defaulted to 50k)", () => {
    const tpl = asTemplate(officeTemplate);
    const calc = CALCULATORS_BY_ID[tpl.calculator.id]!;

    // Run with 10k sqft
    const small = applyTemplateMapping(tpl, { ...tpl.defaults, square_footage: 10000 });
    const smallResult = calc.compute(small);

    // Run with 100k sqft
    const large = applyTemplateMapping(tpl, { ...tpl.defaults, square_footage: 100000 });
    const largeResult = calc.compute(large);

    // CRITICAL: larger building = higher kW
    expect(largeResult.peakLoadKW).toBeGreaterThan(smallResult.peakLoadKW!);

    // Verify the mapping actually produced different squareFootage values
    expect(small.squareFootage).toBe(10000);
    expect(large.squareFootage).toBe(100000);
  });

  it("office: serverRoomKW drives itLoad contributor", () => {
    const tpl = asTemplate(officeTemplate);
    const calc = CALCULATORS_BY_ID[tpl.calculator.id]!;

    // No server room
    const noServer = applyTemplateMapping(tpl, {
      ...tpl.defaults,
      has_server_room: "No",
      server_room_kw: 0,
    });
    const noServerResult = calc.compute(noServer);

    // 100kW server room
    const bigServer = applyTemplateMapping(tpl, {
      ...tpl.defaults,
      has_server_room: "Yes",
      server_room_kw: 100,
    });
    const bigServerResult = calc.compute(bigServer);

    // Server room adds to peak
    expect(bigServerResult.peakLoadKW).toBeGreaterThan(noServerResult.peakLoadKW!);
    // itLoad contributor non-zero when server present
    expect(bigServerResult.validation!.kWContributors!.itLoad).toBeGreaterThan(0);
    expect(noServerResult.validation!.kWContributors!.itLoad).toBe(0);
  });

  it("hotel: roomCount drives peakKW (not silently defaulted to 150)", () => {
    const tpl = asTemplate(hotelTemplate);
    const calc = CALCULATORS_BY_ID[tpl.calculator.id]!;

    const small = applyTemplateMapping(tpl, { ...tpl.defaults, room_count: 50 });
    const large = applyTemplateMapping(tpl, { ...tpl.defaults, room_count: 500 });

    const smallResult = calc.compute(small);
    const largeResult = calc.compute(large);

    expect(largeResult.peakLoadKW).toBeGreaterThan(smallResult.peakLoadKW!);
    expect(small.roomCount).toBe(50);
    expect(large.roomCount).toBe(500);
  });

  it("data_center: itLoadCapacity drives peakKW", () => {
    const tpl = asTemplate(dcTemplate);
    const calc = CALCULATORS_BY_ID[tpl.calculator.id]!;

    const small = applyTemplateMapping(tpl, { ...tpl.defaults, it_load_kw: 100 });
    const large = applyTemplateMapping(tpl, { ...tpl.defaults, it_load_kw: 2000 });

    const smallResult = calc.compute(small);
    const largeResult = calc.compute(large);

    expect(largeResult.peakLoadKW).toBeGreaterThan(smallResult.peakLoadKW!);
    expect(small.itLoadCapacity).toBe(100);
    expect(large.itLoadCapacity).toBe(2000);
  });

  it("manufacturing: squareFootage drives peakKW", () => {
    const tpl = asTemplate(manufacturingTemplate);
    const calc = CALCULATORS_BY_ID[tpl.calculator.id]!;

    const small = applyTemplateMapping(tpl, { ...tpl.defaults, square_footage: 20000 });
    const large = applyTemplateMapping(tpl, { ...tpl.defaults, square_footage: 200000 });

    const smallResult = calc.compute(small);
    const largeResult = calc.compute(large);

    expect(largeResult.peakLoadKW).toBeGreaterThan(smallResult.peakLoadKW!);
  });

  it("hospital: bedCount drives peakKW", () => {
    const tpl = asTemplate(hospitalTemplate);
    const calc = CALCULATORS_BY_ID[tpl.calculator.id]!;

    const small = applyTemplateMapping(tpl, { ...tpl.defaults, bed_count: 50 });
    const large = applyTemplateMapping(tpl, { ...tpl.defaults, bed_count: 500 });

    const smallResult = calc.compute(small);
    const largeResult = calc.compute(large);

    expect(largeResult.peakLoadKW).toBeGreaterThan(smallResult.peakLoadKW!);
  });

  it("car_wash: bayCount drives peakKW", () => {
    const tpl = asTemplate(carWashTemplate);
    const calc = CALCULATORS_BY_ID[tpl.calculator.id]!;

    const small = applyTemplateMapping(tpl, { ...tpl.defaults, bay_count: 2 });
    const large = applyTemplateMapping(tpl, { ...tpl.defaults, bay_count: 10 });

    const smallResult = calc.compute(small);
    const largeResult = calc.compute(large);

    expect(largeResult.peakLoadKW).toBeGreaterThan(smallResult.peakLoadKW!);
  });

  it("ev_charging: dcfc count drives peakKW", () => {
    const tpl = asTemplate(evChargingTemplate);
    const calc = CALCULATORS_BY_ID[tpl.calculator.id]!;

    const small = applyTemplateMapping(tpl, { ...tpl.defaults, dcfc_count: 1 });
    const large = applyTemplateMapping(tpl, { ...tpl.defaults, dcfc_count: 10 });

    const smallResult = calc.compute(small);
    const largeResult = calc.compute(large);

    expect(largeResult.peakLoadKW).toBeGreaterThan(smallResult.peakLoadKW!);
  });

  it("ev_charging: setting all chargers to 0 produces 0 charging kW (no silent default to 8)", () => {
    const tpl = asTemplate(evChargingTemplate);
    const calc = CALCULATORS_BY_ID[tpl.calculator.id]!;

    const zero = applyTemplateMapping(tpl, {
      ...tpl.defaults,
      level2_count: 0,
      dcfc_count: 0,
    });
    const result = calc.compute(zero);

    // GUARD 1 — No silent defaults: charging contribution must be exactly 0
    const chargingKW = result.validation?.kWContributors?.charging ?? 0;
    expect(chargingKW).toBe(0);

    // GUARD 2 — Physical/site minimum floor is preserved:
    // SSOT enforces Math.max(0.05 MW, computed) = 50 kW minimum for any EV site
    // (panel, lighting, controls). If someone "fixes" this floor away,
    // we'd under-size the service entrance.
    expect(result.peakLoadKW).toBeGreaterThanOrEqual(50); // site minimum floor
    expect(result.peakLoadKW).toBeLessThanOrEqual(55);    // but not secretly defaulting chargers

    // GUARD 3 — Massive gap from defaults proves no silent default to 8 DCFC
    const defaultResult = runWithDefaults(evChargingTemplate).result;
    expect(result.peakLoadKW).toBeLessThan(defaultResult.peakLoadKW! * 0.15); // 85%+ reduction
  });
});

// ============================================================================
// 4. SLUG CANONICALIZATION: healthcare ↔ hospital deterministic resolution
// ============================================================================

describe("Slug canonicalization: healthcare ↔ hospital + edge cases", () => {
  it("healthcare canonicalizes to hospital (config key)", () => {
    expect(canonicalizeSlug("healthcare")).toBe("hospital");
  });

  it("hospital resolves in industryMeta", () => {
    const meta = getIndustryMeta("hospital");
    expect(meta.slug).toBe("hospital");
    expect(meta.hasTemplate).toBe(true);
  });

  it("healthcare resolves in industryMeta (via alias)", () => {
    const meta = getIndustryMeta("healthcare");
    // canonicalizeSlug("healthcare") → "hospital" → INDUSTRY_META["hospital"]
    expect(meta.hasTemplate).toBe(true);
    expect(meta.icon).toBe("🏥");
  });

  it("hospital template is loadable from templateIndex", () => {
    expect(hasTemplate("hospital")).toBe(true);
    const tpl = getTemplate("hospital");
    expect(tpl).not.toBeNull();
    expect(tpl!.industry).toBe("hospital");
    expect(tpl!.calculator.id).toBe("hospital_load_v1");
  });

  it("hospital template runs and produces valid kW (healthcare user path)", () => {
    // Simulates: user selects "healthcare" → templateMapping resolves to "hospital" → getTemplate("hospital")
    const tpl = getTemplate("hospital")!;
    const calc = CALCULATORS_BY_ID[tpl.calculator.id]!;
    const answers = { ...tpl.defaults };
    const mapped = applyTemplateMapping(tpl, answers);
    const result = calc.compute(mapped);

    expect(result.peakLoadKW).toBeGreaterThan(0);
    expect(result.validation?.version).toBe("v1");
  });

  it("unknown slugs canonicalize to 'other' (not crash)", () => {
    expect(canonicalizeSlug("martian_base")).toBe("other");
    expect(canonicalizeSlug("")).toBe("other");
    expect(canonicalizeSlug("UNKNOWN")).toBe("other");
  });

  it("hyphenated slugs resolve correctly", () => {
    expect(canonicalizeSlug("data-center")).toBe("data_center");
    expect(canonicalizeSlug("car-wash")).toBe("car_wash");
    expect(canonicalizeSlug("ev-charging")).toBe("ev_charging");
  });

  it("case-insensitive slug resolution", () => {
    expect(canonicalizeSlug("Data_Center")).toBe("data_center");
    expect(canonicalizeSlug("EV_Charging")).toBe("ev_charging");
    expect(canonicalizeSlug("HOTEL")).toBe("hotel");
  });

  it("all template-backed industries are loadable from templateIndex", () => {
    const templateIndustries = ["data_center", "hotel", "car_wash", "hospital", "ev_charging", "manufacturing", "office"];
    for (const ind of templateIndustries) {
      expect(hasTemplate(ind), `templateIndex missing: ${ind}`).toBe(true);
      const tpl = getTemplate(ind);
      expect(tpl, `getTemplate("${ind}") returned null`).not.toBeNull();
    }
  });
});
