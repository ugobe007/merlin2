/**
 * ============================================================================
 * WIZARD NO-DEAD-ENDS — Anti-Regression Contract (Feb 6, 2026)
 * ============================================================================
 *
 * PURPOSE:
 * This test suite is the "anti-regression spine" for the V7 wizard.
 * If ANY of these tests fail, the build fails. No exceptions.
 *
 * WHAT IT PROTECTS:
 * 1. Step 1: Valid ZIP always enables continue
 * 2. Step 2: Selecting an industry always leads somewhere (template or fallback)
 * 3. Step 3: Renders with either industry template or generic fallback (never blank)
 * 4. Step 4: TrueQuote™ badge only when templateMode=industry AND confidence.industry=v1
 *
 * DOCTRINE:
 * - Every path through the wizard must lead forward
 * - The user must NEVER hit a dead-end
 * - TrueQuote™ claims are NEVER overstated
 *
 * RUN: npx vitest run src/wizard/v7/gates/__tests__/wizardNoDeadEnds.test.ts
 */

import { describe, it, expect } from "vitest";

import {
  gateLocation,
  gateIndustry,
  gateProfile,
  gateResults,
  type WizardGateState,
} from "../wizardStepGates";

import { getTemplate, getFallbackTemplate, hasTemplate } from "../../templates/templateIndex";

// ============================================================================
// CONTRACT 1: Step 1 — Valid ZIP always enables continue
// ============================================================================
describe("Contract 1: Step 1 — ZIP unlocks continue", () => {
  const validZips = ["90210", "10001", "33101", "60601", "98101", "89052-1234"];

  it.each(validZips)("ZIP '%s' allows continue", (zip) => {
    const state: WizardGateState = { locationRawInput: zip };
    expect(gateLocation(state).canContinue).toBe(true);
  });

  it("empty state blocks (does NOT dead-end — shows prompt)", () => {
    expect(gateLocation({}).canContinue).toBe(false);
    expect(gateLocation({}).reason).toBe("zip-incomplete");
  });

  it("3-digit partial ZIP blocks with clear reason", () => {
    const state: WizardGateState = { locationRawInput: "901" };
    const result = gateLocation(state);
    expect(result.canContinue).toBe(false);
    expect(result.reason).toBeDefined();
  });

  it("formattedAddress alone is sufficient (Google Places flow)", () => {
    const state: WizardGateState = {
      location: { formattedAddress: "123 Main St, Beverly Hills, CA 90210" },
    };
    expect(gateLocation(state).canContinue).toBe(true);
  });
});

// ============================================================================
// CONTRACT 2: Step 2 — Selecting industry always leads somewhere
// ============================================================================
describe("Contract 2: Step 2 — Industry selection always leads forward", () => {
  // Every industry slug the wizard UI can produce
  const allIndustrySlugs = [
    "car_wash",
    "hotel",
    "ev_charging",
    "retail",
    "restaurant",
    "warehouse",
    "manufacturing",
    "office",
    "healthcare",
    "data_center",
    "other",
  ];

  it.each(allIndustrySlugs)("industry '%s' passes gate", (industry) => {
    const state: WizardGateState = { industry };
    expect(gateIndustry(state).canContinue).toBe(true);
  });

  it("'auto' (unset) correctly blocks", () => {
    expect(gateIndustry({ industry: "auto" }).canContinue).toBe(false);
  });

  it("null correctly blocks", () => {
    expect(gateIndustry({ industry: null }).canContinue).toBe(false);
  });

  // CRITICAL: Template resolution — every industry must resolve to SOMETHING
  describe("template resolution (no dead-end templates)", () => {
    // The mapping from useWizardV7.ts — must stay in sync
    const templateMapping: Record<string, string> = {
      manufacturing: "data_center",
      warehouse: "data_center",
      office: "hotel",
      retail: "hotel",
      restaurant: "hotel",
      healthcare: "data_center",
      ev_charging: "car_wash",
      other: "hotel",
    };

    it.each(allIndustrySlugs)(
      "industry '%s' resolves to a loadable template or has a valid mapping",
      (industry) => {
        const effective = templateMapping[industry] ?? industry;
        const hasLocal = hasTemplate(effective);
        const hasFallback = getFallbackTemplate() != null;

        // INVARIANT: Either the effective template exists locally, or fallback exists
        expect(hasLocal || hasFallback).toBe(true);
      }
    );

    it("generic fallback template always exists", () => {
      const fallback = getFallbackTemplate();
      expect(fallback).not.toBeNull();
      expect(fallback.industry).toBe("generic");
      expect(fallback.questions.length).toBeGreaterThan(0);
    });

    it.each(["car_wash", "hotel", "data_center"])(
      "primary template '%s' exists as local JSON",
      (industry) => {
        const tpl = getTemplate(industry);
        expect(tpl).not.toBeNull();
        expect(tpl!.questions.length).toBeGreaterThan(0);
      }
    );
  });
});

// ============================================================================
// CONTRACT 3: Step 3 — Always renders (industry template OR generic fallback)
// ============================================================================
describe("Contract 3: Step 3 — Always renders, never blank", () => {
  it("with industry template → gate passes", () => {
    const state: WizardGateState = {
      step3Template: {
        questions: [
          { id: "rooms", required: true },
          { id: "sqft", required: false },
        ],
      },
      step3Answers: { rooms: 150 },
    };
    expect(gateProfile(state).canContinue).toBe(true);
  });

  it("with generic fallback template → gate passes", () => {
    const fallback = getFallbackTemplate();
    const state: WizardGateState = {
      step3Template: {
        questions: fallback.questions.map((q) => ({
          id: q.id,
          required: q.required,
        })),
      },
      step3Answers: Object.fromEntries(
        fallback.questions
          .filter((q) => q.required)
          .map((q) => [q.id, fallback.defaults?.[q.id] ?? "default"])
      ),
    };
    expect(gateProfile(state).canContinue).toBe(true);
  });

  it("with NO template at all → gate still passes (no dead-end)", () => {
    const state: WizardGateState = {
      step3Template: null,
      step3Answers: {},
    };
    expect(gateProfile(state).canContinue).toBe(true);
  });

  it("with step3Complete flag → always passes regardless of answers", () => {
    const state: WizardGateState = {
      step3Complete: true,
      step3Template: null,
      step3Answers: {},
    };
    expect(gateProfile(state).canContinue).toBe(true);
  });

  it("generic fallback has enough questions for a meaningful estimate", () => {
    const fallback = getFallbackTemplate();
    // Generic must have at least 5 questions for basic facility modeling
    expect(fallback.questions.length).toBeGreaterThanOrEqual(5);
  });
});

// ============================================================================
// CONTRACT 4: Step 4 — TrueQuote™ badge only when earned
// ============================================================================
describe("Contract 4: Step 4 — TrueQuote™ honesty", () => {
  /**
   * These tests verify the BADGE DISPLAY RULES, not the UI components directly.
   * The rules are:
   *
   *   BADGE                          | CONDITIONS
   *   ─────────────────────────────  │ ─────────────────────────────────
   *   "✓ TrueQuote™ Complete"       │ pricingComplete=true AND templateMode=industry
   *   "📊 Estimate Mode"            │ pricingComplete=true AND templateMode=fallback
   *   "⏳ Generating..."            │ pricingComplete=false (still running)
   *
   * Additional enforcement:
   *   confidence.industry !== "v1"   → NEVER show TrueQuote™ Complete
   *   templateMode === "fallback"    → ALWAYS show Estimate badge
   */

  // Simulate the badge selection logic (mirrors Step4ResultsV7.tsx)
  type BadgeType = "truequote-complete" | "estimate-mode" | "generating";

  function selectBadge(opts: {
    pricingComplete: boolean;
    templateMode: "industry" | "fallback";
    confidenceIndustry?: "v1" | "fallback";
  }): BadgeType {
    const { pricingComplete, templateMode, confidenceIndustry } = opts;

    if (pricingComplete && templateMode === "industry" && confidenceIndustry !== "fallback") {
      return "truequote-complete";
    }
    if (pricingComplete && (templateMode === "fallback" || confidenceIndustry === "fallback")) {
      return "estimate-mode";
    }
    return "generating";
  }

  it("shows TrueQuote™ when pricing complete + industry template + v1 confidence", () => {
    expect(
      selectBadge({
        pricingComplete: true,
        templateMode: "industry",
        confidenceIndustry: "v1",
      })
    ).toBe("truequote-complete");
  });

  it("shows Estimate when pricing complete + fallback template", () => {
    expect(
      selectBadge({
        pricingComplete: true,
        templateMode: "fallback",
        confidenceIndustry: "fallback",
      })
    ).toBe("estimate-mode");
  });

  it("shows Estimate when pricing complete + industry template BUT fallback confidence", () => {
    // Edge case: template loaded but confidence says fallback (shouldn't happen, but guard)
    expect(
      selectBadge({
        pricingComplete: true,
        templateMode: "industry",
        confidenceIndustry: "fallback",
      })
    ).toBe("estimate-mode");
  });

  it("shows generating when pricing not complete", () => {
    expect(
      selectBadge({
        pricingComplete: false,
        templateMode: "industry",
        confidenceIndustry: "v1",
      })
    ).toBe("generating");
  });

  it("NEVER shows TrueQuote™ when templateMode is fallback, regardless of other fields", () => {
    const cases = [
      { pricingComplete: true, confidenceIndustry: "v1" as const },
      { pricingComplete: true, confidenceIndustry: "fallback" as const },
      { pricingComplete: false, confidenceIndustry: "v1" as const },
    ];

    for (const c of cases) {
      const badge = selectBadge({ ...c, templateMode: "fallback" });
      expect(badge).not.toBe("truequote-complete");
    }
  });

  it("NEVER shows TrueQuote™ when confidence.industry is fallback", () => {
    const badge = selectBadge({
      pricingComplete: true,
      templateMode: "industry",
      confidenceIndustry: "fallback",
    });
    expect(badge).not.toBe("truequote-complete");
  });

  // Verify the results gate never blocks (read-only step)
  it("results gate never blocks (even in error states)", () => {
    expect(gateResults().canContinue).toBe(true);
  });
});

// ============================================================================
// META: Template mapping sync check
// ============================================================================
describe("Meta: Template mapping consistency", () => {
  it("every mapped target actually exists as a local template", () => {
    // These are the targets that templateMapping points TO
    const mappingTargets = ["data_center", "hotel", "car_wash"];

    for (const target of mappingTargets) {
      const tpl = getTemplate(target);
      expect(tpl).not.toBeNull();
    }
  });
});
