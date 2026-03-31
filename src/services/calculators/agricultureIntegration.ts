import {
  calculateAgriculture16Q,
  type Agriculture16QInput,
  type Agriculture16QResult,
} from "./agriculture16QCalculator";

export function mapAgricultureAnswers(answers: Record<string, unknown>): Agriculture16QInput {
  const get = (c: string, s: string) => (answers[c] ?? answers[s] ?? "") as string;
  const num = (c: string, s: string, def: number) => {
    const v = Number(answers[c] ?? answers[s] ?? def);
    return Number.isFinite(v) ? v : def;
  };

  return {
    acreage: num("acreage", "farm_size", 500),
    farmType: get("farmType", "farm_type") || "mixed",
    irrigationType:
      (get("irrigationType", "irrigation_type") as Agriculture16QInput["irrigationType"]) ||
      "center-pivot",
    buildingsSqFt: num("buildingsSqFt", "buildings_sq_ft", 0) || undefined,
    processing: get("processing", "on_site_processing") || undefined,
    dairyMilking: get("dairyMilking", "dairy_milking") || undefined,
    coldStorage: get("coldStorage", "cold_storage") || undefined,
    grainDrying: get("grainDrying", "grain_drying") || undefined,
  };
}

/**
 * Main integration function - called by Step3Integration.tsx
 * @param answers - Raw wizard answers
 * @param _ctx - Optional context (template, pricing) for enhanced calculations
 */
export function calculateAgricultureFromAnswers(
  answers: Record<string, unknown>,
  _ctx?: { template?: unknown; pricingConfig?: unknown; pricingStatus?: string }
): Agriculture16QResult | null {
  try {
    const result = calculateAgriculture16Q(mapAgricultureAnswers(answers));
    console.log("🌾 Agriculture 16Q:", {
      peakKW: result.peakKW,
      bessKWh: result.bessKWh,
      confidence: result.confidence,
    });
    return result;
  } catch (e) {
    console.error("❌ Agriculture calc error:", e);
    return null;
  }
}
