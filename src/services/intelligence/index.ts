// Intelligence Layer Services (Phase 1: Adaptive UX Foundation)
// Created: January 18, 2026
// Purpose: Centralized exports for all intelligence services
// SSOT Compliance: All services query database, include TrueQuote™ attribution

// Service exports
export { suggestGoals, estimateGoals } from "./goalSuggestion";
export { inferIndustry, estimateIndustry } from "./industryInference";
export {
  translateWeatherToROI,
  getPrimaryWeatherImpact,
  estimateWeatherImpact,
  formatWeatherImpactInline,
} from "./weatherImpact";
export {
  calculateValueTeaser,
  estimateValueTeaser,
  formatValueTeaserPanel,
} from "./valueTeaserService";

// Type exports
export type {
  GoalSuggestion,
  GoalSuggestionInput,
  IndustryInference,
  IndustryInferenceInput,
  WeatherImpact,
  WeatherImpactInput,
  ValueTeaserMetric,
  ValueTeaserInput,
  IntelligenceContext,
  IntelligenceServiceResponse,
} from "@/types/intelligence.types";
