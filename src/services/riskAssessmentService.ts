/**
 * RISK ASSESSMENT SERVICE (Phase 2 - MVP)
 * =======================================
 *
 * Provides basic risk assessment based on location and grid connection.
 * Used for opportunity discovery before full facility data is available.
 *
 * Full risk assessment (with facility details) happens in Phase 4.
 */

import { NREL_SOLAR_DATA } from "@/data/utilityData";
import { getStateProfile } from "./geographicIntelligenceService";

export interface BasicRiskAssessment {
  solarViability: {
    peakSunHours: number;
    rating: "excellent" | "very good" | "good" | "fair" | "poor";
    available: boolean;
  };
  gridReliability: {
    rating: "excellent" | "good" | "fair" | "poor";
    averageOutagesPerYear: number;
    typicalOutageDuration: number; // hours
    notes?: string;
  };
  backupNeeds: {
    recommended: boolean;
    reason: string;
  };
}

/**
 * Get basic risk assessment for a location
 */
export function assessBasicRisk(
  state: string,
  gridConnection: "on-grid" | "off-grid" | "limited" | "unreliable" | "expensive"
): BasicRiskAssessment {
  // Get solar data
  const solarData = NREL_SOLAR_DATA[state] || NREL_SOLAR_DATA["California"]; // Default fallback
  const peakSunHours = solarData.peakSunHours;

  // Rate solar potential
  let solarRating: "excellent" | "very good" | "good" | "fair" | "poor";
  if (peakSunHours >= 6.0) {
    solarRating = "excellent";
  } else if (peakSunHours >= 5.0) {
    solarRating = "very good";
  } else if (peakSunHours >= 4.0) {
    solarRating = "good";
  } else if (peakSunHours >= 3.0) {
    solarRating = "fair";
  } else {
    solarRating = "poor";
  }

  // Helper function to convert state name to code
  function getStateCode(stateName: string): string {
    const stateMap: Record<string, string> = {
      Alabama: "AL",
      Alaska: "AK",
      Arizona: "AZ",
      Arkansas: "AR",
      California: "CA",
      Colorado: "CO",
      Connecticut: "CT",
      Delaware: "DE",
      Florida: "FL",
      Georgia: "GA",
      Hawaii: "HI",
      Idaho: "ID",
      Illinois: "IL",
      Indiana: "IN",
      Iowa: "IA",
      Kansas: "KS",
      Kentucky: "KY",
      Louisiana: "LA",
      Maine: "ME",
      Maryland: "MD",
      Massachusetts: "MA",
      Michigan: "MI",
      Minnesota: "MN",
      Mississippi: "MS",
      Missouri: "MO",
      Montana: "MT",
      Nebraska: "NE",
      Nevada: "NV",
      "New Hampshire": "NH",
      "New Jersey": "NJ",
      "New Mexico": "NM",
      "New York": "NY",
      "North Carolina": "NC",
      "North Dakota": "ND",
      Ohio: "OH",
      Oklahoma: "OK",
      Oregon: "OR",
      Pennsylvania: "PA",
      "Rhode Island": "RI",
      "South Carolina": "SC",
      "South Dakota": "SD",
      Tennessee: "TN",
      Texas: "TX",
      Utah: "UT",
      Vermont: "VT",
      Virginia: "VA",
      Washington: "WA",
      "West Virginia": "WV",
      Wisconsin: "WI",
      Wyoming: "WY",
      "District of Columbia": "DC",
    };
    return stateMap[stateName] || "CA"; // Default to CA if not found
  }

  // Get grid reliability from geographic intelligence (if available)
  let gridReliability: BasicRiskAssessment["gridReliability"];
  try {
    // Try to find state code from state name
    const stateCode = getStateCode(state);
    const geoProfile = getStateProfile(stateCode);
    gridReliability = {
      rating: geoProfile.gridReliability,
      averageOutagesPerYear: geoProfile.averageOutagesPerYear,
      typicalOutageDuration: geoProfile.typicalOutageDuration,
      notes: geoProfile.gridNotes,
    };
  } catch {
    // Fallback if geographic intelligence not available
    gridReliability = {
      rating: "good",
      averageOutagesPerYear: 1.5,
      typicalOutageDuration: 2,
    };
  }

  // Adjust grid reliability based on user-reported grid connection
  if (gridConnection === "unreliable") {
    gridReliability.rating = "poor";
    gridReliability.averageOutagesPerYear = Math.max(gridReliability.averageOutagesPerYear, 10);
  } else if (gridConnection === "off-grid" || gridConnection === "limited") {
    gridReliability.rating = "poor";
    gridReliability.notes =
      gridConnection === "off-grid" ? "No grid connection available" : "Limited grid capacity";
  }

  // Determine backup needs
  const backupRecommended =
    gridConnection === "off-grid" ||
    gridConnection === "unreliable" ||
    gridReliability.rating === "poor" ||
    gridReliability.averageOutagesPerYear >= 5;

  let backupReason = "";
  if (gridConnection === "off-grid") {
    backupReason = "Off-grid location requires backup generation";
  } else if (gridConnection === "unreliable") {
    backupReason = "Unreliable grid with frequent outages";
  } else if (gridReliability.rating === "poor") {
    backupReason = `Poor grid reliability in ${state}`;
  } else {
    backupReason = "Moderate backup power recommended for operational continuity";
  }

  return {
    solarViability: {
      peakSunHours,
      rating: solarRating,
      available: peakSunHours >= 3.0, // Minimum viable solar
    },
    gridReliability,
    backupNeeds: {
      recommended: backupRecommended,
      reason: backupReason,
    },
  };
}
