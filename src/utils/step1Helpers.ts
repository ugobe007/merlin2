/**
 * Step 1 Helper Functions
 * Utility functions for Step 1 Location & Goals
 */

export type SolarRating = "A" | "B" | "C" | "D" | "F";

/**
 * Calculate solar rating from peak sun hours
 *
 * Peak Sun Hours → Solar Rating conversion:
 * A (Excellent): ≥ 5.5 hours - Outstanding solar potential
 * B (Good):      ≥ 4.5 hours - Good solar potential
 * C (Average):   ≥ 4.0 hours - Moderate solar potential
 * D (Below Avg): ≥ 3.5 hours - Below average solar potential
 * F (Poor):      < 3.5 hours - Poor solar potential
 */
export function getSolarRatingFromSunHours(sunHours: number | null | undefined): SolarRating {
  if (!sunHours || sunHours < 0) return "F";
  if (sunHours >= 5.5) return "A";
  if (sunHours >= 4.5) return "B";
  if (sunHours >= 4.0) return "C";
  if (sunHours >= 3.5) return "D";
  return "F";
}

/**
 * Get rating description text
 */
export function getRatingDescription(rating: SolarRating | string): string {
  const descriptions: Record<string, string> = {
    A: "Excellent",
    B: "Good",
    C: "Average",
    D: "Below Avg",
    F: "Poor",
  };
  return descriptions[rating] || "N/A";
}

/**
 * Format electricity rate with currency symbol
 */
export function formatElectricityRate(rate: number | null, currencySymbol: string = "$"): string {
  if (!rate) return "N/A";
  return `${currencySymbol}${rate.toFixed(3)}/kWh`;
}

/**
 * Format sun hours
 */
export function formatSunHours(hours: number | null): string {
  if (!hours) return "N/A";
  return `${hours.toFixed(1)} hrs/day`;
}
