/**
 * Step 3 Renderer Selection Logic
 *
 * Determines which UI renderer to use based on question type and option count.
 * Extracted to prevent "option count boundary" regressions.
 *
 * Created: February 9, 2026
 */

import type { CuratedField } from "@/wizard/v7/schema/curatedFieldsResolver";

/**
 * Renderer types for Step 3 questions
 */
export type RendererType =
  | "grid"
  | "compact_grid"
  | "select"
  | "number"
  | "slider"
  | "toggle"
  | "text"
  | "multiselect";

/**
 * Normalize field type to canonical renderer type
 *
 * Maps all custom/legacy type names to standard renderer types.
 * This is the SSOT for type → renderer mapping.
 */
export function normalizeFieldType(t?: string): string {
  const x = (t || "").toLowerCase();

  // Map all custom types to canonical renderer types
  if (x === "multi-select") return "multiselect";
  if (x === "dropdown") return "select";
  if (x === "radio") return "buttons";
  if (x === "boolean" || x === "yesno" || x === "switch") return "toggle";
  if (x === "range") return "slider";

  // ⚠️ Car wash/hotel/EV custom types → standard renderers
  if (x === "conditional_buttons") return "buttons";
  if (x === "type_then_quantity") return "buttons"; // FIX: Has options → show as buttons (not number)
  if (x === "increment_box") return "number";
  if (x === "hours_grid") return "buttons"; // Hour grid → button selection
  if (x === "existing_then_planned") return "number"; // Existing + planned → simplified to number input
  if (x === "auto_confirm") return "toggle";
  if (x === "range_buttons") return "buttons"; // Range selection (e.g., "100-250 rooms")
  if (x === "wheel") return "select"; // Wheel picker → dropdown
  if (x === "multiselect") return "multiselect"; // Multi-select → checkbox list (NOT buttons)
  if (x === "number_input") return "number";

  // Fallback with dev warning
  if (
    import.meta.env.DEV &&
    !["text", "number", "select", "buttons", "toggle", "slider", "multiselect"].includes(x)
  ) {
    console.warn(`[Step3Curated] Unknown field type "${t}" → using "text". Add mapping if needed.`);
  }

  return x || "text";
}

/**
 * Choose renderer for a question based on type and option count
 *
 * RENDERING LOGIC:
 * - 1-6 options:   2-column grid with icons/descriptions
 * - 7-18 options:  4-7 column compact grid (no descriptions)
 * - 19+ options:   Select dropdown
 *
 * NON-BUTTON TYPES: Pass through (number, slider, toggle, text)
 *
 * @param question - Curated field definition
 * @returns Renderer type to use
 */
export function chooseRendererForQuestion(question: CuratedField): RendererType {
  const baseType = normalizeFieldType(question.type);
  const optionCount = question.options?.length ?? 0;

  // Multiselect always renders as checkboxes (not affected by count)
  if (baseType === "multiselect") {
    return "multiselect";
  }

  // Non-button types pass through
  if (baseType !== "buttons" && baseType !== "select") {
    return baseType as RendererType;
  }

  // Button/select logic based on option count
  if (baseType === "buttons" || baseType === "select") {
    if (optionCount === 0) return "text"; // Fallback for missing options
    if (optionCount <= 6) return "grid";
    if (optionCount <= 18) return "compact_grid";
    return "select";
  }

  return "text"; // Final fallback
}

/**
 * Get all supported renderer types
 * Used by contract tests to validate schema coverage
 */
export function getSupportedRendererTypes(): readonly RendererType[] {
  return [
    "grid",
    "compact_grid",
    "select",
    "number",
    "slider",
    "toggle",
    "text",
    "multiselect",
  ] as const;
}

/**
 * Validate that a question type maps to a supported renderer
 * Returns error message if invalid, null if valid
 */
export function validateQuestionTypeSupport(question: CuratedField): string | null {
  const renderer = chooseRendererForQuestion(question);
  const supported = getSupportedRendererTypes();

  if (!supported.includes(renderer)) {
    return `Question type "${question.type}" maps to unsupported renderer "${renderer}"`;
  }

  // Additional validation: type_then_quantity should never map to "number"
  if (question.type?.toLowerCase() === "type_then_quantity" && renderer === "number") {
    return `type_then_quantity incorrectly mapped to "number" renderer (should be "grid" or "compact_grid" with options)`;
  }

  return null;
}
