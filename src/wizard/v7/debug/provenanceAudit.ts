/**
 * Provenance Audit Utilities
 * 
 * Debug helpers for forensic analysis of Step 3 answer sources.
 * Use in console or test harness to verify SSOT compliance.
 */

import type { Step3Answers, Step3AnswersMeta, AnswerSource } from "../hooks/useWizardV7";

/**
 * Summary of answer provenance by source
 */
export type ProvenanceAuditSummary = {
  total: number;
  bySource: Record<AnswerSource, number>;
  userEdited: string[];
  intelOverridden: string[];
  templateDefaults: string[];
  questionDefaults: string[];
  businessDetected: string[];
};

/**
 * Generate audit summary of Step 3 answer provenance
 */
export function auditProvenance(
  answers: Step3Answers,
  meta: Step3AnswersMeta
): ProvenanceAuditSummary {
  const summary: ProvenanceAuditSummary = {
    total: Object.keys(answers).length,
    bySource: {
      template_default: 0,
      question_default: 0,
      location_intel: 0,
      business_detection: 0,
      user: 0,
    },
    userEdited: [],
    intelOverridden: [],
    templateDefaults: [],
    questionDefaults: [],
    businessDetected: [],
  };

  for (const [id, m] of Object.entries(meta)) {
    if (!m) continue;

    summary.bySource[m.source]++;

    switch (m.source) {
      case "user":
        summary.userEdited.push(id);
        break;
      case "location_intel":
        summary.intelOverridden.push(id);
        break;
      case "template_default":
        summary.templateDefaults.push(id);
        break;
      case "question_default":
        summary.questionDefaults.push(id);
        break;
      case "business_detection":
        summary.businessDetected.push(id);
        break;
    }
  }

  return summary;
}

/**
 * Format provenance audit for console logging
 */
export function formatProvenanceAudit(summary: ProvenanceAuditSummary): string {
  const lines: string[] = [
    "=== PROVENANCE AUDIT ===",
    `Total answers: ${summary.total}`,
    "",
    "By Source:",
    `  template_default:   ${summary.bySource.template_default}`,
    `  question_default:   ${summary.bySource.question_default}`,
    `  location_intel:     ${summary.bySource.location_intel}`,
    `  business_detection: ${summary.bySource.business_detection}`,
    `  user:               ${summary.bySource.user}`,
    "",
  ];

  if (summary.userEdited.length > 0) {
    lines.push(`User Edited (${summary.userEdited.length}): ${summary.userEdited.join(", ")}`);
  }
  if (summary.intelOverridden.length > 0) {
    lines.push(`Intel Overridden (${summary.intelOverridden.length}): ${summary.intelOverridden.join(", ")}`);
  }
  if (summary.businessDetected.length > 0) {
    lines.push(`Business Detected (${summary.businessDetected.length}): ${summary.businessDetected.join(", ")}`);
  }

  lines.push("========================");

  return lines.join("\n");
}

/**
 * Check if a specific answer was user-edited (forensic check)
 */
export function wasUserEdited(meta: Step3AnswersMeta, questionId: string): boolean {
  return meta[questionId]?.source === "user";
}

/**
 * Get all answers that would be affected by an intel patch
 * (i.e., not user-edited)
 */
export function getIntelPatchableAnswers(
  meta: Step3AnswersMeta,
  intelFields: string[]
): string[] {
  return intelFields.filter((id) => !wasUserEdited(meta, id));
}

/**
 * Debug: attach to window for console access
 */
export function attachProvenanceDebugger(
  getState: () => { step3Answers: Step3Answers; step3AnswersMeta: Step3AnswersMeta }
): void {
  if (typeof window !== "undefined") {
    (window as unknown as Record<string, unknown>).__MERLIN_PROVENANCE__ = {
      audit: () => {
        const { step3Answers, step3AnswersMeta } = getState();
        const summary = auditProvenance(step3Answers, step3AnswersMeta);
        console.log(formatProvenanceAudit(summary));
        return summary;
      },
      raw: () => getState(),
    };

    console.log(
      "[V7 Provenance] Debug attached. Use window.__MERLIN_PROVENANCE__.audit() in console."
    );
  }
}
