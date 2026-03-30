import {
  calculateWarehouse16Q,
  type Warehouse16QInput,
  type Warehouse16QResult,
} from "./warehouse16QCalculator";

export function mapWarehouseAnswers(answers: Record<string, unknown>): Warehouse16QInput {
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
    squareFootage: num("squareFootage", "square_footage", 200000),
    warehouseType:
      (get("warehouseType", "warehouse_type") as Warehouse16QInput["warehouseType"]) || "ambient",
    isColdStorage: bool("isColdStorage", "is_cold_storage"),
    refrigeration: get("refrigeration", "refrigeration") || undefined,
    ceilingHeight: get("ceilingHeight", "ceiling_height") || undefined,
    dockDoors: get("dockDoors", "dock_doors") || undefined,
    materialHandling: get("materialHandling", "material_handling") || undefined,
    automationLevel: get("automationLevel", "automation_level") || undefined,
    operatingHours: get("operatingHours", "operating_hours") || undefined,
    evFleet: get("evFleet", "ev_fleet") || undefined,
  };
}

/**
 * Main integration function - called by Step3Integration.tsx
 * @param answers - Raw wizard answers
 * @param _ctx - Optional context (template, pricing) for enhanced calculations
 */
export function calculateWarehouseFromAnswers(
  answers: Record<string, unknown>,
  _ctx?: { template?: unknown; pricingConfig?: unknown; pricingStatus?: string }
): Warehouse16QResult | null {
  try {
    const result = calculateWarehouse16Q(mapWarehouseAnswers(answers));
    console.log("📦 Warehouse 16Q:", {
      peakKW: result.peakKW,
      bessKWh: result.bessKWh,
      confidence: result.confidence,
    });
    return result;
  } catch (e) {
    console.error("❌ Warehouse calc error:", e);
    return null;
  }
}
