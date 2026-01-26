/**
 * STEP 3 VALIDATOR - Completeness & Confidence Scoring
 * Created: Jan 16, 2026
 *
 * This determines when Step 3 is "complete enough" to proceed to Step 4.
 */

import type { WizardState } from "../types";
import type { Step3MissingKey } from "./step3Contract";

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function isFiniteNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

/**
 * Get all missing required fields from Step 3
 */
export function getStep3Missing(state: WizardState): Step3MissingKey[] {
  const missing: Step3MissingKey[] = [];

  // Location (always required)
  if (!isNonEmptyString(state.zipCode)) missing.push("location.zipCode");
  if (!isNonEmptyString(state.state)) missing.push("location.state");

  // Industry (always required)
  if (!isNonEmptyString(state.industry)) missing.push("industry.type");

  // Facility: operating hours is anchor for most use cases
  const inputs = (state.useCaseData?.inputs || {}) as Record<string, unknown>;
  if (!isFiniteNumber(inputs.operatingHours)) {
    missing.push("facility.operatingHours");
  }

  // Industry-specific requirements
  // Normalize slugs: car_wash → car wash, data_center → data center
  const industryRaw = (state.industry || "").toLowerCase();
  const industry = industryRaw.replace(/[_-]+/g, " ");

  // Hotels / multifamily
  if (industry.includes("hotel") || industry.includes("apartment")) {
    if (!isFiniteNumber(inputs.roomCount)) {
      missing.push("facility.roomCount");
    }
  }

  // Car wash
  if (industry.includes("car wash") || industry.includes("carwash")) {
    const bayCount = inputs.bayCount || inputs.bays;
    if (!isFiniteNumber(bayCount)) {
      missing.push("facility.bayCount");
    }
  }

  // Data center
  if (industry.includes("data center") || industry.includes("datacenter")) {
    if (!isFiniteNumber(inputs.rackCount)) {
      missing.push("facility.rackCount");
    }
  }

  // Hospital
  if (industry.includes("hospital")) {
    if (!isFiniteNumber(inputs.bedCount)) {
      missing.push("facility.bedCount");
    }
  }

  // Generic fallback for other industries
  if (
    !industry.includes("hotel") &&
    !industry.includes("apartment") &&
    !industry.includes("car wash") &&
    !industry.includes("data center") &&
    !industry.includes("hospital")
  ) {
    // Square footage is often the best baseline proxy
    if (!isFiniteNumber(inputs.squareFootage) && !isFiniteNumber(inputs.squareFeet)) {
      missing.push("facility.squareFeet");
    }
  }

  // Goals (always required)
  if (!Array.isArray(state.goals) || state.goals.length === 0) {
    missing.push("goals.primaryGoal");
  }

  return missing;
}

/**
 * Compute completeness percentage (0-100)
 * Based on how many required fields are filled
 */
export function computeCompletenessPct(missing: Step3MissingKey[]): number {
  // Required count is max possible in validator
  const REQUIRED_MAX = 8;
  const pct = Math.round(100 * (1 - Math.min(missing.length, REQUIRED_MAX) / REQUIRED_MAX));
  return Math.max(0, Math.min(100, pct));
}

/**
 * Compute confidence percentage (10-95)
 * Rewards high-signal fields, penalizes missing keys
 */
export function computeConfidencePct(state: WizardState, missing: Step3MissingKey[]): number {
  let score = 0;

  // High-value location data
  const hasZip = (state.zipCode || "").trim().length === 5;
  const hasState = (state.state || "").trim().length > 0;
  const hasRate = typeof state.electricityRate === "number" && state.electricityRate > 0;

  if (hasZip) score += 20;
  if (hasState) score += 15;
  if (hasRate) score += 10;

  // Operating hours (critical anchor)
  const inputs = (state.useCaseData?.inputs || {}) as Record<string, unknown>;
  const hasHours = typeof inputs.operatingHours === "number";
  if (hasHours) score += 25;

  // Industry-specific anchors
  // Normalize slugs: car_wash → car wash, data_center → data center
  const industryRaw = (state.industry || "").toLowerCase();
  const industry = industryRaw.replace(/[_-]+/g, " ");
  const hasRooms = typeof inputs.roomCount === "number";
  const bayCount = inputs.bayCount || inputs.bays;
  const hasBays = typeof bayCount === "number";
  const hasRacks = typeof inputs.rackCount === "number";
  const hasBeds = typeof inputs.bedCount === "number";
  const sqft = inputs.squareFootage || inputs.squareFeet;
  const hasSqft = typeof sqft === "number";

  if (industry.includes("hotel") && hasRooms) score += 20;
  else if (industry.includes("car wash") && hasBays) score += 20;
  else if (industry.includes("data center") && hasRacks) score += 20;
  else if (industry.includes("hospital") && hasBeds) score += 20;
  else if (hasSqft) score += 20;

  // Penalty for missing keys
  score -= missing.length * 5;

  return Math.max(10, Math.min(95, Math.round(score)));
}
