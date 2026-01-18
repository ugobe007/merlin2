// Intelligence Layer Types
// Created: January 18, 2026
// Purpose: Type definitions for adaptive UX intelligence services
// SSOT Compliance: All types include TrueQuote™ source attribution

// ============================================================================
// GOAL SUGGESTION TYPES
// ============================================================================

export interface GoalSuggestion {
  goalId: string; // Matches wizard goal options: 'energy_cost_reduction', 'peak_demand_control', etc.
  goalName: string; // Human-readable: "Energy Cost Reduction"
  confidence: number; // 0.00 to 1.00
  rationale: string; // Why this goal? (shown to user)
  source: string; // TrueQuote™ source attribution
}

export interface GoalSuggestionInput {
  zipCode: string;
  industrySlug: string;
  climateRisk: string; // 'extreme_heat', 'hurricane', 'extreme_cold', etc.
  gridStress?: string; // 'congested', 'stable', 'unreliable'
}

// ============================================================================
// INDUSTRY INFERENCE TYPES
// ============================================================================

export interface IndustryInference {
  industrySlug: string; // Matches use_cases.slug
  industryName: string; // Human-readable: "Hotel & Hospitality"
  confidence: number; // 0.00 to 1.00
  matchedKeywords: string[]; // Keywords that triggered inference
}

export interface IndustryInferenceInput {
  businessName: string;
}

// ============================================================================
// WEATHER IMPACT TYPES
// ============================================================================

export interface WeatherImpact {
  riskType: string; // 'extreme_heat', 'hurricane', 'extreme_cold', etc.
  impactMetric: string; // 'demand_charge_increase_pct', 'outage_hours_avg_year', etc.
  impactRange: {
    min: number;
    max: number;
  };
  unit: string; // '%', 'hours', '$'
  impactDescription: string; // "Extreme heat increases demand charges by ~18–25%"
  whyItMatters: string; // Micro-line: "Higher peak demand during heatwaves drives utility charges"
  source: string; // TrueQuote™ source attribution
}

export interface WeatherImpactInput {
  weatherRisk: string; // 'extreme_heat', 'hurricane', etc.
  industrySlug: string;
}

// ============================================================================
// VALUE TEASER TYPES
// ============================================================================

export interface ValueTeaserMetric {
  metricName: string; // 'demand_charge_reduction_pct', 'backup_hours_typical', etc.
  valueRange: {
    min: number;
    max: number;
  };
  unit: string; // '%', 'hours', 'years', '$'
  displayText: string; // Pre-formatted: "15–30% demand charge reduction"
  confidence: "high" | "medium" | "low";
  sampleSize: number; // Number of projects in benchmark (credibility indicator)
  source: string; // TrueQuote™ source attribution
}

export interface ValueTeaserInput {
  zipCode: string;
  state: string; // 2-letter state code
  industrySlug: string;
  climateProfile?: string;
}

// ============================================================================
// DATABASE SCHEMA INTERFACES (for direct queries)
// ============================================================================

export interface GoalSuggestionRuleDB {
  id: string;
  industry_slug: string;
  climate_risk: string;
  grid_stress: string | null;
  suggested_goals: string[];
  confidence: number;
  rationale: string;
  source: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PeerBenchmarkDB {
  id: string;
  industry_slug: string;
  state: string;
  metric_name: string;
  value_min: number;
  value_max: number;
  unit: string;
  sample_size: number;
  confidence: "high" | "medium" | "low";
  display_text: string;
  source: string;
  active: boolean;
  last_updated: string;
  created_at: string;
}

export interface WeatherImpactCoefficientDB {
  id: string;
  weather_risk_type: string;
  industry_slug: string | null;
  impact_metric: string;
  impact_min: number;
  impact_max: number;
  unit: string;
  impact_description: string;
  why_it_matters: string;
  source: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface IndustryKeywordMappingDB {
  id: string;
  keyword: string;
  industry_slug: string;
  confidence_weight: number;
  is_exact_match: boolean;
  case_sensitive: boolean;
  active: boolean;
  created_at: string;
}

// ============================================================================
// CONTEXT EXTENSION (for AdvisorRail)
// ============================================================================

export interface IntelligenceContext {
  suggestedGoals?: GoalSuggestion[];
  inferredIndustry?: IndustryInference;
  weatherImpact?: WeatherImpact[];
  valueTeaser?: ValueTeaserMetric[];
}

// ============================================================================
// SERVICE RESPONSE TYPES
// ============================================================================

export interface IntelligenceServiceResponse<T> {
  success: boolean;
  data: T | null;
  error?: string;
  fallbackUsed?: boolean; // TRUE if database query failed and fallback data was used
}

// ============================================================================
// GOAL ID MAPPINGS (for wizard integration)
// ============================================================================

export const GOAL_ID_TO_NAME: Record<string, string> = {
  energy_cost_reduction: "Energy Cost Reduction",
  peak_demand_control: "Peak Demand Control",
  outage_resilience: "Outage Resilience",
  backup_power: "Backup Power",
  demand_response: "Demand Response Revenue",
  renewable_integration: "Renewable Integration",
  load_shifting: "Load Shifting",
  frequency_regulation: "Frequency Regulation",
  arbitrage: "Energy Arbitrage",
};

// ============================================================================
// CLIMATE RISK TYPES (standardized values)
// ============================================================================

export type ClimateRiskType =
  | "extreme_heat"
  | "hurricane"
  | "extreme_cold"
  | "wildfire"
  | "flood"
  | "tornado"
  | "none";

// ============================================================================
// GRID STRESS TYPES (standardized values)
// ============================================================================

export type GridStressType = "congested" | "stable" | "unreliable";
