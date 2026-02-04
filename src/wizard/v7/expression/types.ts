/**
 * Expression Types
 * ================
 * 
 * Types for the expression layer.
 * These define the contract between lifeSignals and visual presentation.
 */

import type { WizardV7LifeSignals } from "../hooks/useWizardV7";

/**
 * Certainty level for a field.
 * Maps directly to lifeSignals.getFieldCertainty()
 */
export type FieldCertainty = "certain" | "observed" | "assumed" | "unknown";

/**
 * Visual weight derived from certainty.
 * - certain: full weight (user confirmed)
 * - observed: medium weight (detected from environment)
 * - assumed: light weight (template default)
 * - unknown: minimal weight (no value)
 */
export type VisualWeight = "heavy" | "medium" | "light" | "ghost";

/**
 * FSM phase for UI presentation.
 * Maps directly to lifeSignals.phase
 */
export type Phase = 
  | "idle"
  | "template_loading"
  | "template_ready"
  | "defaults_applying"
  | "part_active"
  | "validating"
  | "quote_generating"
  | "complete"
  | "error";

/**
 * Field expression props.
 * What a field renderer needs to express its state.
 */
export interface FieldExpressionProps {
  /** Certainty level (from lifeSignals.getFieldCertainty) */
  certainty: FieldCertainty;
  
  /** Attribution text (from lifeSignals.getFieldAttribution) */
  attribution: string | null;
  
  /** Is this field in the uncertain list? */
  isUncertain: boolean;
  
  /** Did user correct this field? (from userCorrections) */
  wasUserCorrected: boolean;
}

/**
 * Phase expression props.
 * What the phase indicator needs to show system state.
 */
export interface PhaseExpressionProps {
  /** Current phase */
  phase: Phase;
  
  /** Is system observing (loading/applying)? */
  isObserving: boolean;
  
  /** Is system active (user working)? */
  isActive: boolean;
  
  /** Is system processing (generating quote)? */
  isProcessing: boolean;
  
  /** Is system complete? */
  isComplete: boolean;
}

/**
 * Confidence expression props.
 * What the confidence indicator needs.
 */
export interface ConfidenceExpressionProps {
  /** 0-1: weighted confidence score */
  confidence: number;
  
  /** 0-1: inverse of confidence */
  humility: number;
  
  /** 0-1: readiness to generate quote */
  readiness: number;
  
  /** Count of grounded fields (user + location_intel) */
  groundedCount: number;
  
  /** Count of assumed fields (defaults) */
  assumedCount: number;
  
  /** 0-1: how complete is the questionnaire? */
  completeness: number;
}

/**
 * Full expression props.
 * Everything needed for complete expression.
 */
export interface ExpressionProps extends PhaseExpressionProps, ConfidenceExpressionProps {
  /** Has the user taught us something (corrected a default)? */
  hasLearned: boolean;
  
  /** Source breakdown by type */
  sourceBreakdown: WizardV7LifeSignals["sourceBreakdown"];
  
  /** Helper to get field certainty */
  getFieldCertainty: WizardV7LifeSignals["getFieldCertainty"];
  
  /** Helper to get field attribution */
  getFieldAttribution: WizardV7LifeSignals["getFieldAttribution"];
}

/**
 * Map certainty to visual weight.
 * Pure function — no side effects, no state.
 */
export function certaintyToWeight(certainty: FieldCertainty): VisualWeight {
  switch (certainty) {
    case "certain": return "heavy";
    case "observed": return "medium";
    case "assumed": return "light";
    case "unknown": return "ghost";
  }
}

/**
 * Map confidence (0-1) to visual intensity.
 * Returns a value 0-100 for CSS variables.
 */
export function confidenceToIntensity(confidence: number): number {
  // Clamp to 0-1
  const c = Math.max(0, Math.min(1, confidence));
  // Map to 30-100 (never fully transparent)
  return Math.round(30 + c * 70);
}

/**
 * Map humility (0-1) to border softness.
 * Higher humility = softer borders.
 */
export function humilityToSoftness(humility: number): "sharp" | "soft" | "diffuse" {
  if (humility < 0.3) return "sharp";
  if (humility < 0.6) return "soft";
  return "diffuse";
}
