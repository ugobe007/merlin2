/**
 * Grid Stress Calculation Logic
 *
 * Helper function to calculate grid stress from state/region data.
 *
 * TODO: Replace with real API integration (EIA, FERC, ISO/RTO outage data)
 *
 * For now, uses mock rules:
 * - California, Texas: High stress (grid challenges well-documented)
 * - Northeast, Midwest: Medium stress (aging infrastructure)
 * - Southeast, Northwest: Low stress (newer grids, lower demand)
 */

export function calculateGridStress(state: string): {
  stressLevel: "low" | "medium" | "high";
  confidence: number;
} {
  const stateUpper = state.toUpperCase();

  // High stress states (documented grid issues)
  const highStressStates = ["CA", "TX", "NY"];
  if (highStressStates.includes(stateUpper)) {
    return { stressLevel: "high", confidence: 0.85 };
  }

  // Medium stress states (aging infrastructure, moderate demand)
  const mediumStressStates = ["MA", "CT", "RI", "NJ", "PA", "OH", "MI", "IL", "IN", "WI"];
  if (mediumStressStates.includes(stateUpper)) {
    return { stressLevel: "medium", confidence: 0.78 };
  }

  // Low stress (default)
  return { stressLevel: "low", confidence: 0.72 };
}
