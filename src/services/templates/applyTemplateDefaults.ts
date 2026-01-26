/**
 * Template Defaults Adapter
 * 
 * Hydrates missing wizard answers from industry template baseline data.
 * 
 * DOCTRINE:
 * - NEVER overwrite a user's existing answer
 * - Only fill null/undefined/empty fields
 * - One-shot hydration (called once when template arrives)
 * 
 * @version 1.0.0 (Jan 23, 2026)
 */

import type { Step3IndustryTemplate } from "@/services/useCaseService";

// =============================================================================
// GENERIC HYDRATION HELPER
// =============================================================================

/**
 * Safe setter: only fills if target is null/undefined/empty string
 */
function fillIfMissing<T extends Record<string, unknown>>(
  obj: T,
  key: keyof T,
  value: unknown
): void {
  const current = obj[key];
  if (current == null || current === "") {
    (obj as Record<string, unknown>)[key as string] = value;
  }
}

// =============================================================================
// CAR WASH TEMPLATE DEFAULTS
// =============================================================================

/**
 * Maps template load profile to car wash wizard answers
 * 
 * Template loadProfile shape:
 * - baseline_kw: number
 * - peak_kw: number
 * - diversity_factor: number (0.35-0.95)
 * - duty_cycle_hint: string
 */
export function applyCarWashTemplateDefaults(
  answers: Record<string, unknown>,
  template: Step3IndustryTemplate | null | undefined
): Record<string, unknown> {
  if (!template?.loadProfile) return answers;

  const next = { ...answers };
  const lp = template.loadProfile;

  // Map baseline_kw to monthly spend estimate (rough heuristic)
  // Typical car wash: baseline_kw * 12 hrs/day * 30 days * $0.12/kWh ≈ monthly bill
  if (lp.baseline_kw && next.monthlyElectricitySpend == null) {
    const estimatedMonthly = lp.baseline_kw * 12 * 30 * 0.12;
    // Map to wizard range options
    if (estimatedMonthly < 1500) {
      fillIfMissing(next, "monthlyElectricitySpend", "under_1500");
    } else if (estimatedMonthly < 3000) {
      fillIfMissing(next, "monthlyElectricitySpend", "1500-3000");
    } else if (estimatedMonthly < 7500) {
      fillIfMissing(next, "monthlyElectricitySpend", "3000-7500");
    } else {
      fillIfMissing(next, "monthlyElectricitySpend", "7500-15000");
    }
  }

  // Map peak_kw to operating hours hint
  // Higher peak → likely longer hours
  if (lp.peak_kw && lp.peak_kw > 100 && next.operatingHours == null) {
    fillIfMissing(next, "operatingHours", "12-16");
  } else if (lp.peak_kw && next.operatingHours == null) {
    fillIfMissing(next, "operatingHours", "8-12");
  }

  // Map diversity factor to simultaneous equipment
  // Higher diversity = more equipment running at once
  if (lp.diversity_factor != null && next.simultaneousEquipment == null) {
    if (lp.diversity_factor > 0.75) {
      fillIfMissing(next, "simultaneousEquipment", "5+");
    } else if (lp.diversity_factor > 0.55) {
      fillIfMissing(next, "simultaneousEquipment", "3-4");
    } else {
      fillIfMissing(next, "simultaneousEquipment", "1-2");
    }
  }

  return next;
}

// =============================================================================
// HOTEL TEMPLATE DEFAULTS
// =============================================================================

export function applyHotelTemplateDefaults(
  answers: Record<string, unknown>,
  template: Step3IndustryTemplate | null | undefined
): Record<string, unknown> {
  if (!template?.loadProfile) return answers;

  const next = { ...answers };
  const lp = template.loadProfile;

  // Map baseline_kw to room count estimate (rough: 1.5-3 kW per room)
  if (lp.baseline_kw && next.roomCount == null) {
    const estimatedRooms = Math.round(lp.baseline_kw / 2);
    if (estimatedRooms < 50) {
      fillIfMissing(next, "roomCount", "under_50");
    } else if (estimatedRooms < 100) {
      fillIfMissing(next, "roomCount", "50-100");
    } else if (estimatedRooms < 150) {
      fillIfMissing(next, "roomCount", "100-150");
    } else {
      fillIfMissing(next, "roomCount", "150-300");
    }
  }

  return next;
}

// =============================================================================
// MASTER DISPATCHER
// =============================================================================

/**
 * Apply industry-specific template defaults to answers
 * 
 * @param industry - Normalized industry slug (e.g., "car-wash")
 * @param answers - Current wizard answers
 * @param template - Template from getStep3IndustryTemplateByUseCase()
 * @returns Hydrated answers (new object, original not mutated)
 */
export function applyTemplateDefaults(
  industry: string,
  answers: Record<string, unknown>,
  template: Step3IndustryTemplate | null | undefined
): Record<string, unknown> {
  switch (industry) {
    case "car-wash":
      return applyCarWashTemplateDefaults(answers, template);
    case "hotel":
      return applyHotelTemplateDefaults(answers, template);
    // Add more industries as needed
    default:
      return answers;
  }
}
