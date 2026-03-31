import {
  calculateManufacturing16Q,
  type Manufacturing16QInput,
  type Manufacturing16QResult,
} from "./manufacturing16QCalculator";

export function mapManufacturingAnswers(answers: Record<string, unknown>): Manufacturing16QInput {
  const get = (c: string, s: string) => (answers[c] ?? answers[s] ?? "") as string;
  const num = (c: string, s: string, def: number) => {
    const v = Number(answers[c] ?? answers[s] ?? def);
    return Number.isFinite(v) ? v : def;
  };
  const bool = (c: string, s: string) => {
    const v = answers[c] ?? answers[s];
    return v === true || v === "true" || v === "yes";
  };

  return {
    squareFootage: num("squareFootage", "square_footage", 100000),
    manufacturingType:
      (get(
        "manufacturingType",
        "manufacturing_type"
      ) as Manufacturing16QInput["manufacturingType"]) || "light",
    shiftPattern:
      (get("shiftPattern", "shift_pattern") as Manufacturing16QInput["shiftPattern"]) || "1-shift",
    hasCompressedAir: bool("hasCompressedAir", "has_compressed_air"),
    compressorHP: num("compressorHP", "compressor_hp", 0),
    hasElectricFurnace: bool("hasElectricFurnace", "has_electric_furnace"),
    furnaceKW: num("furnaceKW", "furnace_kw", 0),
    hasCNCMachines: bool("hasCNCMachines", "has_cnc_machines"),
    cncCount: num("cncCount", "cnc_count", 0),
    hasRefrigeration: bool("hasRefrigeration", "has_refrigeration"),
    cleanRoom: bool("cleanRoom", "clean_room"),
    processCooling: bool("processCooling", "process_cooling"),
  };
}

/**
 * Main integration function - called by Step3Integration.tsx
 * @param answers - Raw wizard answers
 * @param _ctx - Optional context (template, pricing) for enhanced calculations
 */
export function calculateManufacturingFromAnswers(
  answers: Record<string, unknown>,
  _ctx?: { template?: unknown; pricingConfig?: unknown; pricingStatus?: string }
): Manufacturing16QResult | null {
  try {
    const result = calculateManufacturing16Q(mapManufacturingAnswers(answers));
    console.log("🏭 Manufacturing 16Q:", {
      peakKW: result.peakKW,
      bessKWh: result.bessKWh,
      confidence: result.confidence,
    });
    return result;
  } catch (e) {
    console.error("❌ Manufacturing calc error:", e);
    return null;
  }
}
