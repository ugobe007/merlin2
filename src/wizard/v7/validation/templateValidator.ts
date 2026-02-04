/**
 * ============================================================
 * Template Validator - SSOT Contract Enforcement
 * ============================================================
 * 
 * This module validates Step 3 templates against the SSOT contract.
 * 
 * Invariants enforced:
 * 1. Template must have: industry, version, questions[]
 * 2. If calculator.id present, calculator.requiredInputs must map to questions
 * 3. If parts[] present, all questionIds must exist in questions[]
 * 4. If defaults{} present, keys must be subset of question IDs
 * 5. If mapping[] present, all mapping.from must exist in questions[].id
 * 
 * Usage:
 *   const result = validateTemplate(template);
 *   if (!result.ok) {
 *     console.warn("[SSOT] Template validation failed:", result.issues);
 *   }
 */

import type { Step3Template } from "../hooks/useWizardV7";

// ============================================================
// Types
// ============================================================

export type ValidationLevel = "error" | "warning" | "info";

export type ValidationIssue = {
  level: ValidationLevel;
  code: string;
  message: string;
  field?: string;
  expected?: unknown;
  actual?: unknown;
};

export type ValidationResult = {
  ok: boolean;
  issues: ValidationIssue[];
  summary: {
    errors: number;
    warnings: number;
    infos: number;
  };
  templateId: string | null;
  checkedAt: string;
};

// Extended template type for full contract validation
export type TemplateWithContract = Step3Template & {
  calculator?: {
    id: string;
    requiredInputs?: string[];
  };
  mapping?: Array<{
    from: string;
    to: string;
    transform?: string;
  }>;
  parts?: Array<{
    id: string;
    title: string;
    questionIds: string[];
  }>;
};

// ============================================================
// Validator
// ============================================================

/**
 * Validate a Step 3 template against SSOT contract invariants.
 * 
 * @param template - The template to validate
 * @param options - Validation options
 * @returns ValidationResult with ok status and any issues found
 */
export function validateTemplate(
  template: unknown,
  options: {
    /** Minimum questions required (default: 8) */
    minQuestions?: number;
    /** Maximum questions allowed (default: 24) */
    maxQuestions?: number;
    /** Fail on warnings (default: false) */
    strictMode?: boolean;
    /** Session ID for audit trail */
    sessionId?: string;
  } = {}
): ValidationResult {
  const {
    minQuestions = 8,
    maxQuestions = 24,
    strictMode = false,
  } = options;

  const issues: ValidationIssue[] = [];
  const now = new Date().toISOString();

  // Helper to add issues
  const addIssue = (
    level: ValidationLevel,
    code: string,
    message: string,
    details?: Partial<ValidationIssue>
  ) => {
    issues.push({ level, code, message, ...details });
  };

  // ============================================================
  // 1. Basic structure validation
  // ============================================================

  if (!template || typeof template !== "object") {
    addIssue("error", "INVALID_TEMPLATE", "Template is null or not an object");
    return {
      ok: false,
      issues,
      summary: { errors: 1, warnings: 0, infos: 0 },
      templateId: null,
      checkedAt: now,
    };
  }

  const t = template as TemplateWithContract;

  // Required fields
  if (!t.industry) {
    addIssue("error", "MISSING_INDUSTRY", "Template missing required field: industry");
  }

  if (!t.version) {
    addIssue("error", "MISSING_VERSION", "Template missing required field: version");
  }

  if (!t.questions || !Array.isArray(t.questions)) {
    addIssue("error", "MISSING_QUESTIONS", "Template missing required field: questions[]");
    return {
      ok: false,
      issues,
      summary: countIssueLevels(issues),
      templateId: t.id ?? null,
      checkedAt: now,
    };
  }

  // ============================================================
  // 2. Questions array validation
  // ============================================================

  const questionIds = new Set<string>();
  const duplicateIds: string[] = [];

  for (let i = 0; i < t.questions.length; i++) {
    const q = t.questions[i];

    if (!q.id) {
      addIssue("error", "QUESTION_MISSING_ID", `Question at index ${i} missing id`);
      continue;
    }

    if (questionIds.has(q.id)) {
      duplicateIds.push(q.id);
    }
    questionIds.add(q.id);

    if (!q.label) {
      addIssue("warning", "QUESTION_MISSING_LABEL", `Question "${q.id}" missing label`);
    }

    if (!q.type) {
      addIssue("error", "QUESTION_MISSING_TYPE", `Question "${q.id}" missing type`);
    }

    // Validate select/multiselect have options
    if ((q.type === "select" || q.type === "multiselect") && (!q.options || q.options.length === 0)) {
      addIssue("warning", "SELECT_NO_OPTIONS", `Question "${q.id}" is ${q.type} but has no options`);
    }
  }

  if (duplicateIds.length > 0) {
    addIssue("error", "DUPLICATE_QUESTION_IDS", `Duplicate question IDs: ${duplicateIds.join(", ")}`);
  }

  // Question count bounds
  if (t.questions.length < minQuestions) {
    addIssue(
      "warning",
      "TOO_FEW_QUESTIONS",
      `Template has ${t.questions.length} questions, expected at least ${minQuestions}`,
      { expected: minQuestions, actual: t.questions.length }
    );
  }

  if (t.questions.length > maxQuestions) {
    addIssue(
      "warning",
      "TOO_MANY_QUESTIONS",
      `Template has ${t.questions.length} questions, expected at most ${maxQuestions}`,
      { expected: maxQuestions, actual: t.questions.length }
    );
  }

  // ============================================================
  // 3. Calculator contract validation (if present)
  // ============================================================

  if (t.calculator) {
    if (!t.calculator.id) {
      addIssue("error", "CALCULATOR_MISSING_ID", "Calculator block present but missing id");
    }

    if (t.calculator.requiredInputs && Array.isArray(t.calculator.requiredInputs)) {
      const unmappedInputs: string[] = [];
      
      for (const input of t.calculator.requiredInputs) {
        // Check if there's a mapping or direct question for this input
        const hasDirect = questionIds.has(input);
        const hasMapping = t.mapping?.some(m => m.to === input);
        
        if (!hasDirect && !hasMapping) {
          unmappedInputs.push(input);
        }
      }

      if (unmappedInputs.length > 0) {
        addIssue(
          "error",
          "UNMAPPED_CALCULATOR_INPUTS",
          `Calculator requires inputs not mapped from questions: ${unmappedInputs.join(", ")}`
        );
      }
    }
  }

  // ============================================================
  // 4. Mapping validation (if present)
  // ============================================================

  if (t.mapping && Array.isArray(t.mapping)) {
    const invalidMappingSources: string[] = [];

    for (const m of t.mapping) {
      if (!m.from) {
        addIssue("warning", "MAPPING_MISSING_FROM", "Mapping entry missing 'from' field");
        continue;
      }

      if (!questionIds.has(m.from)) {
        invalidMappingSources.push(m.from);
      }
    }

    if (invalidMappingSources.length > 0) {
      addIssue(
        "error",
        "INVALID_MAPPING_SOURCES",
        `Mapping 'from' references non-existent questions: ${invalidMappingSources.join(", ")}`
      );
    }
  }

  // ============================================================
  // 5. Parts validation (if present)
  // ============================================================

  if (t.parts && Array.isArray(t.parts)) {
    const allPartQuestionIds = new Set<string>();
    const invalidPartQuestions: string[] = [];

    for (const part of t.parts) {
      if (!part.questionIds || !Array.isArray(part.questionIds)) {
        addIssue("warning", "PART_MISSING_QUESTION_IDS", `Part "${part.id}" missing questionIds array`);
        continue;
      }

      for (const qid of part.questionIds) {
        if (!questionIds.has(qid)) {
          invalidPartQuestions.push(`${part.id}:${qid}`);
        }
        allPartQuestionIds.add(qid);
      }
    }

    if (invalidPartQuestions.length > 0) {
      addIssue(
        "error",
        "INVALID_PART_QUESTION_IDS",
        `Parts reference non-existent questions: ${invalidPartQuestions.join(", ")}`
      );
    }

    // Check for orphaned questions (not in any part)
    const orphanedQuestions = [...questionIds].filter(qid => !allPartQuestionIds.has(qid));
    if (orphanedQuestions.length > 0) {
      addIssue(
        "info",
        "ORPHANED_QUESTIONS",
        `${orphanedQuestions.length} question(s) not assigned to any part: ${orphanedQuestions.slice(0, 5).join(", ")}${orphanedQuestions.length > 5 ? "..." : ""}`
      );
    }
  }

  // ============================================================
  // 6. Defaults validation (if present)
  // ============================================================

  if (t.defaults && typeof t.defaults === "object") {
    const invalidDefaultKeys: string[] = [];

    for (const key of Object.keys(t.defaults)) {
      if (!questionIds.has(key)) {
        invalidDefaultKeys.push(key);
      }
    }

    if (invalidDefaultKeys.length > 0) {
      addIssue(
        "warning",
        "INVALID_DEFAULT_KEYS",
        `Defaults contain keys not in questions: ${invalidDefaultKeys.join(", ")}`
      );
    }
  }

  // ============================================================
  // Build result
  // ============================================================

  const summary = countIssueLevels(issues);
  const ok = strictMode
    ? summary.errors === 0 && summary.warnings === 0
    : summary.errors === 0;

  return {
    ok,
    issues,
    summary,
    templateId: t.id ?? `${t.industry}.${t.version}`,
    checkedAt: now,
  };
}

/**
 * Count issues by level
 */
function countIssueLevels(issues: ValidationIssue[]): { errors: number; warnings: number; infos: number } {
  return {
    errors: issues.filter(i => i.level === "error").length,
    warnings: issues.filter(i => i.level === "warning").length,
    infos: issues.filter(i => i.level === "info").length,
  };
}

/**
 * Format validation result for logging
 */
export function formatValidationResult(result: ValidationResult): string {
  if (result.ok && result.issues.length === 0) {
    return `✅ Template ${result.templateId} valid`;
  }

  const lines = [
    `${result.ok ? "⚠️" : "❌"} Template ${result.templateId} validation: ${result.summary.errors} errors, ${result.summary.warnings} warnings`,
  ];

  for (const issue of result.issues) {
    const icon = issue.level === "error" ? "🔴" : issue.level === "warning" ? "🟡" : "🔵";
    lines.push(`  ${icon} [${issue.code}] ${issue.message}`);
  }

  return lines.join("\n");
}

/**
 * Quick validation check - returns true if template is valid enough to use
 */
export function isTemplateUsable(template: unknown): boolean {
  const result = validateTemplate(template);
  return result.ok;
}
