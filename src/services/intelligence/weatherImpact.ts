// Weather Impact Service (SSOT for weather risk → ROI translation)
// Created: January 18, 2026
// Purpose: Convert passive weather risk to actionable metric with peer comparison
// TrueQuote™ Compliance: Database-driven coefficients with source attribution

import { supabase } from "@/services/supabaseClient";
import type {
  WeatherImpact,
  WeatherImpactInput,
  WeatherImpactCoefficientDB,
  IntelligenceServiceResponse,
} from "@/types/intelligence.types";

/**
 * Translate weather risk into actionable ROI metrics
 * Returns industry-specific or universal impact coefficients
 *
 * @param input - Weather risk type, industry slug
 * @returns Promise<IntelligenceServiceResponse<WeatherImpact[]>>
 */
export async function translateWeatherToROI(
  input: WeatherImpactInput
): Promise<IntelligenceServiceResponse<WeatherImpact[]>> {
  try {
    // Query database for matching coefficients
    // Priority: Industry-specific > Universal (NULL industry)
    const { data, error } = await supabase
      .from("weather_impact_coefficients")
      .select("*")
      .eq("weather_risk_type", input.weatherRisk)
      .eq("active", true)
      .or(`industry_slug.eq.${input.industrySlug},industry_slug.is.null`)
      .order("industry_slug", { ascending: false }); // Industry-specific first (non-null)

    if (error) {
      console.error("[weatherImpact] Database query failed:", error);
      return {
        success: false,
        data: null,
        error: error.message,
        fallbackUsed: true,
      };
    }

    if (!data || data.length === 0) {
      console.warn(`[weatherImpact] No coefficients found for ${input.weatherRisk}`);
      return {
        success: true,
        data: [], // No impact data available
        fallbackUsed: false,
      };
    }

    // Map database coefficients to WeatherImpact format
    const impacts: WeatherImpact[] = (data as WeatherImpactCoefficientDB[]).map((coeff) => ({
      riskType: coeff.weather_risk_type,
      impactMetric: coeff.impact_metric,
      impactRange: {
        min: coeff.impact_min,
        max: coeff.impact_max,
      },
      unit: coeff.unit,
      impactDescription: coeff.impact_description,
      whyItMatters: coeff.why_it_matters,
      source: coeff.source,
    }));

    return {
      success: true,
      data: impacts,
      fallbackUsed: false,
    };
  } catch (err) {
    console.error("[weatherImpact] Unexpected error:", err);
    return {
      success: false,
      data: null,
      error: err instanceof Error ? err.message : "Unknown error",
      fallbackUsed: true,
    };
  }
}

/**
 * Get primary weather impact (highest priority metric)
 * Useful for inline display in UI
 */
export async function getPrimaryWeatherImpact(
  input: WeatherImpactInput
): Promise<WeatherImpact | null> {
  const result = await translateWeatherToROI(input);

  if (!result.success || !result.data || result.data.length === 0) {
    return null;
  }

  // Return first impact (industry-specific or universal)
  return result.data[0];
}

/**
 * Quick estimate for UI preview (without database query)
 * Returns generic impact descriptions
 */
export function estimateWeatherImpact(weatherRisk: string): WeatherImpact | null {
  // Fallback impacts by risk type
  const fallbackImpacts: Record<string, Omit<WeatherImpact, "riskType">> = {
    extreme_heat: {
      impactMetric: "demand_charge_increase_pct",
      impactRange: { min: 15, max: 30 },
      unit: "%",
      impactDescription: "Extreme heat increases demand charges by ~15–30%",
      whyItMatters: "Higher peak demand during heatwaves drives utility charges",
      source: "Industry Average (estimate)",
    },
    hurricane: {
      impactMetric: "outage_hours_avg_year",
      impactRange: { min: 8, max: 36 },
      unit: "hours",
      impactDescription: "Outages average 8–36 hrs/year in hurricane zones",
      whyItMatters: "Extended outages cause revenue loss and operational disruption",
      source: "Industry Average (estimate)",
    },
    extreme_cold: {
      impactMetric: "demand_spike_pct",
      impactRange: { min: 30, max: 50 },
      unit: "%",
      impactDescription: "Extreme cold triggers 30–50% demand spikes",
      whyItMatters: "Heating load spikes can trigger high peak charges",
      source: "Industry Average (estimate)",
    },
    wildfire: {
      impactMetric: "outage_hours_avg_year",
      impactRange: { min: 6, max: 24 },
      unit: "hours",
      impactDescription: "Wildfires cause 6–24 hrs/year of power shutoffs",
      whyItMatters: "Preventive shutoffs protect grid but disrupt operations",
      source: "Industry Average (estimate)",
    },
  };

  const impact = fallbackImpacts[weatherRisk];

  if (!impact) {
    return null;
  }

  return {
    riskType: weatherRisk,
    ...impact,
  };
}

/**
 * Format weather impact for inline display
 * Example: "Extreme Heat: High" → "Extreme heat increases demand charges by ~18–25%"
 */
export function formatWeatherImpactInline(impact: WeatherImpact): string {
  const range = `${impact.impactRange.min}–${impact.impactRange.max}${impact.unit}`;
  return impact.impactDescription.replace(/~\d+–\d+%/, `~${range}`);
}
