/**
 * RETAIL 16Q CALCULATOR SERVICE
 * Delegates to the SSOT v7 calculator (RETAIL_LOAD_V1_SSOT).
 */

import { RETAIL_LOAD_V1_SSOT } from "@/wizard/v7/calculators/industries/retail";

export interface Retail16QInput {
  squareFootage: number;
  retailType?:
    | "grocery"
    | "department"
    | "specialty"
    | "big-box"
    | "convenience"
    | "pharmacy"
    | "general";
  refrigerationLevel?: "none" | "light" | "moderate" | "heavy";
  operatingHours?: string;
  lightingType?: string;
  cookingOnSite?: string;
  parkingLot?: string;
  evChargers?: string;
}

export interface Retail16QResult {
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

export function calculateRetail16Q(input: Retail16QInput): Retail16QResult {
  const computeInputs: Record<string, string | number | boolean | null> = {
    squareFootage: input.squareFootage,
    retailType: input.retailType ?? "general",
    refrigerationLevel: input.refrigerationLevel ?? "light",
  };
  if (input.operatingHours != null) computeInputs.operatingHours = input.operatingHours;
  if (input.lightingType != null) computeInputs.lightingType = input.lightingType;
  if (input.cookingOnSite != null) computeInputs.cookingOnSite = input.cookingOnSite;
  if (input.parkingLot != null) computeInputs.parkingLot = input.parkingLot;
  if (input.evChargers != null) computeInputs.evChargers = input.evChargers;

  const result = RETAIL_LOAD_V1_SSOT.compute(computeInputs);

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
    methodology: "SSOT v7 — RETAIL_LOAD_V1_SSOT (CBECS 2018)",
    assumptions: result.assumptions ?? [],
    warnings: result.warnings ?? [],
  };
}
