/**
 * Expression Hooks
 * ================
 * 
 * Hooks that consume lifeSignals and return expression props.
 * These are the ONLY bridge between SSOT state and UI presentation.
 * 
 * DOCTRINE:
 * "Expression must be justified by internal truth."
 */

import { useMemo } from "react";
import type { WizardV7LifeSignals } from "../hooks/useWizardV7";
import type {
  FieldExpressionProps,
  PhaseExpressionProps,
  ConfidenceExpressionProps,
  ExpressionProps,
  FieldCertainty,
} from "./types";

/**
 * useFieldExpression
 * 
 * Get expression props for a single field.
 * 
 * @param lifeSignals - The lifeSignals from useWizardV7
 * @param fieldId - The question ID
 * @returns FieldExpressionProps for the field
 * 
 * @example
 * const expression = useFieldExpression(lifeSignals, "room_count");
 * // expression.certainty: "certain" | "observed" | "assumed" | "unknown"
 * // expression.attribution: "From utility data for your area" | null
 */
export function useFieldExpression(
  lifeSignals: WizardV7LifeSignals,
  fieldId: string
): FieldExpressionProps {
  return useMemo(() => {
    const certainty: FieldCertainty = lifeSignals.getFieldCertainty(fieldId);
    const attribution = lifeSignals.getFieldAttribution(fieldId);
    // O(1) lookups via Set-backed helpers
    const isUncertain = lifeSignals.isFieldUncertain(fieldId);
    const wasUserCorrected = lifeSignals.isFieldUserCorrected(fieldId);

    return {
      certainty,
      attribution,
      isUncertain,
      wasUserCorrected,
    };
  }, [
    lifeSignals.getFieldCertainty,
    lifeSignals.getFieldAttribution,
    lifeSignals.isFieldUncertain,
    lifeSignals.isFieldUserCorrected,
    fieldId,
  ]);
}

/**
 * usePhaseExpression
 * 
 * Get expression props for system phase.
 * 
 * @param lifeSignals - The lifeSignals from useWizardV7
 * @returns PhaseExpressionProps
 * 
 * @example
 * const phase = usePhaseExpression(lifeSignals);
 * if (phase.isObserving) {
 *   // Show loading state
 * }
 */
export function usePhaseExpression(
  lifeSignals: WizardV7LifeSignals
): PhaseExpressionProps {
  return useMemo(() => ({
    phase: lifeSignals.phase,
    isObserving: lifeSignals.isObserving,
    isActive: lifeSignals.isActive,
    isProcessing: lifeSignals.isProcessing,
    isComplete: lifeSignals.isComplete,
  }), [
    lifeSignals.phase,
    lifeSignals.isObserving,
    lifeSignals.isActive,
    lifeSignals.isProcessing,
    lifeSignals.isComplete,
  ]);
}

/**
 * useConfidenceExpression
 * 
 * Get expression props for confidence display.
 * 
 * @param lifeSignals - The lifeSignals from useWizardV7
 * @returns ConfidenceExpressionProps
 * 
 * @example
 * const confidence = useConfidenceExpression(lifeSignals);
 * // confidence.confidence: 0.85
 * // confidence.humility: 0.15
 * // confidence.readiness: 0.9
 */
export function useConfidenceExpression(
  lifeSignals: WizardV7LifeSignals
): ConfidenceExpressionProps {
  return useMemo(() => ({
    confidence: lifeSignals.confidence,
    humility: lifeSignals.humility,
    readiness: lifeSignals.readiness,
    groundedCount: lifeSignals.groundedCount,
    assumedCount: lifeSignals.assumedCount,
    completeness: lifeSignals.completeness,
  }), [
    lifeSignals.confidence,
    lifeSignals.humility,
    lifeSignals.readiness,
    lifeSignals.groundedCount,
    lifeSignals.assumedCount,
    lifeSignals.completeness,
  ]);
}

/**
 * useExpression
 * 
 * Get all expression props at once.
 * Use when component needs full expression capability.
 * 
 * @param lifeSignals - The lifeSignals from useWizardV7
 * @returns ExpressionProps
 * 
 * @example
 * const expression = useExpression(lifeSignals);
 * // Full access to all expression properties
 */
export function useExpression(
  lifeSignals: WizardV7LifeSignals
): ExpressionProps {
  return useMemo(() => ({
    // Phase
    phase: lifeSignals.phase,
    isObserving: lifeSignals.isObserving,
    isActive: lifeSignals.isActive,
    isProcessing: lifeSignals.isProcessing,
    isComplete: lifeSignals.isComplete,
    
    // Confidence
    confidence: lifeSignals.confidence,
    humility: lifeSignals.humility,
    readiness: lifeSignals.readiness,
    groundedCount: lifeSignals.groundedCount,
    assumedCount: lifeSignals.assumedCount,
    completeness: lifeSignals.completeness,
    
    // Learning
    hasLearned: lifeSignals.hasLearned,
    sourceBreakdown: lifeSignals.sourceBreakdown,
    
    // Helpers
    getFieldCertainty: lifeSignals.getFieldCertainty,
    getFieldAttribution: lifeSignals.getFieldAttribution,
  }), [
    lifeSignals.phase,
    lifeSignals.isObserving,
    lifeSignals.isActive,
    lifeSignals.isProcessing,
    lifeSignals.isComplete,
    lifeSignals.confidence,
    lifeSignals.humility,
    lifeSignals.readiness,
    lifeSignals.groundedCount,
    lifeSignals.assumedCount,
    lifeSignals.completeness,
    lifeSignals.hasLearned,
    lifeSignals.sourceBreakdown,
    lifeSignals.getFieldCertainty,
    lifeSignals.getFieldAttribution,
  ]);
}

/**
 * useFieldAttributions
 * 
 * Get attribution text for multiple fields at once.
 * Useful for rendering a list of "where did this come from?" tooltips.
 * 
 * @param lifeSignals - The lifeSignals from useWizardV7
 * @param fieldIds - Array of field IDs
 * @returns Map of fieldId → attribution string
 */
export function useFieldAttributions(
  lifeSignals: WizardV7LifeSignals,
  fieldIds: string[]
): Map<string, string | null> {
  return useMemo(() => {
    const map = new Map<string, string | null>();
    for (const id of fieldIds) {
      map.set(id, lifeSignals.getFieldAttribution(id));
    }
    return map;
  }, [lifeSignals.getFieldAttribution, fieldIds]);
}

/**
 * useSourceSummary
 * 
 * Get a human-readable summary of value sources.
 * 
 * @param lifeSignals - The lifeSignals from useWizardV7
 * @returns Object with counts and labels
 * 
 * @example
 * const summary = useSourceSummary(lifeSignals);
 * // summary.label: "12 values: 8 confirmed, 4 assumed"
 */
export function useSourceSummary(
  lifeSignals: WizardV7LifeSignals
): { label: string; groundedLabel: string; assumedLabel: string } {
  return useMemo(() => {
    const { groundedCount, assumedCount, sourceBreakdown } = lifeSignals;
    const total = groundedCount + assumedCount;
    
    // Build descriptive labels
    const groundedParts: string[] = [];
    if (sourceBreakdown.user > 0) {
      groundedParts.push(`${sourceBreakdown.user} you entered`);
    }
    if (sourceBreakdown.location_intel > 0) {
      groundedParts.push(`${sourceBreakdown.location_intel} from your area`);
    }
    if (sourceBreakdown.business_detection > 0) {
      groundedParts.push(`${sourceBreakdown.business_detection} from business profile`);
    }
    
    const assumedParts: string[] = [];
    if (sourceBreakdown.template_default > 0) {
      assumedParts.push(`${sourceBreakdown.template_default} industry typical`);
    }
    if (sourceBreakdown.question_default > 0) {
      assumedParts.push(`${sourceBreakdown.question_default} standard`);
    }
    
    const groundedLabel = groundedParts.length > 0 
      ? groundedParts.join(", ") 
      : "none confirmed";
    
    const assumedLabel = assumedParts.length > 0
      ? assumedParts.join(", ")
      : "none assumed";
    
    const label = total === 0
      ? "No values yet"
      : `${total} values: ${groundedCount} grounded, ${assumedCount} assumed`;
    
    return { label, groundedLabel, assumedLabel };
  }, [
    lifeSignals.groundedCount,
    lifeSignals.assumedCount,
    lifeSignals.sourceBreakdown,
  ]);
}
