/**
 * Utility Rate Analysis
 * Analyzes electricity rates by state and provides intelligent recommendations
 */

export interface UtilityRateAnalysis {
  state: string;
  averageRate: number; // $/kWh
  category: "low" | "medium" | "high" | "very-high";
  recommendation: {
    title: string;
    description: string;
    action: string;
    savings: string;
    icon: string;
  };
}

// Average commercial electricity rates by state (2025 data)
// Source: EIA Commercial Average Retail Price of Electricity
const STATE_RATES: Record<string, number> = {
  Alabama: 0.102,
  Alaska: 0.182,
  Arizona: 0.098,
  Arkansas: 0.087,
  California: 0.195, // HIGH
  Colorado: 0.096,
  Connecticut: 0.168, // HIGH
  Delaware: 0.098,
  Florida: 0.093,
  Georgia: 0.098,
  Hawaii: 0.289, // VERY HIGH
  Idaho: 0.073,
  Illinois: 0.089,
  Indiana: 0.095,
  Iowa: 0.084,
  Kansas: 0.097,
  Kentucky: 0.087,
  Louisiana: 0.082,
  Maine: 0.138,
  Maryland: 0.105,
  Massachusetts: 0.176, // HIGH
  Michigan: 0.106,
  Minnesota: 0.092,
  Mississippi: 0.095,
  Missouri: 0.085,
  Montana: 0.098,
  Nebraska: 0.084,
  Nevada: 0.092,
  "New Hampshire": 0.159,
  "New Jersey": 0.127,
  "New Mexico": 0.091,
  "New York": 0.151, // HIGH
  "North Carolina": 0.094,
  "North Dakota": 0.089,
  Ohio: 0.095,
  Oklahoma: 0.078,
  Oregon: 0.091,
  Pennsylvania: 0.089,
  "Rhode Island": 0.172, // HIGH
  "South Carolina": 0.099,
  "South Dakota": 0.095,
  Tennessee: 0.098,
  Texas: 0.085,
  Utah: 0.081,
  Vermont: 0.145,
  Virginia: 0.086,
  Washington: 0.078,
  "West Virginia": 0.087,
  Wisconsin: 0.095,
  Wyoming: 0.083,
};

export const analyzeUtilityRate = (state: string, customRate?: number): UtilityRateAnalysis => {
  const averageRate = customRate || STATE_RATES[state] || 0.12;

  let category: "low" | "medium" | "high" | "very-high";
  let recommendation;

  if (averageRate >= 0.18) {
    // VERY HIGH rates (CA, HI, AK, MA, CT, RI)
    category = "very-high";
    recommendation = {
      title: "🚨 Critical: Deploy Microgrid Configuration",
      description: `Your utility rate of $${averageRate.toFixed(3)}/kWh is ${Math.round((averageRate / 0.12 - 1) * 100)}% above national average. A BESS-only system won't maximize savings.`,
      action: "Add Solar + Battery Microgrid to cut grid dependency by 70%",
      savings: `Save an additional $${Math.round((averageRate - 0.12) * 1000000)}K/year with solar`,
      icon: "⚡🌞",
    };
  } else if (averageRate >= 0.14) {
    // HIGH rates (NY, NH, NJ, VT, ME)
    category = "high";
    recommendation = {
      title: "⚠️ Recommendation: Hybrid Power Profile",
      description: `At $${averageRate.toFixed(3)}/kWh, you're paying ${Math.round((averageRate / 0.12 - 1) * 100)}% above national average. Consider hybrid approach.`,
      action: "Add Solar (1-2 MW) to reduce grid purchases",
      savings: `Potential savings: $${Math.round((averageRate - 0.12) * 800000)}K/year`,
      icon: "☀️⚡",
    };
  } else if (averageRate >= 0.1) {
    // MEDIUM rates
    category = "medium";
    recommendation = {
      title: "💡 Consider: Solar Enhancement",
      description: `Your rate of $${averageRate.toFixed(3)}/kWh is moderate. Solar could provide good ROI.`,
      action: "Evaluate adding 0.5-1 MW solar for long-term savings",
      savings: `Expected payback: 8-10 years with 30% tax credit`,
      icon: "☀️",
    };
  } else {
    // LOW rates
    category = "low";
    recommendation = {
      title: "✅ Good News: Battery-Only is Optimal",
      description: `At $${averageRate.toFixed(3)}/kWh, your rates are below national average. Your current Power Profile is well-optimized.`,
      action: "Battery-only configuration is cost-effective",
      savings: "No immediate changes needed",
      icon: "✓",
    };
  }

  return {
    state,
    averageRate,
    category,
    recommendation,
  };
};

export const getHighRateStates = (): string[] => {
  return Object.entries(STATE_RATES)
    .filter(([_, rate]) => rate >= 0.14)
    .map(([state]) => state)
    .sort((a, b) => STATE_RATES[b] - STATE_RATES[a]);
};
