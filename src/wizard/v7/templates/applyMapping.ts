/**
 * TEMPLATE MAPPING APPLICATION
 * =============================
 *
 * Created: January 26, 2026
 * Purpose: Apply template mapping rules to convert answers → calculator inputs
 *
 * FLOW:
 * 1. User answers questions (question.id → answer value)
 * 2. Template declares mapping (calculatorInput → { from, transform })
 * 3. applyTemplateMapping applies rules + transforms
 * 4. Result = calculator inputs ready for compute()
 *
 * DESIGN:
 * - One-to-one: Each calculator input mapped to exactly one question
 * - Optional transforms: ifDemandChargeElseZero, toNumber, etc.
 * - Question metadata: Available to transforms for validation hints
 * - Type safety: Returns Record<string, unknown> (validators downstream)
 */

import { devWarn } from '../debug/devLog';

import type { IndustryTemplateV1, TemplateQuestion } from "./types";
import { TRANSFORMS } from "./transforms";

/**
 * Apply template mapping rules to user answers
 *
 * @param template - Industry template with questions + mapping
 * @param answers - User answers (question.id → value)
 * @returns Calculator inputs (calculatorInputKey → transformed value)
 *
 * EXAMPLE:
 * ```typescript
 * const template = { ... }; // data_center.v1.json
 * const answers = { it_load_kw: 500, demand_charge: false, demand_charge_rate: 25 };
 * const inputs = applyTemplateMapping(template, answers);
 * // inputs = { it_load_kw: 500, demand_charge_rate: 0, ... }
 * ```
 */
export function applyTemplateMapping(
  template: IndustryTemplateV1,
  answers: Record<string, unknown>
): Record<string, unknown> {
  // Build question lookup for metadata access
  const qById = new Map<string, TemplateQuestion>();
  for (const q of template.questions) {
    qById.set(q.id, q);
  }

  const inputs: Record<string, unknown> = {};

  // Apply each mapping rule
  for (const [inputKey, rule] of Object.entries(template.mapping)) {
    const raw = answers[rule.from];
    const question = qById.get(rule.from);

    // Apply transform if specified
    if (rule.transform) {
      const fn = TRANSFORMS[rule.transform];
      if (fn) {
        inputs[inputKey] = fn(raw, { answers, question });
      } else {
        // Unknown transform - log warning and use raw value
        devWarn(`[applyMapping] Unknown transform: ${rule.transform} for input ${inputKey}`);
        inputs[inputKey] = raw;
      }
    } else {
      // No transform - direct passthrough
      inputs[inputKey] = raw;
    }
  }

  return inputs;
}
