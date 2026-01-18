// Goal Suggestion Service (SSOT for goal auto-suggestion)
// Created: January 18, 2026
// Purpose: Auto-suggest 2-3 goals based on ZIP, industry, and climate
// TrueQuote™ Compliance: All suggestions include source attribution

import { supabase } from "@/services/supabaseClient";
import type {
  GoalSuggestion,
  GoalSuggestionInput,
  GoalSuggestionRuleDB,
  IntelligenceServiceResponse,
} from "@/types/intelligence.types";
import { GOAL_ID_TO_NAME } from "@/types/intelligence.types";

/**
 * Suggest 2-3 goals based on industry, climate risk, and grid stress
 * Returns goals ordered by confidence (highest first)
 *
 * @param input - ZIP code, industry slug, climate risk, optional grid stress
 * @returns Promise<IntelligenceServiceResponse<GoalSuggestion[]>>
 */
export async function suggestGoals(
  input: GoalSuggestionInput
): Promise<IntelligenceServiceResponse<GoalSuggestion[]>> {
  try {
    // Query database for matching rules
    let query = supabase
      .from("goal_suggestion_rules")
      .select("*")
      .eq("industry_slug", input.industrySlug)
      .eq("climate_risk", input.climateRisk)
      .eq("active", true);

    // Optional: filter by grid stress if provided
    if (input.gridStress) {
      query = query.or(`grid_stress.eq.${input.gridStress},grid_stress.is.null`);
    }

    const { data, error } = await query.order("confidence", { ascending: false }).limit(3);

    if (error) {
      console.error("[goalSuggestion] Database query failed:", error);
      return {
        success: false,
        data: null,
        error: error.message,
        fallbackUsed: true,
      };
    }

    // No rules found - use fallback
    if (!data || data.length === 0) {
      console.warn(
        `[goalSuggestion] No rules found for ${input.industrySlug} + ${input.climateRisk}`
      );
      const fallback = getDefaultGoals(input.industrySlug);
      return {
        success: true,
        data: fallback,
        fallbackUsed: true,
      };
    }

    // Map database rules to GoalSuggestion format
    const suggestions: GoalSuggestion[] = [];

    for (const rule of data as GoalSuggestionRuleDB[]) {
      // Extract first 3 goals from suggested_goals array
      for (const goalId of rule.suggested_goals.slice(0, 3)) {
        // Avoid duplicates
        if (suggestions.find((s) => s.goalId === goalId)) continue;

        suggestions.push({
          goalId,
          goalName: GOAL_ID_TO_NAME[goalId] || formatGoalName(goalId),
          confidence: rule.confidence,
          rationale: rule.rationale,
          source: rule.source,
        });

        // Stop at 3 goals
        if (suggestions.length >= 3) break;
      }

      if (suggestions.length >= 3) break;
    }

    return {
      success: true,
      data: suggestions,
      fallbackUsed: false,
    };
  } catch (err) {
    console.error("[goalSuggestion] Unexpected error:", err);
    return {
      success: false,
      data: null,
      error: err instanceof Error ? err.message : "Unknown error",
      fallbackUsed: true,
    };
  }
}

/**
 * Fallback goals when database query fails or no rules exist
 * Returns industry-appropriate defaults with lower confidence
 */
function getDefaultGoals(industrySlug: string): GoalSuggestion[] {
  // Default goal sets by industry
  const defaultsByIndustry: Record<string, string[]> = {
    "car-wash": ["energy_cost_reduction", "peak_demand_control"],
    hotel: ["outage_resilience", "energy_cost_reduction"],
    hospital: ["backup_power", "outage_resilience"],
    "data-center": ["outage_resilience", "peak_demand_control"],
    office: ["energy_cost_reduction", "demand_response"],
    manufacturing: ["peak_demand_control", "demand_response"],
    warehouse: ["energy_cost_reduction", "peak_demand_control"],
    "ev-charging": ["peak_demand_control", "renewable_integration"],
  };

  // Universal fallback if industry not recognized
  const defaultGoals = defaultsByIndustry[industrySlug] || [
    "energy_cost_reduction",
    "peak_demand_control",
  ];

  return defaultGoals.map((goalId) => ({
    goalId,
    goalName: GOAL_ID_TO_NAME[goalId] || formatGoalName(goalId),
    confidence: 0.7, // Lower confidence for fallback
    rationale: "Default suggestion based on industry profile",
    source: "Merlin Default Rules (fallback)",
  }));
}

/**
 * Format goal ID to human-readable name
 * Converts 'energy_cost_reduction' → 'Energy Cost Reduction'
 */
function formatGoalName(goalId: string): string {
  return goalId
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Quick estimate for UI preview (before full data available)
 * Returns generic goals without database query
 */
export function estimateGoals(industrySlug: string): GoalSuggestion[] {
  return getDefaultGoals(industrySlug);
}
