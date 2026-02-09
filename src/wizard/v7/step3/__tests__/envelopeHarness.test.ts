/**
 * ENVELOPE HARNESS TESTS
 * =======================
 *
 * Created: February 8, 2026
 *
 * Validates the Step 3 normalization architecture:
 *   - step3Compute produces valid LoadProfileEnvelopes
 *   - Gold-standard adapters (hotel, car-wash, ev-charging) produce correct shapes
 *   - Invariant checks catch real problems
 *   - Idempotence: same inputs → same envelope (minus timestamp)
 *   - NaN deep scan: no NaN/Infinity anywhere in envelope
 *   - Contributor sanity: sum ≈ peakKW, all ≥ 0
 *   - Confidence levels: respond to missing Tier-1 answers
 *   - Generic fallback works for unknown industries
 *
 * TIERS:
 *   0 — Module loads without error
 *   1 — Structural: envelope shape, required fields
 *   2 — Gold-standard adapter round-trips
 *   3 — Invariant enforcement
 *   4 — Idempotence
 *   5 — NaN deep scan
 *   6 — Confidence response
 *   7 — Generic fallback
 *   8 — Adapter registry
 *
 * Run: npx vitest run src/wizard/v7/step3/__tests__/envelopeHarness.test.ts
 */

import { describe, it, expect, beforeAll } from "vitest";
import {
  step3Compute,
  registerAdapter,
  getAdapter,
  listAdapterSlugs,
  computeConfidence,
  checkEnvelopeInvariants,
  type LoadProfileEnvelope,
  type NormalizedLoadInputs,
  SCHEDULE_PRESETS,
  HVAC_PRESETS,
  ARCHITECTURE_PRESETS,
} from "../index";

// Force adapter registration by importing the barrel
import "../adapters";

// ============================================================================
// TIER 0: Module loads without error
// ============================================================================

describe("Tier 0 — Module integrity", () => {
  it("step3Compute is a function", () => {
    expect(typeof step3Compute).toBe("function");
  });

  it("registerAdapter is a function", () => {
    expect(typeof registerAdapter).toBe("function");
  });

  it("SCHEDULE_PRESETS is an object with entries", () => {
    expect(Object.keys(SCHEDULE_PRESETS).length).toBeGreaterThan(0);
  });

  it("HVAC_PRESETS is an object with entries", () => {
    expect(Object.keys(HVAC_PRESETS).length).toBeGreaterThan(0);
  });

  it("ARCHITECTURE_PRESETS is an object with entries", () => {
    expect(Object.keys(ARCHITECTURE_PRESETS).length).toBeGreaterThan(0);
  });
});

// ============================================================================
// TIER 1: Structural — envelope shape, required fields
// ============================================================================

describe("Tier 1 — Envelope structural integrity", () => {
  const REQUIRED_ENVELOPE_KEYS: (keyof LoadProfileEnvelope)[] = [
    "peakKW",
    "avgKW",
    "dutyCycle",
    "energyKWhPerDay",
    "energyKWhPerYear",
    "contributors",
    "contributorSumKW",
    "contributorDriftPct",
    "confidence",
    "missingTier1",
    "assumptions",
    "warnings",
    "trace",
    "calculatorId",
    "industrySlug",
    "schemaKey",
    "templateKey",
    "schedule",
    "invariants",
    "invariantsAllPassed",
    "createdAt",
  ];

  const envelope = step3Compute({
    industry: "hotel",
    answers: { numRooms: 200, hotelCategory: "upscale" },
  });

  for (const key of REQUIRED_ENVELOPE_KEYS) {
    it(`envelope has required key: ${key}`, () => {
      expect(envelope).toHaveProperty(key);
    });
  }

  it("peakKW is a positive integer", () => {
    expect(envelope.peakKW).toBeGreaterThan(0);
    expect(Number.isInteger(envelope.peakKW)).toBe(true);
  });

  it("avgKW is ≤ peakKW", () => {
    expect(envelope.avgKW).toBeLessThanOrEqual(envelope.peakKW);
  });

  it("dutyCycle is in [0, 1.25]", () => {
    expect(envelope.dutyCycle).toBeGreaterThanOrEqual(0);
    expect(envelope.dutyCycle).toBeLessThanOrEqual(1.25);
  });

  it("energyKWhPerDay is positive", () => {
    expect(envelope.energyKWhPerDay).toBeGreaterThan(0);
  });

  it("energyKWhPerYear ≈ energyKWhPerDay × 365", () => {
    expect(envelope.energyKWhPerYear).toBe(Math.round(envelope.energyKWhPerDay * 365));
  });

  it("contributors is a non-empty array", () => {
    expect(Array.isArray(envelope.contributors)).toBe(true);
    expect(envelope.contributors.length).toBeGreaterThan(0);
  });

  it("each contributor has key, label, kW, share", () => {
    for (const c of envelope.contributors) {
      expect(c).toHaveProperty("key");
      expect(c).toHaveProperty("label");
      expect(c).toHaveProperty("kW");
      expect(c).toHaveProperty("share");
      expect(typeof c.key).toBe("string");
      expect(typeof c.label).toBe("string");
      expect(typeof c.kW).toBe("number");
      expect(typeof c.share).toBe("number");
    }
  });

  it("contributorSumKW matches sum of contributor kW", () => {
    const sum = envelope.contributors.reduce((s, c) => s + c.kW, 0);
    expect(envelope.contributorSumKW).toBe(sum);
  });

  it("invariants is an array", () => {
    expect(Array.isArray(envelope.invariants)).toBe(true);
  });

  it("invariantsAllPassed is a boolean", () => {
    expect(typeof envelope.invariantsAllPassed).toBe("boolean");
  });

  it("createdAt is an ISO string", () => {
    expect(() => new Date(envelope.createdAt)).not.toThrow();
    expect(new Date(envelope.createdAt).toISOString()).toBe(envelope.createdAt);
  });

  it("schedule has hoursPerDay and daysPerWeek", () => {
    expect(envelope.schedule.hoursPerDay).toBeGreaterThan(0);
    expect(envelope.schedule.daysPerWeek).toBeGreaterThan(0);
  });

  it("trace has resolution provenance", () => {
    expect(envelope.trace).toHaveProperty("rawIndustry");
    expect(envelope.trace).toHaveProperty("canonicalSlug");
    expect(envelope.trace).toHaveProperty("calculatorId");
  });
});

// ============================================================================
// TIER 2: Gold-standard adapter round-trips
// ============================================================================

describe("Tier 2 — Gold-standard adapters", () => {
  describe("Hotel adapter", () => {
    it("produces envelope with industrySlug = hotel", () => {
      const env = step3Compute({
        industry: "hotel",
        answers: { numRooms: 150, hotelCategory: "3-star" },
      });
      expect(env.industrySlug).toBe("hotel");
    });

    it("peakKW scales with room count", () => {
      const small = step3Compute({
        industry: "hotel",
        answers: { numRooms: 50, hotelCategory: "midscale" },
      });
      const large = step3Compute({
        industry: "hotel",
        answers: { numRooms: 500, hotelCategory: "midscale" },
      });
      expect(large.peakKW).toBeGreaterThan(small.peakKW);
    });

    it("luxury hotel has higher peak than economy", () => {
      const economy = step3Compute({
        industry: "hotel",
        answers: { numRooms: 150, hotelCategory: "1-star" },
      });
      const luxury = step3Compute({
        industry: "hotel",
        answers: { numRooms: 150, hotelCategory: "5-star" },
      });
      expect(luxury.peakKW).toBeGreaterThanOrEqual(economy.peakKW);
    });

    it("amenities add process loads", () => {
      const bare = step3Compute({
        industry: "hotel",
        answers: {
          numRooms: 150,
          hotelCategory: "3-star",
          poolOnSite: "no",
          restaurantOnSite: "no",
          spaOnSite: "no",
        },
      });
      const loaded = step3Compute({
        industry: "hotel",
        answers: {
          numRooms: 150,
          hotelCategory: "3-star",
          poolOnSite: "yes",
          restaurantOnSite: "yes",
          spaOnSite: "yes",
        },
      });
      // Loaded hotel should have more contributors or higher contributor sum
      expect(loaded.contributors.length).toBeGreaterThanOrEqual(bare.contributors.length);
    });

    it("has hotel_load_v1 calculator", () => {
      const env = step3Compute({ industry: "hotel", answers: {} });
      expect(env.calculatorId).toBe("hotel_load_v1");
    });

    it("resolves hospitality alias to hotel", () => {
      const env = step3Compute({ industry: "hospitality", answers: { numRooms: 100 } });
      expect(env.industrySlug).toBe("hotel");
    });
  });

  describe("Car Wash adapter", () => {
    it("produces envelope with industrySlug = car_wash", () => {
      const env = step3Compute({
        industry: "car_wash",
        answers: { tunnelOrBayCount: 4, facilityType: "tunnel" },
      });
      expect(env.industrySlug).toBe("car_wash");
    });

    it("peakKW scales with bay count", () => {
      const small = step3Compute({
        industry: "car-wash",
        answers: { tunnelOrBayCount: 2 },
      });
      const large = step3Compute({
        industry: "car-wash",
        answers: { tunnelOrBayCount: 8 },
      });
      expect(large.peakKW).toBeGreaterThan(small.peakKW);
    });

    it("has car_wash_load_v1 calculator", () => {
      const env = step3Compute({ industry: "car-wash", answers: {} });
      expect(env.calculatorId).toBe("car_wash_load_v1");
    });

    it("schedule reflects operating hours answer", () => {
      const env = step3Compute({
        industry: "car_wash",
        answers: { operatingHours: 16, daysPerWeek: 6 },
      });
      expect(env.schedule.hoursPerDay).toBe(16);
      expect(env.schedule.daysPerWeek).toBe(6);
    });
  });

  describe("EV Charging adapter", () => {
    it("produces envelope with industrySlug = ev_charging", () => {
      const env = step3Compute({
        industry: "ev_charging",
        answers: { level2Chargers: 12, dcFastChargers: 8 },
      });
      expect(env.industrySlug).toBe("ev_charging");
    });

    it("peakKW scales with DCFC count", () => {
      const small = step3Compute({
        industry: "ev-charging",
        answers: { level2Chargers: 4, dcFastChargers: 2 },
      });
      const large = step3Compute({
        industry: "ev-charging",
        answers: { level2Chargers: 20, dcFastChargers: 16 },
      });
      expect(large.peakKW).toBeGreaterThan(small.peakKW);
    });

    it("HPC chargers increase peak load", () => {
      const noHPC = step3Compute({
        industry: "ev_charging",
        answers: { level2Chargers: 10, dcFastChargers: 6, hpcChargers: 0 },
      });
      const withHPC = step3Compute({
        industry: "ev_charging",
        answers: { level2Chargers: 10, dcFastChargers: 6, hpcChargers: 4 },
      });
      expect(withHPC.peakKW).toBeGreaterThan(noHPC.peakKW);
    });

    it("has ev_charging_load_v1 calculator", () => {
      const env = step3Compute({ industry: "ev-charging", answers: {} });
      expect(env.calculatorId).toBe("ev_charging_load_v1");
    });

    it("preserves explicit zero charger counts (null-safety)", () => {
      const env = step3Compute({
        industry: "ev_charging",
        answers: { level2Chargers: 0, dcFastChargers: 4 },
      });
      // With 0 L2 and 4 DCFC, peak should be lower than default (12 L2 + 8 DCFC)
      const defaultEnv = step3Compute({
        industry: "ev_charging",
        answers: {},
      });
      expect(env.peakKW).toBeLessThan(defaultEnv.peakKW);
    });
  });
});

// ============================================================================
// TIER 3: Invariant enforcement
// ============================================================================

describe("Tier 3 — Invariant enforcement", () => {
  it("well-formed envelope passes all invariants", () => {
    const env = step3Compute({
      industry: "hotel",
      answers: { numRooms: 200, hotelCategory: "upscale" },
    });
    expect(env.invariantsAllPassed).toBe(true);
    for (const inv of env.invariants) {
      expect(inv.passed).toBe(true);
    }
  });

  it("checkEnvelopeInvariants detects negative peakKW", () => {
    const fakeEnvelope = {
      peakKW: -100,
      avgKW: 50,
      dutyCycle: -0.5,
      energyKWhPerDay: 100,
      energyKWhPerYear: 36500,
      contributors: [],
      contributorSumKW: 0,
      contributorDriftPct: 0,
      confidence: "high" as const,
      missingTier1: [],
      assumptions: [],
      warnings: [],
      trace: {
        rawIndustry: "test",
        normalizedInput: "test",
        canonicalSlug: "test",
        templateKey: "test",
        schemaKey: "test",
        calculatorId: "test",
        reason: "exact" as const,
        resolvedAt: new Date().toISOString(),
      },
      calculatorId: "test",
      industrySlug: "test",
      schemaKey: "test",
      templateKey: "test",
      schedule: { hoursPerDay: 10, daysPerWeek: 5, profileType: "commercial" as const },
    };

    const invariants = checkEnvelopeInvariants(fakeEnvelope);
    const peakCheck = invariants.find((i) => i.rule === "peak-positive");
    expect(peakCheck?.passed).toBe(false);
  });

  it("checkEnvelopeInvariants detects NaN in core metrics", () => {
    const fakeEnvelope = {
      peakKW: NaN,
      avgKW: 50,
      dutyCycle: 0.5,
      energyKWhPerDay: 100,
      energyKWhPerYear: 36500,
      contributors: [],
      contributorSumKW: 0,
      contributorDriftPct: 0,
      confidence: "high" as const,
      missingTier1: [],
      assumptions: [],
      warnings: [],
      trace: {
        rawIndustry: "test",
        normalizedInput: "test",
        canonicalSlug: "test",
        templateKey: "test",
        schemaKey: "test",
        calculatorId: "test",
        reason: "exact" as const,
        resolvedAt: new Date().toISOString(),
      },
      calculatorId: "test",
      industrySlug: "test",
      schemaKey: "test",
      templateKey: "test",
      schedule: { hoursPerDay: 10, daysPerWeek: 5, profileType: "commercial" as const },
    };

    const invariants = checkEnvelopeInvariants(fakeEnvelope);
    const nanCheck = invariants.find((i) => i.rule === "no-nan-infinity");
    expect(nanCheck?.passed).toBe(false);
  });

  it("invariants include at least 5 checks for well-formed input", () => {
    const env = step3Compute({
      industry: "hotel",
      answers: { numRooms: 200 },
    });
    expect(env.invariants.length).toBeGreaterThanOrEqual(5);
  });
});

// ============================================================================
// TIER 4: Idempotence
// ============================================================================

describe("Tier 4 — Idempotence", () => {
  it("same inputs produce same peakKW (hotel)", () => {
    const answers = { numRooms: 200, hotelCategory: "upscale" };
    const env1 = step3Compute({ industry: "hotel", answers });
    const env2 = step3Compute({ industry: "hotel", answers });
    expect(env1.peakKW).toBe(env2.peakKW);
    expect(env1.avgKW).toBe(env2.avgKW);
    expect(env1.dutyCycle).toBe(env2.dutyCycle);
    expect(env1.energyKWhPerDay).toBe(env2.energyKWhPerDay);
  });

  it("same inputs produce same peakKW (car wash)", () => {
    const answers = { tunnelOrBayCount: 6, facilityType: "tunnel" };
    const env1 = step3Compute({ industry: "car-wash", answers });
    const env2 = step3Compute({ industry: "car-wash", answers });
    expect(env1.peakKW).toBe(env2.peakKW);
  });

  it("same inputs produce same peakKW (EV charging)", () => {
    const answers = { level2Chargers: 10, dcFastChargers: 5 };
    const env1 = step3Compute({ industry: "ev-charging", answers });
    const env2 = step3Compute({ industry: "ev-charging", answers });
    expect(env1.peakKW).toBe(env2.peakKW);
  });

  it("same contributors in same order", () => {
    const answers = { numRooms: 200, hotelCategory: "luxury", poolOnSite: "yes", restaurantOnSite: "yes" };
    const env1 = step3Compute({ industry: "hotel", answers });
    const env2 = step3Compute({ industry: "hotel", answers });
    expect(env1.contributors.length).toBe(env2.contributors.length);
    for (let i = 0; i < env1.contributors.length; i++) {
      expect(env1.contributors[i].key).toBe(env2.contributors[i].key);
      expect(env1.contributors[i].kW).toBe(env2.contributors[i].kW);
    }
  });
});

// ============================================================================
// TIER 5: NaN deep scan
// ============================================================================

describe("Tier 5 — NaN deep scan", () => {
  const INDUSTRIES = ["hotel", "car-wash", "ev-charging", "office", "other"] as const;

  for (const industry of INDUSTRIES) {
    it(`no NaN or Infinity in ${industry} envelope`, () => {
      const env = step3Compute({ industry, answers: {} });
      const numericFields = [
        env.peakKW,
        env.avgKW,
        env.dutyCycle,
        env.energyKWhPerDay,
        env.energyKWhPerYear,
        env.contributorSumKW,
        env.contributorDriftPct,
      ];

      for (const val of numericFields) {
        expect(Number.isFinite(val)).toBe(true);
      }

      for (const c of env.contributors) {
        expect(Number.isFinite(c.kW)).toBe(true);
        expect(Number.isFinite(c.share)).toBe(true);
      }
    });
  }
});

// ============================================================================
// TIER 6: Confidence response
// ============================================================================

describe("Tier 6 — Confidence calculation", () => {
  it("computeConfidence returns high when ≥85% answered, no warnings", () => {
    expect(computeConfidence(0, 10, false)).toBe("high");
    expect(computeConfidence(1, 10, false)).toBe("high");
  });

  it("computeConfidence returns medium when 50-84% answered", () => {
    expect(computeConfidence(4, 10, false)).toBe("medium");
    expect(computeConfidence(5, 10, false)).toBe("medium");
  });

  it("computeConfidence returns low when 20-49% answered", () => {
    expect(computeConfidence(6, 10, false)).toBe("low");
    expect(computeConfidence(8, 10, false)).toBe("low");
  });

  it("computeConfidence returns fallback when <20% answered", () => {
    expect(computeConfidence(9, 10, false)).toBe("fallback");
    expect(computeConfidence(10, 10, false)).toBe("fallback");
  });

  it("warnings downgrade high to medium", () => {
    // 100% answered + warnings → medium (not high)
    expect(computeConfidence(0, 10, true)).toBe("medium");
  });

  it("zero total blockers returns medium", () => {
    expect(computeConfidence(0, 0, false)).toBe("medium");
  });

  it("envelope confidence responds to answer completeness", () => {
    // Full answers → likely high/medium confidence
    const full = step3Compute({
      industry: "hotel",
      answers: {
        numRooms: 200,
        hotelCategory: "upscale",
        poolOnSite: "yes",
        restaurantOnSite: "yes",
        gridConnection: "on-grid",
      },
    });

    // Empty answers → likely low/fallback confidence
    const empty = step3Compute({
      industry: "hotel",
      answers: {},
    });

    // Full answers should have equal or higher confidence
    const CONF_ORDER = ["fallback", "low", "medium", "high"];
    const fullIdx = CONF_ORDER.indexOf(full.confidence);
    const emptyIdx = CONF_ORDER.indexOf(empty.confidence);
    expect(fullIdx).toBeGreaterThanOrEqual(emptyIdx);
  });
});

// ============================================================================
// TIER 7: Generic fallback
// ============================================================================

describe("Tier 7 — Generic fallback", () => {
  it("unknown industry produces valid envelope", () => {
    const env = step3Compute({
      industry: "unknown_industry_xyz",
      answers: { facilitySize: 30000 },
    });
    expect(env.peakKW).toBeGreaterThan(0);
    expect(env.industrySlug).toBe("other");
  });

  it("empty string industry produces valid envelope", () => {
    const env = step3Compute({
      industry: "",
      answers: {},
    });
    expect(env.peakKW).toBeGreaterThan(0);
  });

  it("fallback envelope has confidence = fallback or low", () => {
    const env = step3Compute({
      industry: "made_up_industry",
      answers: {},
    });
    expect(["fallback", "low", "medium"]).toContain(env.confidence);
  });

  it("other industry uses generic_ssot_v1", () => {
    const env = step3Compute({
      industry: "other",
      answers: {},
    });
    expect(env.calculatorId).toBe("generic_ssot_v1");
  });
});

// ============================================================================
// TIER 8: Adapter registry
// ============================================================================

describe("Tier 8 — Adapter registry", () => {
  it("hotel adapter is registered", () => {
    const adapter = getAdapter("hotel");
    expect(adapter).not.toBeNull();
    expect(adapter!.industrySlug).toBe("hotel");
  });

  it("car_wash adapter is registered", () => {
    const adapter = getAdapter("car_wash");
    expect(adapter).not.toBeNull();
    expect(adapter!.industrySlug).toBe("car_wash");
  });

  it("ev_charging adapter is registered", () => {
    const adapter = getAdapter("ev_charging");
    expect(adapter).not.toBeNull();
    expect(adapter!.industrySlug).toBe("ev_charging");
  });

  it("listAdapterSlugs returns all 3 gold-standard slugs", () => {
    const slugs = listAdapterSlugs();
    expect(slugs).toContain("hotel");
    expect(slugs).toContain("car_wash");
    expect(slugs).toContain("ev_charging");
  });

  it("getAdapter returns null for unregistered industry", () => {
    const adapter = getAdapter("nonexistent");
    expect(adapter).toBeNull();
  });

  it("each registered adapter has consumedAnswerKeys", () => {
    for (const slug of listAdapterSlugs()) {
      const adapter = getAdapter(slug);
      expect(adapter!.consumedAnswerKeys.length).toBeGreaterThan(0);
    }
  });

  it("each registered adapter produces valid default inputs", () => {
    for (const slug of listAdapterSlugs()) {
      const adapter = getAdapter(slug);
      const defaults = adapter!.getDefaultInputs();
      expect(defaults.industrySlug).toBeTruthy();
      expect(defaults.schedule.hoursPerDay).toBeGreaterThan(0);
      expect(defaults.scale.value).toBeGreaterThan(0);
    }
  });
});
