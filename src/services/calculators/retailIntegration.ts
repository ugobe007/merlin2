import {
  calculateRetail16Q,
  type Retail16QInput,
  type Retail16QResult,
} from "./retail16QCalculator";

export function mapRetailAnswers(answers: Record<string, unknown>): Retail16QInput {
  const get = (c: string, s: string) => (answers[c] ?? answers[s] ?? "") as string;
  const num = (c: string, s: string, def: number) => {
    const v = Number(answers[c] ?? answers[s] ?? def);
    return Number.isFinite(v) ? v : def;
  };

  return {
    squareFootage: num("squareFootage", "square_footage", 20000),
    retailType: (get("retailType", "retail_type") as Retail16QInput["retailType"]) || "general",
    refrigerationLevel:
      (get("refrigerationLevel", "refrigeration_level") as Retail16QInput["refrigerationLevel"]) ||
      "light",
    operatingHours: get("operatingHours", "operating_hours") || undefined,
    lightingType: get("lightingType", "lighting_type") || undefined,
    cookingOnSite: get("cookingOnSite", "cooking_on_site") || undefined,
    parkingLot: get("parkingLot", "parking_lot") || undefined,
    evChargers: get("evChargers", "ev_chargers") || undefined,
  };
}

/**
 * Main integration function - called by Step3Integration.tsx
 * @param answers - Raw wizard answers
 * @param _ctx - Optional context (template, pricing) for enhanced calculations
 */
export function calculateRetailFromAnswers(
  answers: Record<string, unknown>,
  _ctx?: { template?: unknown; pricingConfig?: unknown; pricingStatus?: string }
): Retail16QResult | null {
  try {
    const result = calculateRetail16Q(mapRetailAnswers(answers));
    console.log("🛍️ Retail 16Q:", {
      peakKW: result.peakKW,
      bessKWh: result.bessKWh,
      confidence: result.confidence,
    });
    return result;
  } catch (e) {
    console.error("❌ Retail calc error:", e);
    return null;
  }
}
