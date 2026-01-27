/**
 * TEMPLATE VALIDATOR
 * ==================
 *
 * Created: January 26, 2026
 * Purpose: Validate industry templates against calculator contracts
 *
 * ENFORCES:
 * 1. Schema version: "industry-template-v1"
 * 2. Calculator ID match: template.calculator.id === contract.id
 * 3. Question count: 16-18 questions (NEVER ship 6 questions again)
 * 4. Question IDs unique: No duplicates
 * 5. Mapping refs exist: All mapping.from reference real question.id
 * 6. Required inputs mapped: All calculator.requiredInputs have mapping rules
 * 7. Template requiredInputs match: template.calculator.requiredInputs === contract.requiredInputs
 * 8. Required questions mapped: Required questions should map to something (soft warning)
 *
 * USAGE:
 * ```typescript
 * const result = validateTemplateAgainstCalculator(template, calculator);
 * if (!result.ok) {
 *   throw new Error(result.issues.map(i => i.message).join(" | "));
 * }
 * ```
 */

import type { CalculatorContract } from "../calculators/contract";
import type { IndustryTemplateV1 } from "./types";

export type TemplateValidationIssue = {
  /** Severity: error blocks template usage, warn is advisory */
  level: "error" | "warn";

  /** Machine-readable code (for filtering/grouping) */
  code: string;

  /** Human-readable message */
  message: string;
};

export type TemplateValidationResult = {
  /** True if no errors (warnings allowed) */
  ok: boolean;

  /** List of validation issues */
  issues: TemplateValidationIssue[];
};

/**
 * Validate industry template against calculator contract
 *
 * @param template - Industry template to validate
 * @param calculator - Calculator contract (from registry)
 * @param opts - Optional validation constraints
 * @returns Validation result with ok flag + issues
 *
 * STRICT MODE (default):
 * - minQuestions: 16 (data centers must never ship with 6 questions again)
 * - maxQuestions: 18 (upper bound for usability)
 * - Hard fail on errors, warnings are advisory
 *
 * CUSTOM MODE:
 * - Override minQuestions/maxQuestions for special cases
 * - Example: Small verticals could use 12-16 questions
 */
export function validateTemplateAgainstCalculator(
  template: IndustryTemplateV1,
  calculator: CalculatorContract,
  opts?: { minQuestions?: number; maxQuestions?: number }
): TemplateValidationResult {
  const issues: TemplateValidationIssue[] = [];
  const minQ = opts?.minQuestions ?? 16;
  const maxQ = opts?.maxQuestions ?? 18;

  // ========== ERROR CHECKS (block template usage) ==========

  // 0) Schema sanity
  if (template.schema !== "industry-template-v1") {
    issues.push({
      level: "error",
      code: "bad_schema",
      message: `Template schema must be "industry-template-v1", found "${template.schema}"`,
    });
  }

  // 1) Calculator ID must match
  if (template.calculator.id !== calculator.id) {
    issues.push({
      level: "error",
      code: "calculator_id_mismatch",
      message: `Template calculator.id (${template.calculator.id}) does not match contract id (${calculator.id})`,
    });
  }

  // 2) Question count (DC must never ship with 6 questions again)
  if (template.questions.length < minQ || template.questions.length > maxQ) {
    issues.push({
      level: "error",
      code: "question_count",
      message: `Template must have ${minQ}-${maxQ} questions, found ${template.questions.length}`,
    });
  }

  // 3) Question IDs unique
  const seen = new Set<string>();
  for (const q of template.questions) {
    if (seen.has(q.id)) {
      issues.push({
        level: "error",
        code: "duplicate_question_id",
        message: `Duplicate question id: ${q.id}`,
      });
    }
    seen.add(q.id);
  }

  // 4) Mapping refs must exist
  for (const [inputKey, rule] of Object.entries(template.mapping)) {
    if (!seen.has(rule.from)) {
      issues.push({
        level: "error",
        code: "mapping_missing_question",
        message: `Mapping for "${inputKey}" references missing question id "${rule.from}"`,
      });
    }
  }

  // 5) Required inputs must be mapped
  const mappedKeys = new Set(Object.keys(template.mapping));
  for (const req of calculator.requiredInputs) {
    if (!mappedKeys.has(req)) {
      issues.push({
        level: "error",
        code: "missing_required_input_mapping",
        message: `Missing mapping for required calculator input "${req}"`,
      });
    }
  }

  // ========== WARNING CHECKS (advisory, not blocking) ==========

  // 6) Template declares requiredInputs — must match calculator requiredInputs (set equality)
  const tReq = new Set(template.calculator.requiredInputs);
  const cReq = new Set(calculator.requiredInputs);

  for (const k of cReq) {
    if (!tReq.has(k)) {
      issues.push({
        level: "warn",
        code: "template_requiredInputs_missing",
        message: `Template missing requiredInputs key "${k}" (contract expects it)`,
      });
    }
  }
  for (const k of tReq) {
    if (!cReq.has(k)) {
      issues.push({
        level: "warn",
        code: "template_requiredInputs_extra",
        message: `Template declares extra requiredInputs key "${k}" (not in contract)`,
      });
    }
  }

  // 7) Required questions should be mapped somewhere (soft guard)
  const mappedFrom = new Set(Object.values(template.mapping).map((r) => r.from));
  for (const q of template.questions) {
    if (q.required && !mappedFrom.has(q.id)) {
      issues.push({
        level: "warn",
        code: "required_question_not_mapped",
        message: `Required question "${q.id}" is not mapped to any calculator input (may be unused)`,
      });
    }
  }

  // Determine success: ok if no errors (warnings allowed)
  const ok = !issues.some((i) => i.level === "error");

  return { ok, issues };
}
