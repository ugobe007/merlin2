/**
 * TEMPLATE TYPE DEFINITIONS
 * ==========================
 *
 * Created: January 26, 2026
 * Purpose: Versioned industry template schema
 *
 * DESIGN:
 * - Templates are immutable contracts (not UI configs)
 * - schema: "industry-template-v1" ensures format compatibility
 * - questions: 16-18 stable questions with unique IDs
 * - mapping: Explicit question.id → calculatorInput binding
 * - calculator: Declares id + requiredInputs (enforced by validator)
 *
 * CRITICAL:
 * - Template version must match calculator contract version
 * - All mapping.from must reference real question.id
 * - All calculator.requiredInputs must be mapped
 * - Question count: 16-18 (never ship 6 questions again)
 */

export type QuestionType = "number" | "text" | "select" | "boolean" | "multiselect";

/**
 * Option Item
 *
 * FLEXIBLE: Supports both simple strings and value/label pairs
 * USAGE: select and multiselect question types
 *
 * EXAMPLES:
 * - Simple: "economy", "midscale", "luxury"
 * - Object: { value: "economy", label: "Economy (Budget)" }
 */
export type OptionItem = string | { value: string; label: string };

/**
 * Template Question
 *
 * STABLE: id never changes (dc.v1.0.0 → dc.v1.1.0 preserves IDs)
 * VALIDATED: select/multiselect must have options
 * TYPED: UI renderer uses type + unit + min/max for input validation
 */
export type TemplateQuestion = {
  /** Stable question identifier (e.g., "it_load_kw") */
  id: string;

  /** Human-readable label shown in UI */
  label: string;

  /** Question type (determines UI component) */
  type: QuestionType;

  /** Whether question must be answered */
  required: boolean;

  /** Unit label (kW, %, minutes, etc.) */
  unit?: string;

  /** Options for select/multiselect types (string or {value,label} objects) */
  options?: OptionItem[];

  /** Minimum value for number types */
  min?: number;

  /** Maximum value for number types */
  max?: number;

  /** Help text or guidance for user */
  hint?: string;
};

/**
 * Template Mapping Rule
 *
 * BINDING: question.id → calculatorInput key
 * TRANSFORM: Optional named function (ifDemandChargeElseZero, etc.)
 * EXPLICIT: Every calculator input must have a mapping rule
 */
export type TemplateMappingRule = {
  /** Question id providing the value */
  from: string;

  /** Optional named transform function (see transforms.ts) */
  transform?: string;
};

/**
 * Industry Template V1
 *
 * SCHEMA: "industry-template-v1" ensures parser compatibility
 * VERSIONED: dc.v1.0.0 format (major.minor.patch)
 * CONTRACT: calculator.id + requiredInputs form immutable binding
 * VALIDATED: validator.ts enforces all contract rules
 */
export type IndustryTemplateV1 = {
  /** Schema version (always "industry-template-v1" for this format) */
  schema: "industry-template-v1";

  /**
   * Stable template identity (OPTIONAL but recommended)
   *
   * USAGE:
   * - Defaults keying: prevents re-applying when user switches templates
   * - Touched state: cleared when template.id changes
   * - Loader should always populate this (db id or "hotel.v1")
   *
   * EXAMPLES:
   * - DB template: "abc123-uuid"
   * - JSON template: "hotel.v1" or "data_center.v1.0.0"
   */
  id?: string;

  /** Industry slug (data_center, hotel, car_wash, etc.) */
  industry: string;

  /** Template version (semantic: major.minor.patch) */
  version: string;

  /** Calculator binding (immutable contract) */
  calculator: {
    /** Calculator id (must exist in registry.ts) */
    id: string;

    /** Required input keys (must be mapped in mapping section) */
    requiredInputs: string[];
  };

  /**
   * Parts: Logical groupings for gated questionnaire (OPTIONAL for backward compat)
   *
   * DESIGN:
   * - Step 3 renders one part at a time (part 1/4, 2/4, etc.)
   * - User must complete all required questions in current part to advance
   * - Defaults apply per-part when user enters that part
   * - "Generate Quote" only appears on final part
   *
   * BACKWARD COMPAT:
   * - If parts is missing/empty, Step3GatedV7 derives 4 parts automatically
   * - DB templates may not have parts yet - UI handles gracefully
   *
   * EXAMPLE:
   * [
   *   { id: "facility", label: "Facility Size", questionIds: ["room_count", "occupancy_avg_pct"] },
   *   { id: "systems", label: "Systems", questionIds: ["hvac_type"] }
   * ]
   */
  parts?: TemplatePart[];

  /** Questions array (16-18 questions enforced by validator) */
  questions: TemplateQuestion[];

  /**
   * Defaults: Sensible starting values for each question
   *
   * USAGE:
   * - Applied per-part when user enters that part (non-destructive)
   * - Only fills empty fields
   * - User can reset to defaults per-part
   *
   * EXAMPLE:
   * { room_count: 150, occupancy_avg_pct: 65 }
   */
  defaults?: Record<string, unknown>;

  /**
   * Mapping: calculatorInputKey → mapping rule
   *
   * EXAMPLE:
   * {
   *   it_load_kw: { from: "it_load_kw" },
   *   demand_charge_rate: { from: "demand_charge_rate", transform: "ifDemandChargeElseZero" }
   * }
   */
  mapping: Record<string, TemplateMappingRule>;
};

/**
 * Template Part
 *
 * GATING: Each part is a logical section of the questionnaire
 * PROGRESS: Part 1/4 → Part 2/4 → Part 3/4 → Part 4/4 → Generate Quote
 */
export type TemplatePart = {
  /** Unique part identifier (e.g., "facility", "systems") */
  id: string;

  /** Human-readable label shown in progress indicator */
  label: string;

  /** Optional description shown below label */
  description?: string;

  /** Question IDs that belong to this part (order preserved) */
  questionIds: string[];
};
