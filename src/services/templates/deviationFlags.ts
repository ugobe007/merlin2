/**
 * Deviation Flags
 * 
 * Detects when user answers diverge significantly from template baseline.
 * Returns non-blocking warnings for display in the Advisor panel.
 * 
 * DOCTRINE:
 * - Never block the user
 * - Show "verify this" callouts, not errors
 * - Help user catch data entry mistakes
 * 
 * @version 1.0.0 (Jan 23, 2026)
 */

import type { Step3IndustryTemplate } from "@/services/useCaseService";

// =============================================================================
// TYPES
// =============================================================================

export interface DeviationFlag {
  code: string;
  severity: "info" | "warning";
  label: string;
  detail: string;
}

// =============================================================================
// CAR WASH DEVIATION FLAGS
// =============================================================================

export function getCarWashDeviationFlags(
  answers: Record<string, unknown>,
  template: Step3IndustryTemplate | null | undefined
): DeviationFlag[] {
  if (!template?.loadProfile) return [];

  const flags: DeviationFlag[] = [];
  const lp = template.loadProfile;

  // Check: Monthly spend vs expected baseline
  const spendMap: Record<string, number> = {
    "under_1500": 1000,
    "1500-3000": 2250,
    "3000-7500": 5250,
    "7500-15000": 11250,
    "15000+": 20000,
  };
  
  const reportedSpend = spendMap[answers.monthlyElectricitySpend as string];
  if (reportedSpend && lp.baseline_kw) {
    // Expected: baseline_kw * 12hrs * 30days * $0.12/kWh
    const expectedSpend = lp.baseline_kw * 12 * 30 * 0.12;
    const ratio = reportedSpend / expectedSpend;

    if (ratio > 2.0) {
      flags.push({
        code: "spend_high",
        severity: "warning",
        label: "Electricity spend seems high",
        detail: `Your monthly spend (${answers.monthlyElectricitySpend}) is significantly higher than typical for this equipment profile. Double-check your utility bills or equipment load.`,
      });
    } else if (ratio < 0.4) {
      flags.push({
        code: "spend_low",
        severity: "info",
        label: "Electricity spend seems low",
        detail: `Your monthly spend (${answers.monthlyElectricitySpend}) is lower than typical. This may limit BESS savings potential.`,
      });
    }
  }

  // Check: Operating hours vs peak demand
  const hoursMap: Record<string, number> = {
    "under_8": 6,
    "8-12": 10,
    "12-16": 14,
    "16-24": 20,
    "24_7": 24,
  };

  const hours = hoursMap[answers.operatingHours as string];
  if (hours && lp.peak_kw && lp.peak_kw > 150 && hours < 10) {
    flags.push({
      code: "high_power_short_hours",
      severity: "info",
      label: "High capacity, short operating hours",
      detail: `Your equipment profile suggests high power draw (${Math.round(lp.peak_kw)} kW peak) but limited operating hours. Consider if all equipment is captured.`,
    });
  }

  // Check: Equipment count mismatch
  const equipCount = template.equipmentSummary?.total_equipment;
  if (equipCount && equipCount > 10 && answers.simultaneousEquipment === "1-2") {
    flags.push({
      code: "equipment_utilization_low",
      severity: "info",
      label: "Low simultaneous equipment usage",
      detail: `Template shows ${equipCount} equipment items, but you indicated only 1-2 run simultaneously. Verify your peak load assumptions.`,
    });
  }

  return flags;
}

// =============================================================================
// HOTEL DEVIATION FLAGS
// =============================================================================

export function getHotelDeviationFlags(
  answers: Record<string, unknown>,
  template: Step3IndustryTemplate | null | undefined
): DeviationFlag[] {
  if (!template?.loadProfile) return [];

  const flags: DeviationFlag[] = [];
  const lp = template.loadProfile;

  // Check: Room count vs baseline power
  const roomsMap: Record<string, number> = {
    "under_50": 30,
    "50-100": 75,
    "100-150": 125,
    "150-300": 225,
    "300+": 400,
  };

  const rooms = roomsMap[answers.roomCount as string];
  if (rooms && lp.baseline_kw) {
    const expectedKwPerRoom = lp.baseline_kw / rooms;
    
    if (expectedKwPerRoom > 5) {
      flags.push({
        code: "high_kw_per_room",
        severity: "info",
        label: "Power per room seems high",
        detail: `Based on your equipment profile, power per room (${expectedKwPerRoom.toFixed(1)} kW) is higher than typical (1.5-3 kW). Check for additional loads like pools or restaurants.`,
      });
    }
  }

  return flags;
}

// =============================================================================
// MASTER DISPATCHER
// =============================================================================

/**
 * Get deviation flags for an industry
 * 
 * @param industry - Normalized industry slug
 * @param answers - Current wizard answers
 * @param template - Template from getStep3IndustryTemplateByUseCase()
 * @returns Array of non-blocking warnings
 */
export function getDeviationFlags(
  industry: string,
  answers: Record<string, unknown>,
  template: Step3IndustryTemplate | null | undefined
): DeviationFlag[] {
  switch (industry) {
    case "car-wash":
      return getCarWashDeviationFlags(answers, template);
    case "hotel":
      return getHotelDeviationFlags(answers, template);
    default:
      return [];
  }
}
