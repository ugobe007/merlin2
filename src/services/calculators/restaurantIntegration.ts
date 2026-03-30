import {
  calculateRestaurant16Q,
  type Restaurant16QInput,
  type Restaurant16QResult,
} from "./restaurant16QCalculator";

export function mapRestaurantAnswers(answers: Record<string, unknown>): Restaurant16QInput {
  const get = (c: string, s: string) => (answers[c] ?? answers[s] ?? "") as string;
  const num = (c: string, s: string, def: number) => {
    const v = Number(answers[c] ?? answers[s] ?? def);
    return Number.isFinite(v) ? v : def;
  };

  return {
    seatingCapacity: num("seatingCapacity", "seating_capacity", 100),
    restaurantType:
      (get("restaurantType", "restaurant_type") as Restaurant16QInput["restaurantType"]) ||
      "full-service",
    outdoorSeating: get("outdoorSeating", "outdoor_seating") || undefined,
    barService: get("barService", "bar_service") || undefined,
    deliveryVolume: get("deliveryVolume", "delivery_volume") || undefined,
    driveThru: get("driveThru", "drive_thru") || undefined,
    hoursOfOperation: get("hoursOfOperation", "hours_of_operation") || undefined,
  };
}

/**
 * Main integration function - called by Step3Integration.tsx
 * @param answers - Raw wizard answers
 * @param _ctx - Optional context (template, pricing) for enhanced calculations
 */
export function calculateRestaurantFromAnswers(
  answers: Record<string, unknown>,
  _ctx?: { template?: unknown; pricingConfig?: unknown; pricingStatus?: string }
): Restaurant16QResult | null {
  try {
    const result = calculateRestaurant16Q(mapRestaurantAnswers(answers));
    console.log("🍽️ Restaurant 16Q:", {
      peakKW: result.peakKW,
      bessKWh: result.bessKWh,
      confidence: result.confidence,
    });
    return result;
  } catch (e) {
    console.error("❌ Restaurant calc error:", e);
    return null;
  }
}
