/**
 * RESTAURANT 16Q CALCULATOR SERVICE
 * Delegates to the SSOT v7 calculator (RESTAURANT_LOAD_V1_SSOT).
 */

import { RESTAURANT_LOAD_V1_SSOT } from "@/wizard/v7/calculators/industries/restaurant";

export interface Restaurant16QInput {
  seatingCapacity: number;
  restaurantType?:
    | "fast-food"
    | "cafe"
    | "casual"
    | "full-service"
    | "fine-dining"
    | "food-hall"
    | "buffet";
  outdoorSeating?: string;
  barService?: string;
  deliveryVolume?: string;
  driveThru?: string;
  hoursOfOperation?: string;
}

export interface Restaurant16QResult {
  peakKW: number;
  baseLoadKW: number;
  bessKWh: number;
  bessMW: number;
  durationHours: number;
  confidence: number;
  methodology: string;
  assumptions: string[];
  warnings: string[];
}

export function calculateRestaurant16Q(input: Restaurant16QInput): Restaurant16QResult {
  const computeInputs: Record<string, string | number | boolean | null> = {
    seatingCapacity: input.seatingCapacity,
    restaurantType: input.restaurantType ?? "full-service",
  };
  if (input.outdoorSeating != null) computeInputs.outdoorSeating = input.outdoorSeating;
  if (input.barService != null) computeInputs.barService = input.barService;
  if (input.deliveryVolume != null) computeInputs.deliveryVolume = input.deliveryVolume;
  if (input.driveThru != null) computeInputs.driveThru = input.driveThru;
  if (input.hoursOfOperation != null) computeInputs.hoursOfOperation = input.hoursOfOperation;

  const result = RESTAURANT_LOAD_V1_SSOT.compute(computeInputs);

  const peakKW = result.peakLoadKW ?? 0;
  const durationHours = 4;
  const bessKWh = Math.round(peakKW * durationHours * 0.4);
  const bessMW = bessKWh / (durationHours * 1000);

  return {
    peakKW,
    baseLoadKW: result.baseLoadKW ?? 0,
    bessKWh,
    bessMW: parseFloat(bessMW.toFixed(3)),
    durationHours,
    confidence: 80,
    methodology: "SSOT v7 — RESTAURANT_LOAD_V1_SSOT (CBECS 2018 + PG&E Kitchen Studies)",
    assumptions: result.assumptions ?? [],
    warnings: result.warnings ?? [],
  };
}
