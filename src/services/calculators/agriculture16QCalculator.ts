/**
 * AGRICULTURE 16Q CALCULATOR SERVICE
 * Delegates to the SSOT v7 calculator (AGRICULTURE_LOAD_V1_SSOT).
 */

import { AGRICULTURE_LOAD_V1_SSOT } from "@/wizard/v7/calculators/industries/agriculture";

export interface Agriculture16QInput {
  acreage: number;
  farmType?: string;
  irrigationType?:
    | "center-pivot"
    | "drip-micro"
    | "flood-furrow"
    | "sprinkler"
    | "none"
    | "dry-farm";
  buildingsSqFt?: number;
  processing?: string;
  dairyMilking?: string;
  coldStorage?: string;
  grainDrying?: string;
}

export interface Agriculture16QResult {
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

export function calculateAgriculture16Q(input: Agriculture16QInput): Agriculture16QResult {
  const computeInputs: Record<string, string | number | boolean | null> = {
    acreage: input.acreage,
    farmType: input.farmType ?? "mixed",
    irrigationType: input.irrigationType ?? "center-pivot",
  };
  if (input.buildingsSqFt != null && input.buildingsSqFt > 0)
    computeInputs.buildingsSqFt = input.buildingsSqFt;
  if (input.processing != null) computeInputs.processing = input.processing;
  if (input.dairyMilking != null) computeInputs.dairyMilking = input.dairyMilking;
  if (input.coldStorage != null) computeInputs.coldStorage = input.coldStorage;
  if (input.grainDrying != null) computeInputs.grainDrying = input.grainDrying;

  const result = AGRICULTURE_LOAD_V1_SSOT.compute(computeInputs);

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
    confidence: 75,
    methodology: "SSOT v7 — AGRICULTURE_LOAD_V1_SSOT (USDA NASS + ASHRAE)",
    assumptions: result.assumptions ?? [],
    warnings: result.warnings ?? [],
  };
}
