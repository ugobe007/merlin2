/**
 * RAVS™ - RISK-ADJUSTED VALUE SCORE SERVICE
 * ==========================================
 *
 * "Because the highest IRR isn't always the best decision."
 * "Return, adjusted for reality."
 *
 * RAVS™ measures the true value of an energy system by combining
 * financial performance with operational, environmental, and execution risk.
 *
 * FORMULA:
 * RAVS™ = (Financial Score × 0.40) + (Execution Score × 0.25) +
 *         (Market Score × 0.20) + (Operational Score × 0.15)
 *
 * Each component is scored 0-100, resulting in a final 0-100 RAVS™ score.
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface RAVSInput {
  // Financial Metrics
  financial: {
    npv: number; // Net Present Value ($)
    irr: number; // Internal Rate of Return (%)
    paybackYears: number; // Simple payback period
    roi5Year: number; // 5-year ROI (%)
    initialInvestment: number; // Total upfront cost ($)
  };

  // Project Details
  project: {
    systemType: "bess" | "solar" | "solar+bess" | "generator" | "ev" | "hybrid";
    systemSizeKW: number;
    durationHours?: number; // For BESS
    state: string;
    gridConnection: "on-grid" | "off-grid" | "limited" | "unreliable" | "expensive";
    industry: string;
  };

  // Market Context
  market: {
    electricityRate: number; // $/kWh
    rateVolatility?: "low" | "medium" | "high";
    incentivesAvailable: boolean;
    itcPercentage: number; // Investment Tax Credit %
    stateIncentives: boolean;
    netMeteringAvailable?: boolean;
  };

  // Operational Context
  operational: {
    warrantyYears: number;
    expectedLifeYears: number;
    maintenanceIncluded: boolean;
    installerTier: "premium" | "standard" | "economy";
    equipmentTier: "tier1" | "tier2" | "tier3";
  };
}

export interface RAVSScore {
  // Overall Score
  totalScore: number; // 0-100
  letterGrade: string; // A+, A, A-, B+, B, B-, C+, C, C-, D, F
  riskLevel: "low" | "medium" | "high";
  confidenceLevel: "high" | "medium" | "low";

  // Component Scores (0-100 each)
  components: {
    financial: {
      score: number;
      weight: number;
      factors: RAVSFactor[];
    };
    execution: {
      score: number;
      weight: number;
      factors: RAVSFactor[];
    };
    market: {
      score: number;
      weight: number;
      factors: RAVSFactor[];
    };
    operational: {
      score: number;
      weight: number;
      factors: RAVSFactor[];
    };
  };

  // Confidence Interval
  confidenceInterval: {
    low: number;
    mid: number;
    high: number;
  };

  // Key Insights
  strengths: string[];
  risks: string[];
  recommendations: string[];
}

export interface RAVSFactor {
  name: string;
  score: number; // 0-100
  weight: number; // Within component
  impact: "positive" | "neutral" | "negative";
  description: string;
}

// ============================================================================
// CONSTANTS & REFERENCE DATA
// ============================================================================

const WEIGHTS = {
  financial: 0.4,
  execution: 0.25,
  market: 0.2,
  operational: 0.15,
};

// State-level execution difficulty (permitting, interconnection, labor)
const STATE_EXECUTION_SCORES: Record<string, number> = {
  // Easy states (score 80-95)
  TX: 92,
  FL: 88,
  AZ: 90,
  NV: 91,
  GA: 85,
  NC: 84,
  TN: 86,
  SC: 83,
  AL: 82,
  OK: 87,
  CO: 85,
  UT: 86,
  ID: 84,
  // Moderate states (score 65-79)
  CA: 72,
  NY: 68,
  NJ: 70,
  MA: 71,
  CT: 69,
  PA: 75,
  OH: 76,
  IL: 74,
  MI: 73,
  WA: 70,
  OR: 71,
  VA: 77,
  MD: 72,
  MN: 74,
  // Challenging states (score 50-64)
  HI: 58,
  AK: 52,
};

// Utility rate volatility by region
const RATE_VOLATILITY: Record<string, "low" | "medium" | "high"> = {
  TX: "high",
  CA: "high",
  NY: "medium",
  FL: "medium",
  AZ: "medium",
  NV: "medium",
  HI: "high",
  AK: "high",
};

// Equipment tier reliability scores
const EQUIPMENT_SCORES: Record<string, number> = {
  tier1: 95, // CATL, BYD, Tesla, LG, Samsung
  tier2: 80, // Established brands, good track record
  tier3: 60, // Newer/unproven manufacturers
};

// Installer tier scores
const INSTALLER_SCORES: Record<string, number> = {
  premium: 95, // Top-tier EPCs, extensive track record
  standard: 75, // Qualified installers, good references
  economy: 55, // Budget installers, limited track record
};

// ============================================================================
// MAIN CALCULATION FUNCTION
// ============================================================================

export function calculateRAVS(input: RAVSInput): RAVSScore {
  // Calculate each component
  const financialResult = calculateFinancialScore(input);
  const executionResult = calculateExecutionScore(input);
  const marketResult = calculateMarketScore(input);
  const operationalResult = calculateOperationalScore(input);

  // Calculate weighted total
  const totalScore = Math.round(
    financialResult.score * WEIGHTS.financial +
      executionResult.score * WEIGHTS.execution +
      marketResult.score * WEIGHTS.market +
      operationalResult.score * WEIGHTS.operational
  );

  // Determine letter grade
  const letterGrade = getLetterGrade(totalScore);

  // Determine risk level
  const riskLevel = getRiskLevel(totalScore);

  // Calculate confidence interval
  const confidenceInterval = calculateConfidenceInterval(
    totalScore,
    financialResult.score,
    executionResult.score,
    input
  );

  // Determine confidence level
  const confidenceLevel = getConfidenceLevel(confidenceInterval);

  // Generate insights
  const { strengths, risks, recommendations } = generateInsights(
    financialResult,
    executionResult,
    marketResult,
    operationalResult,
    input
  );

  return {
    totalScore,
    letterGrade,
    riskLevel,
    confidenceLevel,
    components: {
      financial: {
        score: financialResult.score,
        weight: WEIGHTS.financial,
        factors: financialResult.factors,
      },
      execution: {
        score: executionResult.score,
        weight: WEIGHTS.execution,
        factors: executionResult.factors,
      },
      market: {
        score: marketResult.score,
        weight: WEIGHTS.market,
        factors: marketResult.factors,
      },
      operational: {
        score: operationalResult.score,
        weight: WEIGHTS.operational,
        factors: operationalResult.factors,
      },
    },
    confidenceInterval,
    strengths,
    risks,
    recommendations,
  };
}

// ============================================================================
// COMPONENT SCORE CALCULATIONS
// ============================================================================

interface ComponentResult {
  score: number;
  factors: RAVSFactor[];
}

function calculateFinancialScore(input: RAVSInput): ComponentResult {
  const factors: RAVSFactor[] = [];
  const { npv, irr, paybackYears, roi5Year, initialInvestment } = input.financial;

  // NPV Score (0-100)
  // Positive NPV is good, higher is better
  const npvRatio = npv / initialInvestment;
  const npvScore = Math.min(
    100,
    Math.max(
      0,
      npvRatio > 1
        ? 95
        : npvRatio > 0.5
          ? 85
          : npvRatio > 0.2
            ? 75
            : npvRatio > 0
              ? 65
              : npvRatio > -0.1
                ? 50
                : 30
    )
  );
  factors.push({
    name: "Net Present Value",
    score: npvScore,
    weight: 0.3,
    impact: npvRatio > 0.2 ? "positive" : npvRatio > 0 ? "neutral" : "negative",
    description: `NPV is ${npvRatio > 0 ? "+" : ""}${(npvRatio * 100).toFixed(0)}% of investment`,
  });

  // IRR Score (0-100)
  // 15%+ is excellent, 10-15% good, 5-10% moderate, <5% weak
  const irrScore = Math.min(
    100,
    Math.max(
      0,
      irr >= 20
        ? 98
        : irr >= 15
          ? 90
          : irr >= 12
            ? 82
            : irr >= 10
              ? 75
              : irr >= 8
                ? 68
                : irr >= 5
                  ? 55
                  : irr >= 0
                    ? 40
                    : 20
    )
  );
  factors.push({
    name: "Internal Rate of Return",
    score: irrScore,
    weight: 0.25,
    impact: irr >= 12 ? "positive" : irr >= 8 ? "neutral" : "negative",
    description: `${irr.toFixed(1)}% IRR`,
  });

  // Payback Score (0-100)
  // <4 years excellent, 4-6 good, 6-8 moderate, 8-10 weak, >10 poor
  const paybackScore = Math.min(
    100,
    Math.max(
      0,
      paybackYears <= 3
        ? 98
        : paybackYears <= 4
          ? 92
          : paybackYears <= 5
            ? 85
            : paybackYears <= 6
              ? 78
              : paybackYears <= 7
                ? 70
                : paybackYears <= 8
                  ? 60
                  : paybackYears <= 10
                    ? 50
                    : paybackYears <= 12
                      ? 40
                      : 25
    )
  );
  factors.push({
    name: "Payback Period",
    score: paybackScore,
    weight: 0.25,
    impact: paybackYears <= 5 ? "positive" : paybackYears <= 8 ? "neutral" : "negative",
    description: `${paybackYears.toFixed(1)} year payback`,
  });

  // 5-Year ROI Score (0-100)
  const roiScore = Math.min(
    100,
    Math.max(
      0,
      roi5Year >= 200
        ? 98
        : roi5Year >= 150
          ? 92
          : roi5Year >= 100
            ? 85
            : roi5Year >= 75
              ? 78
              : roi5Year >= 50
                ? 70
                : roi5Year >= 25
                  ? 60
                  : roi5Year >= 0
                    ? 45
                    : 20
    )
  );
  factors.push({
    name: "5-Year ROI",
    score: roiScore,
    weight: 0.2,
    impact: roi5Year >= 100 ? "positive" : roi5Year >= 50 ? "neutral" : "negative",
    description: `${roi5Year.toFixed(0)}% cumulative ROI`,
  });

  // Calculate weighted score
  const score = Math.round(factors.reduce((sum, f) => sum + f.score * f.weight, 0));

  return { score, factors };
}

function calculateExecutionScore(input: RAVSInput): ComponentResult {
  const factors: RAVSFactor[] = [];
  const { state, systemSizeKW, systemType } = input.project;
  const { installerTier, equipmentTier } = input.operational;

  // State permitting/interconnection score
  const stateScore = STATE_EXECUTION_SCORES[state] || 75;
  factors.push({
    name: "Permitting Environment",
    score: stateScore,
    weight: 0.3,
    impact: stateScore >= 80 ? "positive" : stateScore >= 65 ? "neutral" : "negative",
    description: `${state} has ${stateScore >= 80 ? "streamlined" : stateScore >= 65 ? "moderate" : "complex"} permitting`,
  });

  // Project complexity score (based on size and type)
  let complexityScore = 85;
  if (systemSizeKW > 1000) complexityScore -= 15;
  else if (systemSizeKW > 500) complexityScore -= 10;
  else if (systemSizeKW > 200) complexityScore -= 5;

  if (systemType === "hybrid") complexityScore -= 10;
  else if (systemType === "solar+bess") complexityScore -= 5;

  complexityScore = Math.max(50, complexityScore);
  factors.push({
    name: "Project Complexity",
    score: complexityScore,
    weight: 0.25,
    impact: complexityScore >= 75 ? "positive" : complexityScore >= 60 ? "neutral" : "negative",
    description: `${systemSizeKW}kW ${systemType} system`,
  });

  // Installer quality score
  const installerScore = INSTALLER_SCORES[installerTier] || 75;
  factors.push({
    name: "Installer Quality",
    score: installerScore,
    weight: 0.25,
    impact: installerScore >= 85 ? "positive" : installerScore >= 70 ? "neutral" : "negative",
    description: `${installerTier.charAt(0).toUpperCase() + installerTier.slice(1)} tier installer`,
  });

  // Equipment availability score
  const equipmentScore = EQUIPMENT_SCORES[equipmentTier] || 75;
  factors.push({
    name: "Equipment Quality",
    score: equipmentScore,
    weight: 0.2,
    impact: equipmentScore >= 85 ? "positive" : equipmentScore >= 70 ? "neutral" : "negative",
    description: `${equipmentTier.charAt(0).toUpperCase() + equipmentTier.slice(1)} equipment`,
  });

  // Calculate weighted score
  const score = Math.round(factors.reduce((sum, f) => sum + f.score * f.weight, 0));

  return { score, factors };
}

function calculateMarketScore(input: RAVSInput): ComponentResult {
  const factors: RAVSFactor[] = [];
  const { state } = input.project;
  const {
    electricityRate,
    incentivesAvailable,
    itcPercentage,
    stateIncentives,
    netMeteringAvailable,
  } = input.market;

  // Electricity rate favorability
  // Higher rates = better economics for solar/storage
  const rateScore = Math.min(
    100,
    Math.max(
      40,
      electricityRate >= 0.25
        ? 98
        : electricityRate >= 0.2
          ? 92
          : electricityRate >= 0.15
            ? 85
            : electricityRate >= 0.12
              ? 75
              : electricityRate >= 0.1
                ? 65
                : electricityRate >= 0.08
                  ? 55
                  : 45
    )
  );
  factors.push({
    name: "Electricity Rate",
    score: rateScore,
    weight: 0.3,
    impact: electricityRate >= 0.15 ? "positive" : electricityRate >= 0.1 ? "neutral" : "negative",
    description: `$${electricityRate.toFixed(3)}/kWh retail rate`,
  });

  // Rate volatility risk
  const volatility = input.market.rateVolatility || RATE_VOLATILITY[state] || "medium";
  const volatilityScore = volatility === "low" ? 90 : volatility === "medium" ? 70 : 50;
  factors.push({
    name: "Rate Stability",
    score: volatilityScore,
    weight: 0.2,
    impact: volatility === "low" ? "positive" : volatility === "medium" ? "neutral" : "negative",
    description: `${volatility.charAt(0).toUpperCase() + volatility.slice(1)} rate volatility`,
  });

  // Incentive stability
  let incentiveScore = 50;
  if (itcPercentage >= 30) incentiveScore += 25;
  else if (itcPercentage >= 26) incentiveScore += 20;
  else if (itcPercentage >= 22) incentiveScore += 15;

  if (stateIncentives) incentiveScore += 15;
  if (incentivesAvailable) incentiveScore += 10;

  incentiveScore = Math.min(100, incentiveScore);
  factors.push({
    name: "Incentive Environment",
    score: incentiveScore,
    weight: 0.3,
    impact: incentiveScore >= 80 ? "positive" : incentiveScore >= 60 ? "neutral" : "negative",
    description: `${itcPercentage}% ITC${stateIncentives ? " + state incentives" : ""}`,
  });

  // Net metering / export value
  const nmScore = netMeteringAvailable ? 85 : 55;
  factors.push({
    name: "Export Value",
    score: nmScore,
    weight: 0.2,
    impact: netMeteringAvailable ? "positive" : "neutral",
    description: netMeteringAvailable ? "Net metering available" : "Limited export compensation",
  });

  // Calculate weighted score
  const score = Math.round(factors.reduce((sum, f) => sum + f.score * f.weight, 0));

  return { score, factors };
}

function calculateOperationalScore(input: RAVSInput): ComponentResult {
  const factors: RAVSFactor[] = [];
  const { systemType } = input.project;
  const { warrantyYears, expectedLifeYears, maintenanceIncluded, equipmentTier } =
    input.operational;

  // Warranty coverage score
  const warrantyScore = Math.min(
    100,
    Math.max(
      40,
      warrantyYears >= 25
        ? 95
        : warrantyYears >= 20
          ? 90
          : warrantyYears >= 15
            ? 82
            : warrantyYears >= 10
              ? 72
              : warrantyYears >= 5
                ? 58
                : 40
    )
  );
  factors.push({
    name: "Warranty Coverage",
    score: warrantyScore,
    weight: 0.3,
    impact: warrantyYears >= 15 ? "positive" : warrantyYears >= 10 ? "neutral" : "negative",
    description: `${warrantyYears}-year warranty`,
  });

  // Equipment reliability (based on tier)
  const reliabilityScore = EQUIPMENT_SCORES[equipmentTier] || 75;
  factors.push({
    name: "Equipment Reliability",
    score: reliabilityScore,
    weight: 0.25,
    impact: reliabilityScore >= 85 ? "positive" : reliabilityScore >= 70 ? "neutral" : "negative",
    description: `${equipmentTier} manufacturer`,
  });

  // Maintenance simplicity
  let maintenanceScore = 70;
  if (maintenanceIncluded) maintenanceScore += 20;
  if (systemType === "bess") maintenanceScore += 5; // BESS is low maintenance
  if (systemType === "generator") maintenanceScore -= 15; // Generators need more maintenance

  maintenanceScore = Math.min(100, Math.max(40, maintenanceScore));
  factors.push({
    name: "Maintenance Requirements",
    score: maintenanceScore,
    weight: 0.25,
    impact: maintenanceScore >= 80 ? "positive" : maintenanceScore >= 60 ? "neutral" : "negative",
    description: maintenanceIncluded ? "Maintenance included" : "Owner-managed maintenance",
  });

  // Expected degradation
  let degradationScore = 75;
  if (expectedLifeYears >= 25) degradationScore = 90;
  else if (expectedLifeYears >= 20) degradationScore = 82;
  else if (expectedLifeYears >= 15) degradationScore = 72;
  else if (expectedLifeYears >= 10) degradationScore = 60;

  factors.push({
    name: "System Longevity",
    score: degradationScore,
    weight: 0.2,
    impact: expectedLifeYears >= 20 ? "positive" : expectedLifeYears >= 15 ? "neutral" : "negative",
    description: `${expectedLifeYears}-year expected life`,
  });

  // Calculate weighted score
  const score = Math.round(factors.reduce((sum, f) => sum + f.score * f.weight, 0));

  return { score, factors };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getLetterGrade(score: number): string {
  if (score >= 97) return "A+";
  if (score >= 93) return "A";
  if (score >= 90) return "A-";
  if (score >= 87) return "B+";
  if (score >= 83) return "B";
  if (score >= 80) return "B-";
  if (score >= 77) return "C+";
  if (score >= 73) return "C";
  if (score >= 70) return "C-";
  if (score >= 60) return "D";
  return "F";
}

function getRiskLevel(score: number): "low" | "medium" | "high" {
  if (score >= 80) return "low";
  if (score >= 60) return "medium";
  return "high";
}

function calculateConfidenceInterval(
  totalScore: number,
  financialScore: number,
  executionScore: number,
  input: RAVSInput
): { low: number; mid: number; high: number } {
  // Base variance on input quality
  let variance = 8;

  // More variance for larger projects
  if (input.project.systemSizeKW > 500) variance += 3;

  // More variance for hybrid systems
  if (input.project.systemType === "hybrid") variance += 2;

  // Less variance for tier1 equipment
  if (input.operational.equipmentTier === "tier1") variance -= 2;

  // More variance if financial and execution scores diverge significantly
  const scoreDivergence = Math.abs(financialScore - executionScore);
  if (scoreDivergence > 20) variance += 3;

  return {
    low: Math.max(0, totalScore - variance),
    mid: totalScore,
    high: Math.min(100, totalScore + variance),
  };
}

function getConfidenceLevel(interval: {
  low: number;
  mid: number;
  high: number;
}): "high" | "medium" | "low" {
  const range = interval.high - interval.low;
  if (range <= 12) return "high";
  if (range <= 18) return "medium";
  return "low";
}

function generateInsights(
  financial: ComponentResult,
  execution: ComponentResult,
  market: ComponentResult,
  operational: ComponentResult,
  input: RAVSInput
): { strengths: string[]; risks: string[]; recommendations: string[] } {
  const strengths: string[] = [];
  const risks: string[] = [];
  const recommendations: string[] = [];

  // Financial insights
  if (financial.score >= 85) {
    strengths.push("Strong financial returns with attractive payback period");
  } else if (financial.score < 65) {
    risks.push("Financial returns may not meet typical investment thresholds");
    recommendations.push("Consider optimizing system size or exploring additional incentives");
  }

  // Execution insights
  if (execution.score >= 85) {
    strengths.push("Favorable permitting environment and qualified installation team");
  } else if (execution.score < 65) {
    risks.push("Complex permitting or installation challenges may cause delays");
    recommendations.push("Budget additional time and contingency for permitting");
  }

  // Market insights
  if (market.score >= 85) {
    strengths.push("Excellent utility rate environment with strong incentives");
  } else if (market.score < 65) {
    risks.push("Market conditions may impact long-term savings projections");
    if (input.market.electricityRate < 0.12) {
      recommendations.push("Focus on demand charge reduction and backup power value");
    }
  }

  // Operational insights
  if (operational.score >= 85) {
    strengths.push("Premium equipment with comprehensive warranty coverage");
  } else if (operational.score < 65) {
    risks.push("Equipment or warranty limitations may increase long-term costs");
    recommendations.push("Consider extended warranty options or higher-tier equipment");
  }

  // Cross-cutting insights
  if (input.project.systemType.includes("bess")) {
    strengths.push("Battery storage provides grid independence and arbitrage opportunities");
  }

  if (input.market.itcPercentage >= 30) {
    strengths.push("Maximizing 30% Investment Tax Credit");
  }

  if (
    input.operational.installerTier === "premium" &&
    input.operational.equipmentTier === "tier1"
  ) {
    strengths.push("Best-in-class installation and equipment quality");
  }

  return { strengths, risks, recommendations };
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Quick RAVS calculation with sensible defaults
 */
export function quickRAVS(params: {
  npv: number;
  irr: number;
  paybackYears: number;
  systemSizeKW: number;
  state: string;
  electricityRate: number;
}): RAVSScore {
  return calculateRAVS({
    financial: {
      npv: params.npv,
      irr: params.irr,
      paybackYears: params.paybackYears,
      roi5Year: (params.npv / (params.systemSizeKW * 400)) * 100,
      initialInvestment: params.systemSizeKW * 400,
    },
    project: {
      systemType: "solar+bess",
      systemSizeKW: params.systemSizeKW,
      state: params.state,
      gridConnection: "on-grid",
      industry: "commercial",
    },
    market: {
      electricityRate: params.electricityRate,
      incentivesAvailable: true,
      itcPercentage: 30,
      stateIncentives: false,
      netMeteringAvailable: true,
    },
    operational: {
      warrantyYears: 15,
      expectedLifeYears: 25,
      maintenanceIncluded: false,
      installerTier: "standard",
      equipmentTier: "tier1",
    },
  });
}

/**
 * Get color for RAVS score (for UI)
 */
export function getRAVSColor(score: number): {
  bg: string;
  text: string;
  border: string;
  gradient: string;
} {
  if (score >= 80) {
    return {
      bg: "bg-emerald-500/20",
      text: "text-emerald-400",
      border: "border-emerald-500/50",
      gradient: "from-emerald-500 to-green-600",
    };
  }
  if (score >= 60) {
    return {
      bg: "bg-amber-500/20",
      text: "text-amber-400",
      border: "border-amber-500/50",
      gradient: "from-amber-500 to-orange-600",
    };
  }
  return {
    bg: "bg-red-500/20",
    text: "text-red-400",
    border: "border-red-500/50",
    gradient: "from-red-500 to-rose-600",
  };
}

export default calculateRAVS;
