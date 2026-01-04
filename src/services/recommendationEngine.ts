/**
 * RECOMMENDATION ENGINE
 * =====================
 *
 * AI-driven recommendation engine that analyzes ALL variables to determine
 * optimal energy system configurations.
 *
 * Used in Step 3 Recommendation Modal to provide intelligent recommendations
 * with explanations.
 *
 * Phase: Step 3 Post-Completion Modal
 */

import { assessBasicRisk } from "./riskAssessmentService";
import { getStateProfile } from "./geographicIntelligenceService";
import { NREL_SOLAR_DATA } from "@/data/utilityData";

export interface RecommendationResult {
  recommended: boolean;
  status: "recommended" | "not-recommended" | "alternative";
  reasoning: string;
  alternativeSuggestion?: string; // If not recommended, suggest alternative
  constraints: string[]; // List of constraints/issues
  advantages: string[]; // List of advantages if recommended
}

export interface OpportunityRecommendation {
  solar: RecommendationResult & {
    estimatedCapacityKW?: number; // Based on available rooftop space
    spaceAnalysis?: {
      availableRooftopSqFt: number;
      requiredSqFt: number;
      coverage: number; // Percentage (0-100)
      feasible: boolean;
    };
  };
  generator: RecommendationResult & {
    estimatedCapacityKW?: number;
  };
  evCharging: RecommendationResult & {
    estimatedLoadKW?: number;
    constraints?: string[];
  };
}

export interface RecommendationEngineInput {
  // Location & Grid
  state: string;
  zipCode?: string;
  gridConnection: "on-grid" | "off-grid" | "limited" | "unreliable" | "expensive";
  electricityRate: number;

  // Facility Details
  industry: string;
  useCaseData: Record<string, any>;

  // Goals
  goals: string[];

  // Opportunity Preferences (from Step 2)
  opportunityPreferences: {
    wantsSolar: boolean;
    wantsGenerator: boolean;
    wantsEV: boolean;
  };
}

/**
 * Main recommendation engine - analyzes all variables and provides recommendations
 */
export function generateRecommendations(
  input: RecommendationEngineInput
): OpportunityRecommendation {
  const {
    state,
    gridConnection,
    electricityRate,
    industry,
    useCaseData,
    goals,
    opportunityPreferences,
  } = input;

  // Get location-specific data
  const stateProfile = getStateProfile(state);
  const solarData = NREL_SOLAR_DATA[state] || NREL_SOLAR_DATA["California"];
  const peakSunHours = solarData.peakSunHours;

  // Assess basic risk
  const riskAssessment = assessBasicRisk(state, gridConnection);

  // Extract facility details
  const rooftopSqFt = parseFloat(
    useCaseData.rooftopSquareFootage || useCaseData.rooftopSqFt || "0"
  );
  const totalSqFt = parseFloat(
    useCaseData.totalFacilitySquareFootage ||
      useCaseData.totalFacilitySqFt ||
      useCaseData.totalSqFt ||
      "0"
  );
  const isDowntown =
    useCaseData.locationType === "downtown" || useCaseData.urbanSetting === "downtown";
  const isEVChargingHub =
    industry.toLowerCase().includes("ev-charging") ||
    industry.toLowerCase().includes("ev-charging-hub");

  // Generate solar recommendation first
  const solarRec = recommendSolar({
    wantsSolar: opportunityPreferences.wantsSolar,
    rooftopSqFt,
    totalSqFt,
    peakSunHours,
    solarRating: riskAssessment.solarViability.rating,
    gridConnection,
    electricityRate,
    goals,
    industry,
    isDowntown,
    isEVChargingHub,
  });

  // Generate recommendations
  return {
    solar: solarRec,

    generator: recommendGenerator({
      wantsGenerator: opportunityPreferences.wantsGenerator,
      gridConnection,
      goals,
      industry,
      solarRecommended: solarRec.recommended,
      isDowntown,
    }),

    evCharging: recommendEVCharging({
      wantsEV: opportunityPreferences.wantsEV,
      gridConnection,
      electricityRate,
      goals,
      industry,
      isDowntown,
      stateProfile,
    }),
  };
}

/**
 * Solar Recommendation Logic
 */
function recommendSolar(params: {
  wantsSolar: boolean;
  rooftopSqFt: number;
  totalSqFt: number;
  peakSunHours: number;
  solarRating: "excellent" | "very good" | "good" | "fair" | "poor";
  gridConnection: string;
  electricityRate: number;
  goals: string[];
  industry: string;
  isDowntown: boolean;
  isEVChargingHub: boolean;
}): OpportunityRecommendation["solar"] {
  const {
    wantsSolar,
    rooftopSqFt,
    totalSqFt,
    peakSunHours,
    solarRating,
    gridConnection,
    electricityRate,
    goals,
    industry,
    isDowntown,
    isEVChargingHub,
  } = params;

  const constraints: string[] = [];
  const advantages: string[] = [];
  let recommended = false;
  let status: "recommended" | "not-recommended" | "alternative" = "not-recommended";
  let reasoning = "";
  let alternativeSuggestion: string | undefined;

  // Calculate solar capacity from rooftop space
  // Rule of thumb: ~100 sq ft per kW (10 kW per 1,000 sq ft)
  const sqFtPerKW = 100;
  const estimatedCapacityKW = rooftopSqFt > 0 ? Math.floor(rooftopSqFt / sqFtPerKW) : 0;
  const requiredSqFt = estimatedCapacityKW > 0 ? estimatedCapacityKW * sqFtPerKW : 0;
  const coverage = rooftopSqFt > 0 && requiredSqFt > 0 ? (requiredSqFt / rooftopSqFt) * 100 : 0;
  const feasible = coverage <= 80; // Need at least 20% buffer for access/maintenance

  // Space analysis
  const spaceAnalysis =
    rooftopSqFt > 0
      ? {
          availableRooftopSqFt: rooftopSqFt,
          requiredSqFt,
          coverage,
          feasible,
        }
      : undefined;

  // Constraint 1: Insufficient rooftop space
  if (rooftopSqFt < 500) {
    constraints.push(
      "Insufficient rooftop space (<500 sq ft) - minimum needed for viable solar installation"
    );
    if (isDowntown || isEVChargingHub) {
      constraints.push(
        `${isEVChargingHub ? "EV charging hub" : "Downtown location"} typically lacks adequate rooftop space for solar`
      );
    }
  } else if (!feasible) {
    constraints.push(
      `Required space (${Math.round(requiredSqFt).toLocaleString()} sq ft) exceeds available rooftop (${Math.round(rooftopSqFt).toLocaleString()} sq ft)`
    );
  }

  // Constraint 2: Poor solar rating
  if (peakSunHours < 3.5) {
    constraints.push(
      `Poor solar rating (${peakSunHours.toFixed(1)} peak sun hours/day) - below recommended threshold of 3.5 hours`
    );
  }

  // Constraint 3: Off-grid or unreliable grid (generators better)
  if (gridConnection === "off-grid" || gridConnection === "unreliable") {
    constraints.push(
      `${gridConnection === "off-grid" ? "Off-grid" : "Unreliable grid"} - backup generators provide more reliable power than solar`
    );
    alternativeSuggestion = "Backup Generator";
  }

  // Constraint 4: Low electricity rates (poor ROI)
  if (electricityRate < 0.08) {
    constraints.push(
      `Low electricity rates ($${electricityRate.toFixed(3)}/kWh) - ROI period would exceed 10+ years`
    );
  }

  // Advantage 1: Good solar rating
  if (peakSunHours >= 4.0) {
    advantages.push(
      `Excellent solar potential (${peakSunHours.toFixed(1)} peak sun hours/day, ${solarRating} rating)`
    );
  }

  // Advantage 2: Adequate space
  if (rooftopSqFt >= 2000 && feasible) {
    advantages.push(
      `Adequate rooftop space (${Math.round(rooftopSqFt).toLocaleString()} sq ft) - can support ~${estimatedCapacityKW} kW solar array`
    );
  }

  // Advantage 3: High electricity rates (good ROI)
  if (electricityRate >= 0.12) {
    advantages.push(
      `High electricity rates ($${electricityRate.toFixed(3)}/kWh) - excellent ROI potential`
    );
  }

  // Advantage 4: Sustainability goals
  if (goals.includes("sustainability")) {
    advantages.push("Aligns with sustainability goals");
  }

  // Advantage 5: On-grid with reliable service
  if (gridConnection === "on-grid") {
    advantages.push("On-grid connection allows net metering and grid services participation");
  }

  // Decision logic
  if (wantsSolar) {
    // If user wants solar, check viability
    if (constraints.length === 0 || (constraints.length <= 1 && advantages.length >= 2)) {
      recommended = true;
      status = "recommended";
      reasoning = `Solar is viable for your facility. ${advantages.join(" ")}${constraints.length > 0 ? ` Note: ${constraints[0]}` : ""}`;
    } else {
      recommended = false;
      status = "not-recommended";
      reasoning = `Solar is not recommended due to: ${constraints.join(", ")}${alternativeSuggestion ? `. Consider ${alternativeSuggestion} instead.` : ""}`;
    }
  } else {
    // If user didn't select solar, still assess if it would be good
    if (advantages.length >= 3 && constraints.length === 0) {
      status = "alternative";
      reasoning = `Solar could be a good option: ${advantages.join(", ")}. Consider adding solar to maximize savings.`;
    } else {
      status = "not-recommended";
      reasoning = "Solar not selected and not recommended based on facility constraints.";
    }
  }

  return {
    recommended,
    status,
    reasoning,
    alternativeSuggestion,
    constraints,
    advantages,
    estimatedCapacityKW: estimatedCapacityKW > 0 ? estimatedCapacityKW : undefined,
    spaceAnalysis,
  };
}

/**
 * Generator Recommendation Logic
 */
function recommendGenerator(params: {
  wantsGenerator: boolean;
  gridConnection: string;
  goals: string[];
  industry: string;
  solarRecommended: boolean;
  isDowntown: boolean;
}): OpportunityRecommendation["generator"] {
  const { wantsGenerator, gridConnection, goals, industry, solarRecommended, isDowntown } = params;

  const constraints: string[] = [];
  const advantages: string[] = [];
  let recommended = false;
  let status: "recommended" | "not-recommended" | "alternative" = "not-recommended";
  let reasoning = "";
  let alternativeSuggestion: string | undefined;
  let estimatedCapacityKW: number | undefined;

  // Estimate generator capacity (typically 30-50% of peak demand for backup)
  // This is a placeholder - should use actual peak demand from calculations
  estimatedCapacityKW = 100; // Will be calculated based on facility needs

  // Advantage 1: Off-grid or unreliable grid
  if (gridConnection === "off-grid" || gridConnection === "unreliable") {
    advantages.push(
      `${gridConnection === "off-grid" ? "Off-grid" : "Unreliable grid"} - generators provide essential backup power`
    );
    recommended = true;
  }

  // Advantage 2: Backup power goal
  if (goals.includes("backup-power")) {
    advantages.push("Backup power goal aligns with generator use case");
    recommended = recommended || true;
  }

  // Advantage 3: Critical operations
  const criticalIndustries = ["hospital", "data-center", "manufacturing", "cold-storage"];
  if (criticalIndustries.includes(industry.toLowerCase())) {
    advantages.push(`${industry} requires reliable backup power for critical operations`);
    recommended = recommended || true;
  }

  // Advantage 4: Grid independence goal
  if (goals.includes("grid-independence")) {
    advantages.push("Grid independence goal - generators reduce reliance on utility grid");
    recommended = recommended || true;
  }

  // Constraint 1: On-grid with reliable service
  if (
    gridConnection === "on-grid" &&
    !goals.includes("backup-power") &&
    !goals.includes("grid-independence")
  ) {
    constraints.push("On-grid with reliable service - generators may be unnecessary overhead");
    alternativeSuggestion = "Solar + BESS";
  }

  // Constraint 2: Only sustainability goals (generators use fossil fuels)
  if (goals.includes("sustainability") && !goals.includes("backup-power")) {
    constraints.push("Sustainability goals conflict with fossil fuel generators");
    alternativeSuggestion = "Solar + BESS";
  }

  // Constraint 3: Downtown location (noise restrictions)
  if (isDowntown) {
    constraints.push("Downtown location may have noise restrictions for generators");
  }

  // Decision logic
  if (wantsGenerator) {
    if (recommended) {
      status = "recommended";
      reasoning = `Generator is recommended: ${advantages.join(", ")}${constraints.length > 0 ? `. Note: ${constraints[0]}` : ""}`;
    } else {
      status = "not-recommended";
      reasoning = `Generator may not be the best option: ${constraints.join(", ")}${alternativeSuggestion ? `. Consider ${alternativeSuggestion} instead.` : ""}`;
    }
  } else {
    if (recommended) {
      status = "alternative";
      reasoning = `Generator could be beneficial: ${advantages.join(", ")}. Consider adding backup generator.`;
    } else {
      status = "not-recommended";
      reasoning = "Generator not selected and not recommended based on facility needs.";
    }
  }

  return {
    recommended,
    status,
    reasoning,
    alternativeSuggestion,
    constraints,
    advantages,
    estimatedCapacityKW,
  };
}

/**
 * EV Charging Recommendation Logic
 */
function recommendEVCharging(params: {
  wantsEV: boolean;
  gridConnection: string;
  electricityRate: number;
  goals: string[];
  industry: string;
  isDowntown: boolean;
  stateProfile: any;
}): OpportunityRecommendation["evCharging"] {
  const { wantsEV, gridConnection, electricityRate, goals, industry, isDowntown, stateProfile } =
    params;

  const constraints: string[] = [];
  const advantages: string[] = [];
  let recommended = false;
  let status: "recommended" | "not-recommended" | "alternative" = "not-recommended";
  let reasoning = "";
  let alternativeSuggestion: string | undefined;
  let estimatedLoadKW: number | undefined;

  // Estimate EV load (placeholder - should use actual charger counts)
  estimatedLoadKW = 50; // Will be calculated based on charger configuration

  // Advantage 1: High traffic location
  if (
    isDowntown ||
    industry.toLowerCase().includes("retail") ||
    industry.toLowerCase().includes("hotel")
  ) {
    advantages.push("High traffic location ideal for EV charging");
    recommended = true;
  }

  // Advantage 2: High electricity rates (opportunity for arbitrage)
  if (electricityRate >= 0.12) {
    advantages.push(
      `High electricity rates ($${electricityRate.toFixed(3)}/kWh) - good arbitrage opportunity with BESS`
    );
    recommended = recommended || true;
  }

  // Advantage 3: Sustainability goals
  if (goals.includes("sustainability")) {
    advantages.push("Aligns with sustainability and ESG goals");
    recommended = recommended || true;
  }

  // Advantage 4: On-grid connection
  if (gridConnection === "on-grid") {
    advantages.push("On-grid connection allows demand charge management with BESS");
    recommended = recommended || true;
  }

  // Constraint 1: Low electricity rates (not competitive)
  if (electricityRate < 0.08) {
    constraints.push(
      `Low electricity rates ($${electricityRate.toFixed(3)}/kWh) - limited arbitrage opportunity`
    );
    recommended = false;
  }

  // Constraint 2: Off-grid (no grid to charge from)
  if (gridConnection === "off-grid") {
    constraints.push("Off-grid connection - EV charging requires grid connection or solar + BESS");
    alternativeSuggestion = "Solar + BESS for EV charging";
    recommended = false;
  }

  // Constraint 3: Low traffic location
  if (
    !isDowntown &&
    !industry.toLowerCase().includes("retail") &&
    !industry.toLowerCase().includes("hotel")
  ) {
    constraints.push("Low traffic location may not justify EV charging investment");
    recommended = recommended && false;
  }

  // Decision logic
  if (wantsEV) {
    if (recommended) {
      status = "recommended";
      reasoning = `EV charging is recommended: ${advantages.join(", ")}${constraints.length > 0 ? `. Note: ${constraints[0]}` : ""}`;
    } else {
      status = "not-recommended";
      reasoning = `EV charging may not be viable: ${constraints.join(", ")}${alternativeSuggestion ? `. Consider ${alternativeSuggestion} instead.` : ""}`;
    }
  } else {
    if (recommended) {
      status = "alternative";
      reasoning = `EV charging could be beneficial: ${advantages.join(", ")}. Consider adding EV charging.`;
    } else {
      status = "not-recommended";
      reasoning = "EV charging not selected and not recommended based on facility characteristics.";
    }
  }

  return {
    recommended,
    status,
    reasoning,
    alternativeSuggestion,
    constraints,
    advantages,
    estimatedLoadKW,
  };
}
