/**
 * MOVE 7 — POLICY TRANSLATION + SANITIZER + TELEMETRY TESTS
 * ===========================================================
 *
 * Created: February 8, 2026 — Move 7
 *
 * THREE TIERS:
 *
 * TIER A — Policy Translation Layer
 *   Tests policyTranslation.ts: code → user-facing message + showInUI flag.
 *   Ensures NAN_SANITIZED/SEMANTIC_CONFLICT hidden, others visible.
 *
 * TIER B — Last-Mile Sanitizer Hardening
 *   Tests pricingSanity.ts enhancements: zero-guard, negative-guard,
 *   displayHints with stable top-3 contributors.
 *
 * TIER C — Telemetry Payload Builder
 *   Tests step3TelemetryService.ts: buildTelemetryPayload() produces
 *   correct signature payload from LoadProfileEnvelope.
 *
 * Run: npx vitest run src/wizard/v7/__tests__/move7Contracts.test.ts
 */

import { describe, it, expect } from "vitest";
import {
  translatePolicyEvents,
  hasVisiblePolicyEvents,
  maxUserSeverity,
} from "../step3/policyTranslation";
import { PolicyCode, type PolicyEvent, type PolicyCodeType } from "../step3/policyTaxonomy";
import { sanitizeQuoteForDisplay, type DisplayHints } from "../utils/pricingSanity";
import { buildTelemetryPayload } from "../telemetry/step3TelemetryService";
import type { LoadProfileEnvelope } from "../step3/loadProfile";

// ============================================================================
// Fixtures
// ============================================================================

function makeEvent(
  code: PolicyCodeType,
  severity: "info" | "warn" | "error" = "info",
  extras: Partial<PolicyEvent> = {}
): PolicyEvent {
  return {
    policyCode: code,
    severity,
    detail: `Test event: ${code}`,
    industry: "hotel",
    calculatorId: "hotel_load_v1",
    ...extras,
  };
}

function makeMinimalEnvelope(overrides: Partial<LoadProfileEnvelope> = {}): LoadProfileEnvelope {
  return {
    peakKW: 450,
    avgKW: 280,
    dutyCycle: 0.622,
    energyKWhPerDay: 6720,
    energyKWhPerYear: 2452800,
    contributors: [
      { key: "hvac", label: "HVAC", kW: 210, share: 0.467 },
      { key: "lighting", label: "Lighting", kW: 95, share: 0.211 },
      { key: "process", label: "Process Equipment", kW: 80, share: 0.178 },
      { key: "controls", label: "Controls & BMS", kW: 35, share: 0.078 },
      { key: "other", label: "Other Loads", kW: 30, share: 0.067 },
    ],
    contributorSumKW: 450,
    contributorDriftPct: 0,
    confidence: "high" as const,
    missingTier1: [],
    assumptions: ["ASHRAE 90.1 HVAC baseline"],
    warnings: [],
    schedule: {
      hoursPerDay: 24,
      daysPerWeek: 7,
      profileType: "flat" as const,
    },
    trace: {
      rawIndustry: "hotel",
      normalizedInput: "hotel",
      canonicalSlug: "hotel",
      templateKey: "hotel",
      schemaKey: "hotel",
      calculatorId: "hotel_load_v1",
      reason: "exact" as const,
      resolvedAt: "2026-02-08T12:00:00.000Z",
    },
    calculatorId: "hotel_load_v1",
    industrySlug: "hotel",
    schemaKey: "hotel",
    templateKey: "hotel",
    invariants: [
      { rule: "peak >= avg", passed: true, detail: "ok" },
      { rule: "contributors ≈ peak", passed: true, detail: "ok" },
    ],
    invariantsAllPassed: true,
    conflicts: [],
    policyEvents: [],
    createdAt: "2026-02-08T12:00:00.000Z",
    ...overrides,
  };
}

// ============================================================================
// TIER A — Policy Translation Layer
// ============================================================================

describe("Tier A — Policy Translation Layer", () => {
  describe("showInUI filtering", () => {
    it("NAN_SANITIZED is hidden (internal hygiene)", () => {
      const events = [makeEvent(PolicyCode.NAN_SANITIZED, "warn", { field: "bayCount" })];
      const translated = translatePolicyEvents(events);
      expect(translated).toHaveLength(0);
    });

    it("SEMANTIC_CONFLICT is soft-shown (Move 8: visible with info severity)", () => {
      const events = [makeEvent(PolicyCode.SEMANTIC_CONFLICT, "warn", { field: "roomCount" })];
      const translated = translatePolicyEvents(events);
      expect(translated).toHaveLength(1);
      expect(translated[0].severity).toBe("info");
      expect(translated[0].message).toContain("Resolved a conflict");
    });

    it("RANGE_CLAMPED is shown with adjusted wording", () => {
      const events = [makeEvent(PolicyCode.RANGE_CLAMPED, "info", {
        field: "roomCount",
        rawValue: 999,
        resolvedValue: 400,
      })];
      const translated = translatePolicyEvents(events);
      expect(translated).toHaveLength(1);
      expect(translated[0].message).toContain("Room Count");
      expect(translated[0].message).toContain("999");
      expect(translated[0].message).toContain("400");
    });

    it("BORROWED_SCHEMA is shown with schema name", () => {
      const events = [makeEvent(PolicyCode.BORROWED_SCHEMA, "info", {
        resolvedValue: "gas_station",
      })];
      const translated = translatePolicyEvents(events);
      expect(translated).toHaveLength(1);
      expect(translated[0].message).toContain("Gas Station");
    });

    it("FLOOR_APPLIED is shown", () => {
      const events = [makeEvent(PolicyCode.FLOOR_APPLIED, "info", {
        resolvedValue: 25,
      })];
      const translated = translatePolicyEvents(events);
      expect(translated).toHaveLength(1);
      expect(translated[0].message).toContain("25");
    });

    it("ADAPTER_FALLBACK is shown as warn", () => {
      const events = [makeEvent(PolicyCode.ADAPTER_FALLBACK, "error")];
      const translated = translatePolicyEvents(events);
      expect(translated).toHaveLength(1);
      expect(translated[0].severity).toBe("warn");
      expect(translated[0].message).toContain("general facility model");
    });

    it("CALCULATOR_FALLBACK is shown as warn", () => {
      const events = [makeEvent(PolicyCode.CALCULATOR_FALLBACK, "error")];
      const translated = translatePolicyEvents(events);
      expect(translated).toHaveLength(1);
      expect(translated[0].severity).toBe("warn");
    });

    it("SSOT_INPUT_MISSING is shown with field name", () => {
      const events = [makeEvent(PolicyCode.SSOT_INPUT_MISSING, "warn", {
        field: "squareFootage",
        resolvedValue: 50000,
      })];
      const translated = translatePolicyEvents(events);
      expect(translated).toHaveLength(1);
      expect(translated[0].message).toContain("Square Footage");
      expect(translated[0].message).toContain("50000");
    });

    it("INVARIANT_FAILED is shown", () => {
      const events = [makeEvent(PolicyCode.INVARIANT_FAILED, "warn", {
        field: "peak >= avg",
      })];
      const translated = translatePolicyEvents(events);
      expect(translated).toHaveLength(1);
      expect(translated[0].message).toContain("Peak ≥ Average Load");
    });
  });

  describe("deduplication", () => {
    it("deduplicates events with same code + field", () => {
      const events = [
        makeEvent(PolicyCode.RANGE_CLAMPED, "info", { field: "roomCount", rawValue: 999, resolvedValue: 400 }),
        makeEvent(PolicyCode.RANGE_CLAMPED, "info", { field: "roomCount", rawValue: 999, resolvedValue: 400 }),
      ];
      const translated = translatePolicyEvents(events);
      expect(translated).toHaveLength(1);
    });

    it("keeps events with different fields", () => {
      const events = [
        makeEvent(PolicyCode.RANGE_CLAMPED, "info", { field: "roomCount", rawValue: 999, resolvedValue: 400 }),
        makeEvent(PolicyCode.RANGE_CLAMPED, "info", { field: "bedCount", rawValue: 2000, resolvedValue: 500 }),
      ];
      const translated = translatePolicyEvents(events);
      expect(translated).toHaveLength(2);
    });
  });

  describe("helpers", () => {
    it("hasVisiblePolicyEvents returns true when visible events exist", () => {
      const events = [makeEvent(PolicyCode.FLOOR_APPLIED, "info")];
      expect(hasVisiblePolicyEvents(events)).toBe(true);
    });

    it("hasVisiblePolicyEvents returns false for only NAN_SANITIZED (the sole hidden event)", () => {
      const events = [
        makeEvent(PolicyCode.NAN_SANITIZED, "warn"),
      ];
      expect(hasVisiblePolicyEvents(events)).toBe(false);
    });

    it("hasVisiblePolicyEvents returns true for SEMANTIC_CONFLICT (soft-shown in Move 8)", () => {
      const events = [
        makeEvent(PolicyCode.SEMANTIC_CONFLICT, "warn"),
      ];
      expect(hasVisiblePolicyEvents(events)).toBe(true);
    });

    it("maxUserSeverity returns highest severity", () => {
      const events = [
        makeEvent(PolicyCode.RANGE_CLAMPED, "info", { field: "a" }),
        makeEvent(PolicyCode.ADAPTER_FALLBACK, "error"),
      ];
      const translated = translatePolicyEvents(events);
      expect(maxUserSeverity(translated)).toBe("warn"); // ADAPTER_FALLBACK maps to warn
    });

    it("maxUserSeverity returns info when all info", () => {
      const events = [makeEvent(PolicyCode.FLOOR_APPLIED, "info")];
      const translated = translatePolicyEvents(events);
      expect(maxUserSeverity(translated)).toBe("info");
    });
  });

  describe("mixed event sets", () => {
    it("filters a realistic mixed set correctly", () => {
      const events = [
        makeEvent(PolicyCode.SSOT_INPUT_MISSING, "warn", { field: "occupancyRate", resolvedValue: 0.7 }),
        makeEvent(PolicyCode.NAN_SANITIZED, "warn", { field: "bayCount" }),
        makeEvent(PolicyCode.RANGE_CLAMPED, "info", { field: "roomCount", rawValue: 999, resolvedValue: 400 }),
        makeEvent(PolicyCode.SEMANTIC_CONFLICT, "warn", { field: "sqft" }),
        makeEvent(PolicyCode.BORROWED_SCHEMA, "info", { resolvedValue: "hotel" }),
      ];
      const translated = translatePolicyEvents(events);
      // NAN_SANITIZED hidden, SEMANTIC_CONFLICT now soft-shown → 4 visible
      expect(translated).toHaveLength(4);
      const codes = translated.map((t) => t.code);
      expect(codes).toContain(PolicyCode.SSOT_INPUT_MISSING);
      expect(codes).toContain(PolicyCode.RANGE_CLAMPED);
      expect(codes).toContain(PolicyCode.BORROWED_SCHEMA);
      expect(codes).toContain(PolicyCode.SEMANTIC_CONFLICT);
    });
  });
});

// ============================================================================
// TIER B — Last-Mile Sanitizer Hardening
// ============================================================================

describe("Tier B — Last-Mile Sanitizer", () => {
  describe("NaN/Infinity removal", () => {
    it("replaces NaN with null", () => {
      const q = sanitizeQuoteForDisplay({ peakLoadKW: NaN, capexUSD: 100000 });
      expect(q.peakLoadKW).toBeNull();
      expect(q.capexUSD).toBe(100000);
    });

    it("replaces Infinity with null", () => {
      const q = sanitizeQuoteForDisplay({ irr: Infinity });
      expect(q.irr).toBeNull();
    });

    it("replaces -Infinity with null", () => {
      const q = sanitizeQuoteForDisplay({ npv: -Infinity });
      expect(q.npv).toBeNull();
    });
  });

  describe("zero-guard (no silent zeros)", () => {
    it("capexUSD === 0 becomes null", () => {
      const q = sanitizeQuoteForDisplay({ capexUSD: 0 });
      expect(q.capexUSD).toBeNull();
    });

    it("peakLoadKW === 0 becomes null", () => {
      const q = sanitizeQuoteForDisplay({ peakLoadKW: 0 });
      expect(q.peakLoadKW).toBeNull();
    });

    it("bessKWh === 0 becomes null", () => {
      const q = sanitizeQuoteForDisplay({ bessKWh: 0 });
      expect(q.bessKWh).toBeNull();
    });

    it("annualSavingsUSD === 0 becomes null", () => {
      const q = sanitizeQuoteForDisplay({ annualSavingsUSD: 0 });
      expect(q.annualSavingsUSD).toBeNull();
    });

    it("preserves positive values", () => {
      const q = sanitizeQuoteForDisplay({ capexUSD: 500000, peakLoadKW: 450 });
      expect(q.capexUSD).toBe(500000);
      expect(q.peakLoadKW).toBe(450);
    });
  });

  describe("negative-guard", () => {
    it("negative capexUSD becomes null", () => {
      const q = sanitizeQuoteForDisplay({ capexUSD: -50000 });
      expect(q.capexUSD).toBeNull();
    });
  });

  describe("displayHints", () => {
    it("computes top 3 contributors sorted by kW descending", () => {
      const q = sanitizeQuoteForDisplay({
        trueQuoteValidation: {
          version: "v1",
          kWContributors: { hvac: 200, lighting: 50, process: 150, controls: 20, other: 10 },
        },
      });
      const hints = q._displayHints as DisplayHints;
      expect(hints).toBeDefined();
      expect(hints.topContributors).toHaveLength(3);
      expect(hints.topContributors[0].key).toBe("hvac");
      expect(hints.topContributors[1].key).toBe("process");
      expect(hints.topContributors[2].key).toBe("lighting");
    });

    it("has stable tiebreak by key name", () => {
      const q = sanitizeQuoteForDisplay({
        trueQuoteValidation: {
          version: "v1",
          kWContributors: { cooling: 100, charging: 100, controls: 100, hvac: 100 },
        },
      });
      const hints = q._displayHints as DisplayHints;
      // Same kW → sorted alphabetically
      expect(hints.topContributors[0].key).toBe("charging");
      expect(hints.topContributors[1].key).toBe("controls");
      expect(hints.topContributors[2].key).toBe("cooling");
    });

    it("includes contributor labels", () => {
      const q = sanitizeQuoteForDisplay({
        trueQuoteValidation: {
          version: "v1",
          kWContributors: { hvac: 200, itLoad: 100, process: 50 },
        },
      });
      const hints = q._displayHints as DisplayHints;
      expect(hints.topContributors[0].label).toBe("HVAC");
      expect(hints.topContributors[1].label).toBe("IT Load");
      expect(hints.topContributors[2].label).toBe("Process Equipment");
    });

    it("reports contributorCount and totalKW", () => {
      const q = sanitizeQuoteForDisplay({
        trueQuoteValidation: {
          version: "v1",
          kWContributors: { hvac: 200, lighting: 50, process: 150, other: 0 },
        },
      });
      const hints = q._displayHints as DisplayHints;
      expect(hints.contributorCount).toBe(3); // other=0 excluded
      expect(hints.contributorTotalKW).toBe(400); // 200+50+150
    });

    it("reports sanitizedFields", () => {
      const q = sanitizeQuoteForDisplay({ capexUSD: NaN, peakLoadKW: 0 });
      const hints = q._displayHints as DisplayHints;
      expect(hints.sanitizedFields.length).toBeGreaterThan(0);
    });

    it("handles missing trueQuoteValidation gracefully", () => {
      const q = sanitizeQuoteForDisplay({ peakLoadKW: 450 });
      const hints = q._displayHints as DisplayHints;
      expect(hints.topContributors).toHaveLength(0);
      expect(hints.contributorCount).toBe(0);
    });

    it("handles empty/null quote — returns typed empty DisplayQuote", () => {
      const q = sanitizeQuoteForDisplay(null);
      expect(q.pricingComplete).toBe(false);
      expect(q.peakLoadKW).toBeNull();
      expect(q.capexUSD).toBeNull();
      expect(q.notes).toEqual([]);
      expect(q._displayHints).toBeDefined();
      expect(q._displayHints.topContributors).toHaveLength(0);
    });
  });
});

// ============================================================================
// TIER C — Telemetry Payload Builder
// ============================================================================

describe("Tier C — Telemetry Payload Builder", () => {
  it("builds correct payload from minimal envelope", () => {
    const envelope = makeMinimalEnvelope();
    const payload = buildTelemetryPayload(envelope, "test-session-1");

    expect(payload.industry).toBe("hotel");
    expect(payload.schemaKey).toBe("hotel");
    expect(payload.calculatorId).toBe("hotel_load_v1");
    expect(payload.sessionId).toBe("test-session-1");
    expect(payload.peakKW).toBe(450);
    expect(payload.avgKW).toBe(280);
    expect(payload.dutyCycle).toBe(0.622);
    expect(payload.confidence).toBe("high");
    expect(payload.invariantsAllPassed).toBe(true);
    expect(payload.failedInvariantKeys).toEqual([]);
    expect(payload.policyEventTotal).toBe(0);
    expect(payload.wizardVersion).toBe("v7.1.0");
  });

  it("reports top 3 contributors sorted by kW", () => {
    const envelope = makeMinimalEnvelope();
    const payload = buildTelemetryPayload(envelope);

    expect(payload.topContributors).toHaveLength(3);
    expect(payload.topContributors[0].key).toBe("hvac");
    expect(payload.topContributors[0].kW).toBe(210);
    expect(payload.topContributors[1].key).toBe("lighting");
    expect(payload.topContributors[2].key).toBe("process");
    expect(payload.contributorCount).toBe(5);
  });

  it("counts policy events by code", () => {
    const envelope = makeMinimalEnvelope({
      policyEvents: [
        makeEvent(PolicyCode.RANGE_CLAMPED, "info", { field: "roomCount" }),
        makeEvent(PolicyCode.RANGE_CLAMPED, "info", { field: "occupancyRate" }),
        makeEvent(PolicyCode.NAN_SANITIZED, "warn", { field: "bayCount" }),
      ],
    });
    const payload = buildTelemetryPayload(envelope);

    expect(payload.policyEventTotal).toBe(3);
    expect(payload.policyEventCountByCode["RANGE_CLAMPED"]).toBe(2);
    expect(payload.policyEventCountByCode["NAN_SANITIZED"]).toBe(1);
    expect(payload.policyEventMaxSeverity).toBe("warn");
  });

  it("reports failed invariant keys", () => {
    const envelope = makeMinimalEnvelope({
      invariants: [
        { rule: "peak >= avg", passed: true, detail: "ok" },
        { rule: "contributors ≈ peak", passed: false, detail: "drift 15%" },
        { rule: "duty cycle range", passed: false, detail: "0.02 < 0.05" },
      ],
      invariantsAllPassed: false,
    });
    const payload = buildTelemetryPayload(envelope);

    expect(payload.invariantsAllPassed).toBe(false);
    expect(payload.failedInvariantKeys).toEqual(["contributors ≈ peak", "duty cycle range"]);
  });

  it("reports missing tier-1 count", () => {
    const envelope = makeMinimalEnvelope({
      missingTier1: ["roomCount", "hotelClass"],
    });
    const payload = buildTelemetryPayload(envelope);
    expect(payload.missingTier1Count).toBe(2);
  });

  it("handles envelope with zero contributors", () => {
    const envelope = makeMinimalEnvelope({
      contributors: [],
      contributorSumKW: 0,
    });
    const payload = buildTelemetryPayload(envelope);
    expect(payload.topContributors).toHaveLength(0);
    expect(payload.contributorCount).toBe(0);
  });

  it("maxSeverity is 'none' when no policy events", () => {
    const envelope = makeMinimalEnvelope({ policyEvents: [] });
    const payload = buildTelemetryPayload(envelope);
    expect(payload.policyEventMaxSeverity).toBe("none");
  });

  it("maxSeverity is 'error' when error events present", () => {
    const envelope = makeMinimalEnvelope({
      policyEvents: [
        makeEvent(PolicyCode.ADAPTER_FALLBACK, "error"),
      ],
    });
    const payload = buildTelemetryPayload(envelope);
    expect(payload.policyEventMaxSeverity).toBe("error");
  });

  it("rounds peakKW and dutyCycle to expected precision", () => {
    const envelope = makeMinimalEnvelope({
      peakKW: 450.777777,
      dutyCycle: 0.622222222,
    });
    const payload = buildTelemetryPayload(envelope);
    expect(payload.peakKW).toBe(450.78); // round2
    expect(payload.dutyCycle).toBe(0.6222); // round4
  });
});
