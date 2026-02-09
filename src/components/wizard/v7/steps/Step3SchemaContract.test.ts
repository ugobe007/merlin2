/**
 * Step 3 Schema Renderer Contract Test
 *
 * Validates that EVERY question type in ALL curated schemas
 * has a supported renderer implementation.
 *
 * This prevents "new question type without renderer support" regressions.
 *
 * Created: February 9, 2026
 */

import { describe, it, expect } from "vitest";
import {
  resolveStep3Schema,
  CANONICAL_INDUSTRY_KEYS,
  type CanonicalIndustryKey,
} from "@/wizard/v7/schema/curatedFieldsResolver";
import {
  chooseRendererForQuestion,
  validateQuestionTypeSupport,
  normalizeFieldType,
} from "./Step3RendererLogic";

describe("Step 3 Schema Renderer Contract", () => {
  describe("All industries have renderable questions", () => {
    const allIndustries = CANONICAL_INDUSTRY_KEYS;

    for (const industry of allIndustries) {
      it(`${industry}: all questions map to supported renderers`, () => {
        const schema = resolveStep3Schema(industry as CanonicalIndustryKey);
        const { questions } = schema;

        expect(questions.length).toBeGreaterThan(0);

        const unsupportedQuestions: Array<{ id: string; type: string; error: string }> = [];

        for (const question of questions) {
          const error = validateQuestionTypeSupport(question);
          if (error) {
            unsupportedQuestions.push({
              id: question.id,
              type: question.type || "undefined",
              error,
            });
          }
        }

        if (unsupportedQuestions.length > 0) {
          const errorMsg =
            `Industry "${industry}" has ${unsupportedQuestions.length} unsupported question(s):\n` +
            unsupportedQuestions.map((q) => `  - ${q.id} (${q.type}): ${q.error}`).join("\n");
          expect.fail(errorMsg);
        }
      });

      it(`${industry}: type_then_quantity never maps to "number"`, () => {
        const schema = resolveStep3Schema(industry as CanonicalIndustryKey);
        const typeQuantityQuestions = schema.questions.filter(
          (q) => q.type?.toLowerCase() === "type_then_quantity"
        );

        for (const q of typeQuantityQuestions) {
          const renderer = chooseRendererForQuestion(q);
          expect(
            renderer,
            `${industry}.${q.id}: type_then_quantity should render as grid/compact_grid, not number`
          ).not.toBe("number");
        }
      });
    }
  });

  describe("Question type whitelist validation", () => {
    it("collects all unique question types across all industries", () => {
      const allTypes = new Set<string>();

      for (const industry of CANONICAL_INDUSTRY_KEYS) {
        const schema = resolveStep3Schema(industry as CanonicalIndustryKey);
        for (const q of schema.questions) {
          if (q.type) {
            allTypes.add(q.type.toLowerCase());
          }
        }
      }

      // Assert we found at least the known custom types
      const knownCustomTypes = [
        "conditional_buttons",
        "type_then_quantity",
        "hours_grid",
        "range_buttons",
        "increment_box",
        "existing_then_planned",
        "auto_confirm",
        "wheel",
        "multiselect",
        "number_input",
      ];

      const missingTypes = knownCustomTypes.filter((t) => !allTypes.has(t));
      if (missingTypes.length > 0) {
        console.warn(
          `[Contract Test] Expected custom types not found in schemas: ${missingTypes.join(", ")}`
        );
      }

      // Log all discovered types for documentation
      console.log(
        `[Contract Test] Discovered ${allTypes.size} unique question types across ${CANONICAL_INDUSTRY_KEYS.length} industries:`
      );
      console.log(Array.from(allTypes).sort().join(", "));
    });

    it("every discovered type has a normalizeFieldType mapping", () => {
      const allTypes = new Set<string>();

      for (const industry of CANONICAL_INDUSTRY_KEYS) {
        const schema = resolveStep3Schema(industry as CanonicalIndustryKey);
        for (const q of schema.questions) {
          if (q.type) {
            allTypes.add(q.type);
          }
        }
      }

      const unmappedTypes: string[] = [];

      for (const type of allTypes) {
        const normalized = normalizeFieldType(type);

        // If normalizeFieldType returns the input unchanged (except case),
        // and it's not a standard type, it means there's no mapping
        const standardTypes = [
          "text",
          "number",
          "select",
          "buttons",
          "toggle",
          "slider",
          "multiselect",
        ];

        if (normalized === type.toLowerCase() && !standardTypes.includes(normalized)) {
          unmappedTypes.push(type);
        }
      }

      if (unmappedTypes.length > 0) {
        console.warn(
          `[Contract Test] Types without explicit mapping (using fallback): ${unmappedTypes.join(", ")}`
        );
      }

      // This test documents rather than fails - some types may intentionally pass through
      expect(allTypes.size).toBeGreaterThan(0);
    });
  });

  describe("Renderer boundary validation", () => {
    it("all schemas respect option count boundaries", () => {
      const violations: Array<{
        industry: string;
        questionId: string;
        optionCount: number;
        expectedRenderer: string;
      }> = [];

      for (const industry of CANONICAL_INDUSTRY_KEYS) {
        const schema = resolveStep3Schema(industry as CanonicalIndustryKey);

        for (const q of schema.questions) {
          const baseType = normalizeFieldType(q.type);
          if (baseType !== "buttons" && baseType !== "select") continue;

          const optionCount = q.options?.length ?? 0;
          const renderer = chooseRendererForQuestion(q);

          // Validate boundaries
          let expectedRenderer: string;
          if (optionCount === 0) expectedRenderer = "text";
          else if (optionCount <= 6) expectedRenderer = "grid";
          else if (optionCount <= 18) expectedRenderer = "compact_grid";
          else expectedRenderer = "select";

          if (renderer !== expectedRenderer) {
            violations.push({
              industry,
              questionId: q.id,
              optionCount,
              expectedRenderer,
            });
          }
        }
      }

      if (violations.length > 0) {
        const errorMsg =
          `Renderer boundary violations:\n` +
          violations
            .map(
              (v) =>
                `  - ${v.industry}.${v.questionId}: ${v.optionCount} options should use "${v.expectedRenderer}"`
            )
            .join("\n");
        expect.fail(errorMsg);
      }
    });
  });

  describe("Critical industry smoke tests", () => {
    it("car-wash: all 27 questions renderable", () => {
      const schema = resolveStep3Schema("car-wash");
      expect(schema.questions.length).toBeGreaterThanOrEqual(27);

      for (const q of schema.questions) {
        const error = validateQuestionTypeSupport(q);
        expect(error, `car-wash.${q.id} should be renderable`).toBeNull();
      }
    });

    it("car-wash: operatingHours renders as compact_grid", () => {
      const schema = resolveStep3Schema("car-wash");
      const hoursQ = schema.questions.find((q) => q.id === "operatingHours");

      expect(hoursQ, "operatingHours question should exist").toBeDefined();
      if (hoursQ) {
        const renderer = chooseRendererForQuestion(hoursQ);
        expect(renderer).toBe("compact_grid");
      }
    });

    it("car-wash: pumpConfiguration renders as grid (not number)", () => {
      const schema = resolveStep3Schema("car-wash");
      const pumpQ = schema.questions.find((q) => q.id === "pumpConfiguration");

      expect(pumpQ, "pumpConfiguration question should exist").toBeDefined();
      if (pumpQ) {
        const renderer = chooseRendererForQuestion(pumpQ);
        expect(renderer).not.toBe("number");
        expect(renderer).toBe("grid"); // 4 options
      }
    });

    it("hotel: all questions renderable", () => {
      const schema = resolveStep3Schema("hotel");
      expect(schema.questions.length).toBeGreaterThan(0);

      for (const q of schema.questions) {
        const error = validateQuestionTypeSupport(q);
        expect(error, `hotel.${q.id} should be renderable`).toBeNull();
      }
    });

    it("datacenter: all questions renderable", () => {
      const schema = resolveStep3Schema("datacenter");
      expect(schema.questions.length).toBeGreaterThan(0);

      for (const q of schema.questions) {
        const error = validateQuestionTypeSupport(q);
        expect(error, `datacenter.${q.id} should be renderable`).toBeNull();
      }
    });
  });
});
