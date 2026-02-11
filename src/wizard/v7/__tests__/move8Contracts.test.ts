/**
 * MOVE 8 — CONTRACT TESTS
 * ========================
 *
 * Created: February 2026 — Move 8
 *
 * FIVE TIERS:
 *
 * TIER A — Test Segregation Honesty
 *   Validates vitest.config.ts exclude patterns isolate Playwright/E2E.
 *
 * TIER B — Telemetry Schema Version + Build Stamp
 *   Tests that buildTelemetryPayload() always includes schemaVersion and buildStamp.
 *
 * TIER C — DisplayQuote Typed Contract
 *   Tests sanitizeQuoteForDisplay() returns a typed DisplayQuote with all
 *   required fields present, including _displayHints.
 *
 * TIER D — SEMANTIC_CONFLICT Soft Show
 *   Tests that SEMANTIC_CONFLICT is now visible (showInUI: true), with info
 *   severity, and can be aggregated for multi-conflict scenarios.
 *
 * TIER E — RLS + Step 4 Graceful Degradation
 *   Tests migration SQL has restrictive RLS. Tests Step 4 references
 *   _displayHints and falls back gracefully when missing.
 *
 * Run: npx vitest run src/wizard/v7/__tests__/move8Contracts.test.ts
 */

import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

import { buildTelemetryPayload, type Step3TelemetryPayload } from "../telemetry/step3TelemetryService";
import {
  sanitizeQuoteForDisplay,
  type DisplayQuote,
  type DisplayHints,
  type DisplayTrueQuoteValidation,
  type DisplayConfidence,
} from "../utils/pricingSanity";
import {
  translatePolicyEvents,
  aggregateSemanticConflicts,
  hasVisiblePolicyEvents,
} from "../step3/policyTranslation";
import { PolicyCode, type PolicyEvent, type PolicyCodeType } from "../step3/policyTaxonomy";
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

const FULL_QUOTE_FIXTURE: Record<string, unknown> = {
  pricingComplete: true,
  peakLoadKW: 450,
  baseLoadKW: 280,
  bessKWh: 1800,
  bessKW: 450,
  durationHours: 4,
  capexUSD: 850000,
  annualSavingsUSD: 127500,
  roiYears: 5.2,
  npv: 1200000,
  irr: 14.1,
  paybackYears: 6.8,
  demandChargeSavings: 45000,
  solarKW: 200,
  generatorKW: 0,
  confidence: { location: "exact", industry: "v1", overall: "high" },
  trueQuoteValidation: {
    version: "v1",
    dutyCycle: 0.62,
    kWContributors: { hvac: 210, lighting: 95, process: 80, controls: 35, other: 30 },
    kWContributorsTotalKW: 450,
    assumptions: ["ASHRAE 90.1 HVAC baseline", "4 W/sqft lighting"],
  },
  notes: ["Based on 150-room upscale hotel"],
  missingInputs: [],
};

// ============================================================================
// TIER A — Test Segregation Honesty
// ============================================================================

describe("Tier A — Test Segregation", () => {
  const configPath = path.resolve(__dirname, "../../../../vitest.config.ts");
  let configSource: string;

  beforeAll();
  function beforeAll() {
    configSource = fs.readFileSync(configPath, "utf-8");
  }

  it("vitest.config.ts include is scoped to src/**", () => {
    expect(configSource).toContain("src/**/*.test.ts");
    expect(configSource).not.toMatch(/include:.*\*\*\/\*\.test\.ts['"],?\s*$/m);
  });

  it("excludes tests/e2e/**", () => {
    expect(configSource).toContain("tests/e2e/**");
  });

  it("excludes tests/puppeteer/**", () => {
    expect(configSource).toContain("tests/puppeteer/**");
  });

  it("excludes tests/stagehand/**", () => {
    expect(configSource).toContain("tests/stagehand/**");
  });

  it("excludes tests/smoke/**", () => {
    expect(configSource).toContain("tests/smoke/**");
  });

  it("excludes tests/visual/**", () => {
    expect(configSource).toContain("tests/visual/**");
  });

  it("excludes tests/integration/**", () => {
    expect(configSource).toContain("tests/integration/**");
  });

  it("excludes tests/perf/**", () => {
    expect(configSource).toContain("tests/perf/**");
  });

  it("excludes example test files", () => {
    expect(configSource).toContain("*.example.test.ts");
  });
});

// ============================================================================
// TIER B — Telemetry Schema Version + Build Stamp
// ============================================================================

describe("Tier B — Telemetry Schema Version", () => {
  it("payload includes schemaVersion as a number", () => {
    const envelope = makeMinimalEnvelope();
    const payload = buildTelemetryPayload(envelope);
    expect(payload.schemaVersion).toBe(1);
    expect(typeof payload.schemaVersion).toBe("number");
  });

  it("payload includes buildStamp as a non-empty string", () => {
    const envelope = makeMinimalEnvelope();
    const payload = buildTelemetryPayload(envelope);
    expect(payload.buildStamp).toBeDefined();
    expect(typeof payload.buildStamp).toBe("string");
    expect(payload.buildStamp.length).toBeGreaterThan(0);
  });

  it("buildStamp contains wizard version prefix", () => {
    const envelope = makeMinimalEnvelope();
    const payload = buildTelemetryPayload(envelope);
    expect(payload.buildStamp).toMatch(/^v7\./);
  });

  it("schemaVersion is stable across calls (not timestamp-based)", () => {
    const e1 = makeMinimalEnvelope();
    const e2 = makeMinimalEnvelope();
    const p1 = buildTelemetryPayload(e1);
    const p2 = buildTelemetryPayload(e2);
    expect(p1.schemaVersion).toBe(p2.schemaVersion);
    expect(p1.buildStamp).toBe(p2.buildStamp);
  });

  it("Step3TelemetryPayload type includes schemaVersion and buildStamp", () => {
    // Type-level test — would fail at compile time if fields removed
    const payload: Step3TelemetryPayload = {
      traceId: "test",
      industry: "hotel",
      schemaKey: "hotel",
      calculatorId: "hotel_load_v1",
      templateKey: "hotel",
      schemaVersion: 1,
      buildStamp: "v7.1.0+move8",
      peakKW: 450,
      avgKW: 280,
      dutyCycle: 0.622,
      energyKWhPerDay: 6720,
      confidence: "high",
      invariantsAllPassed: true,
      failedInvariantKeys: [],
      missingTier1Count: 0,
      warningCount: 0,
      policyEventTotal: 0,
      policyEventCountByCode: {},
      policyEventMaxSeverity: "none",
      topContributors: [],
      contributorCount: 0,
      wizardVersion: "v7.1.0",
      createdAt: "2026-02-08T12:00:00.000Z",
    };
    expect(payload.schemaVersion).toBe(1);
    expect(payload.buildStamp).toBe("v7.1.0+move8");
  });
});

// ============================================================================
// TIER C — DisplayQuote Typed Contract
// ============================================================================

describe("Tier C — DisplayQuote Contract", () => {
  describe("shape — all required fields present", () => {
    it("sanitizeQuoteForDisplay returns object with pricingComplete", () => {
      const q = sanitizeQuoteForDisplay(FULL_QUOTE_FIXTURE);
      expect(typeof q.pricingComplete).toBe("boolean");
    });

    it("returns typed engineering numbers (number | null)", () => {
      const q = sanitizeQuoteForDisplay(FULL_QUOTE_FIXTURE);
      expect(q.peakLoadKW).toBe(450);
      expect(q.bessKWh).toBe(1800);
      expect(q.bessKW).toBe(450);
      expect(q.durationHours).toBe(4);
    });

    it("returns typed money numbers (number | null)", () => {
      const q = sanitizeQuoteForDisplay(FULL_QUOTE_FIXTURE);
      expect(q.capexUSD).toBe(850000);
      expect(q.annualSavingsUSD).toBe(127500);
      expect(q.roiYears).toBe(5.2);
      expect(q.npv).toBe(1200000);
      expect(q.irr).toBe(14.1);
      expect(q.paybackYears).toBe(6.8);
      expect(q.demandChargeSavings).toBe(45000);
    });

    it("returns notes as string[]", () => {
      const q = sanitizeQuoteForDisplay(FULL_QUOTE_FIXTURE);
      expect(Array.isArray(q.notes)).toBe(true);
      expect(q.notes).toContain("Based on 150-room upscale hotel");
    });

    it("returns missingInputs as string[]", () => {
      const q = sanitizeQuoteForDisplay(FULL_QUOTE_FIXTURE);
      expect(Array.isArray(q.missingInputs)).toBe(true);
    });

    it("returns _displayHints always present", () => {
      const q = sanitizeQuoteForDisplay(FULL_QUOTE_FIXTURE);
      expect(q._displayHints).toBeDefined();
      expect(q._displayHints.topContributors).toBeDefined();
      expect(Array.isArray(q._displayHints.topContributors)).toBe(true);
      expect(q._displayHints.contributorCount).toBeGreaterThan(0);
    });

    it("returns confidence as DisplayConfidence or null", () => {
      const q = sanitizeQuoteForDisplay(FULL_QUOTE_FIXTURE);
      expect(q.confidence).toBeDefined();
      expect(q.confidence!.industry).toBe("v1");
    });

    it("returns trueQuoteValidation when present", () => {
      const q = sanitizeQuoteForDisplay(FULL_QUOTE_FIXTURE);
      expect(q.trueQuoteValidation).toBeDefined();
      expect(q.trueQuoteValidation!.version).toBe("v1");
      expect(q.trueQuoteValidation!.kWContributors).toBeDefined();
    });
  });

  describe("empty quote returns typed empty DisplayQuote", () => {
    it("null input returns all-null DisplayQuote", () => {
      const q = sanitizeQuoteForDisplay(null);
      expect(q.pricingComplete).toBe(false);
      expect(q.peakLoadKW).toBeNull();
      expect(q.capexUSD).toBeNull();
      expect(q.notes).toEqual([]);
      expect(q.missingInputs).toEqual([]);
      expect(q._displayHints.topContributors).toHaveLength(0);
    });

    it("undefined input returns all-null DisplayQuote", () => {
      const q = sanitizeQuoteForDisplay(undefined);
      expect(q.pricingComplete).toBe(false);
      expect(q.bessKWh).toBeNull();
    });

    it("empty object returns typed DisplayQuote with defaults", () => {
      const q = sanitizeQuoteForDisplay({});
      expect(q.pricingComplete).toBe(false);
      expect(q.notes).toEqual([]);
    });
  });

  describe("_displayHints pre-computation", () => {
    it("top contributors are sorted by kW descending", () => {
      const q = sanitizeQuoteForDisplay(FULL_QUOTE_FIXTURE);
      const tops = q._displayHints.topContributors;
      expect(tops.length).toBeGreaterThanOrEqual(3);
      for (let i = 1; i < tops.length; i++) {
        expect(tops[i - 1].kW).toBeGreaterThanOrEqual(tops[i].kW);
      }
    });

    it("top contributors have labels", () => {
      const q = sanitizeQuoteForDisplay(FULL_QUOTE_FIXTURE);
      for (const c of q._displayHints.topContributors) {
        expect(c.label).toBeTruthy();
        expect(typeof c.label).toBe("string");
      }
    });

    it("displayHints.sanitizedFields is empty for clean input", () => {
      const q = sanitizeQuoteForDisplay(FULL_QUOTE_FIXTURE);
      expect(q._displayHints.sanitizedFields).toEqual([]);
    });

    it("displayHints.sanitizedFields captures NaN fields", () => {
      const poisoned = { ...FULL_QUOTE_FIXTURE, capexUSD: NaN };
      const q = sanitizeQuoteForDisplay(poisoned);
      expect(q._displayHints.sanitizedFields).toContain("capexUSD");
      expect(q.capexUSD).toBeNull();
    });
  });
});

// ============================================================================
// TIER D — SEMANTIC_CONFLICT Soft Show
// ============================================================================

describe("Tier D — SEMANTIC_CONFLICT Soft Show", () => {
  it("SEMANTIC_CONFLICT is now visible (showInUI: true)", () => {
    const events = [makeEvent(PolicyCode.SEMANTIC_CONFLICT, "warn", { field: "roomCount" })];
    const translated = translatePolicyEvents(events);
    expect(translated).toHaveLength(1);
  });

  it("SEMANTIC_CONFLICT renders with info severity (not warn)", () => {
    const events = [makeEvent(PolicyCode.SEMANTIC_CONFLICT, "warn", { field: "squareFootage" })];
    const translated = translatePolicyEvents(events);
    expect(translated[0].severity).toBe("info");
  });

  it("SEMANTIC_CONFLICT message mentions 'most reliable data'", () => {
    const events = [makeEvent(PolicyCode.SEMANTIC_CONFLICT, "warn", { field: "bayCount" })];
    const translated = translatePolicyEvents(events);
    expect(translated[0].message).toContain("most reliable data");
  });

  it("SEMANTIC_CONFLICT message humanizes the field name", () => {
    const events = [makeEvent(PolicyCode.SEMANTIC_CONFLICT, "warn", { field: "bayCount" })];
    const translated = translatePolicyEvents(events);
    expect(translated[0].message).toContain("Bay Count");
  });

  describe("aggregateSemanticConflicts", () => {
    it("returns null when no conflicts", () => {
      const events = translatePolicyEvents([
        makeEvent(PolicyCode.RANGE_CLAMPED, "info"),
      ]);
      const agg = aggregateSemanticConflicts(events);
      expect(agg).toBeNull();
    });

    it("returns single event unchanged when only 1 conflict", () => {
      const events = translatePolicyEvents([
        makeEvent(PolicyCode.SEMANTIC_CONFLICT, "warn", { field: "roomCount" }),
      ]);
      const agg = aggregateSemanticConflicts(events);
      expect(agg).not.toBeNull();
      expect(agg!.code).toBe(PolicyCode.SEMANTIC_CONFLICT);
      expect(agg!.message).toContain("Room Count");
    });

    it("aggregates 2 conflicts into one message listing both fields", () => {
      const events = translatePolicyEvents([
        makeEvent(PolicyCode.SEMANTIC_CONFLICT, "warn", { field: "roomCount" }),
        makeEvent(PolicyCode.SEMANTIC_CONFLICT, "warn", { field: "squareFootage" }),
      ]);
      const agg = aggregateSemanticConflicts(events);
      expect(agg).not.toBeNull();
      expect(agg!.message).toContain("Room Count");
      expect(agg!.message).toContain("Square Footage");
      expect(agg!.severity).toBe("info");
    });

    it("aggregates 4+ conflicts with '... and N others' phrasing", () => {
      const events = translatePolicyEvents([
        makeEvent(PolicyCode.SEMANTIC_CONFLICT, "warn", { field: "roomCount" }),
        makeEvent(PolicyCode.SEMANTIC_CONFLICT, "warn", { field: "squareFootage" }),
        makeEvent(PolicyCode.SEMANTIC_CONFLICT, "warn", { field: "bayCount" }),
        makeEvent(PolicyCode.SEMANTIC_CONFLICT, "warn", { field: "bedCount" }),
      ]);
      const agg = aggregateSemanticConflicts(events);
      expect(agg).not.toBeNull();
      expect(agg!.message).toMatch(/and \d+ other/);
    });

    it("NAN_SANITIZED is still hidden (unchanged)", () => {
      const events = [makeEvent(PolicyCode.NAN_SANITIZED, "warn", { field: "bayCount" })];
      const translated = translatePolicyEvents(events);
      expect(translated).toHaveLength(0);
    });
  });
});

// ============================================================================
// TIER E — RLS + Step 4 Graceful Degradation
// ============================================================================

describe("Tier E — RLS + Step 4 Graceful Degradation", () => {
  describe("RLS migration audit", () => {
    const migrationPath = path.resolve(
      __dirname,
      "../../../../database/migrations/20260208_step3_envelopes_log.sql"
    );
    let migrationSQL: string;

    beforeAll();
    function beforeAll() {
      migrationSQL = fs.readFileSync(migrationPath, "utf-8");
    }

    it("enables RLS on step3_envelopes_log", () => {
      expect(migrationSQL).toContain("ENABLE ROW LEVEL SECURITY");
    });

    it("insert is server-only (no INSERT policy — service_role bypasses RLS)", () => {
      // Server-insert pattern: NO INSERT policy exists.
      // service_role bypasses RLS for server-side inserts.
      expect(migrationSQL).not.toContain("FOR INSERT");
      // user_id column exists for attribution
      expect(migrationSQL).toContain("user_id");
    });

    it("select policy restricts to ADMIN tier", () => {
      expect(migrationSQL).toContain("ADMIN");
      expect(migrationSQL).toContain("FOR SELECT");
    });

    it("migration includes schema_version column", () => {
      expect(migrationSQL).toContain("schema_version");
    });

    it("migration includes build_stamp column", () => {
      expect(migrationSQL).toContain("build_stamp");
    });
  });

  describe("Step 6 _displayHints graceful degradation", () => {
    const step4Path = path.resolve(
      __dirname,
      "../../../components/wizard/v7/steps/Step6ResultsV7.tsx"
    );
    let step4Source: string;

    beforeAll();
    function beforeAll() {
      step4Source = fs.readFileSync(step4Path, "utf-8");
    }

    it("Step 4 imports DisplayQuote type from pricingSanity", () => {
      expect(step4Source).toContain("DisplayQuote");
      expect(step4Source).toContain("pricingSanity");
    });

    it("Step 4 references _displayHints for contributor rendering", () => {
      expect(step4Source).toContain("_displayHints");
    });

    it("Step 4 has fallback to getTopContributors when hints missing", () => {
      // Both paths should exist: hints.topContributors AND getTopContributors
      expect(step4Source).toContain("hints?.topContributors");
      expect(step4Source).toContain("getTopContributors");
    });

    it("Step 4 file does NOT use bare 'as Record<string, unknown>' for quote type", () => {
      // After Move 8, quote should be typed DisplayQuote, not manually cast
      // The useMemo should NOT have the old manual type annotation
      expect(step4Source).not.toMatch(
        /sanitizeQuoteForDisplay\(quoteRaw\)\s+as\s+Record<string,\s*unknown>/
      );
    });
  });
});
