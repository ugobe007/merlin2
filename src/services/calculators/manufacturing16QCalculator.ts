/**
 * MANUFACTURING 16Q CALCULATOR SERVICE
 * Delegates to the SSOT v7 calculator (MANUFACTURING_LOAD_V1_SSOT).
 */

import { MANUFACTURING_LOAD_V1_SSOT } from "@/wizard/v7/calculators/industries/manufacturing";

export interface Manufacturing16QInput {
  squareFootage: number;
  manufacturingType?: "light" | "medium" | "heavy" | "electronics" | "food";
  shiftPattern?: "1-shift" | "2-shift" | "3-shift";
  hasCompressedAir?: boolean;
  compressorHP?: number;
  hasElectricFurnace?: boolean;
  furnaceKW?: number;
  hasCNCMachines?: boolean;
  cncCount?: number;
  hasRefrigeration?: boolean;
  cleanRoom?: boolean;
  processCooling?: boolean;
}

export interface Manufacturing16QResult {
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

export function calculateManufacturing16Q(input: Manufacturing16QInput): Manufacturing16QResult {
  const result = MANUFACTURING_LOAD_V1_SSOT.compute({
    squareFootage: input.squareFootage,
    manufacturingType: input.manufacturingType ?? "light",
    shiftPattern: input.shiftPattern ?? "1-shift",
    hasCompressedAir: input.hasCompressedAir ?? false,
    compressorHP: input.compressorHP ?? 0,
    hasElectricFurnace: input.hasElectricFurnace ?? false,
    furnaceKW: input.furnaceKW ?? 0,
    hasCNCMachines: input.hasCNCMachines ?? false,
    cncCount: input.cncCount ?? 0,
    hasRefrigeration: input.hasRefrigeration ?? false,
    cleanRoom: input.cleanRoom ?? false,
    processCooling: input.processCooling ?? false,
  });

  const peakKW = result.peakLoadKW ?? 0;
  const durationHours = 4;
  const bessKWh = Math.round(peakKW * durationHours * 0.4); // 40% demand coverage
  const bessMW = bessKWh / (durationHours * 1000);

  return {
    peakKW,
    baseLoadKW: result.baseLoadKW ?? 0,
    bessKWh,
    bessMW: parseFloat(bessMW.toFixed(3)),
    durationHours,
    confidence: 80,
    methodology: "SSOT v7 — MANUFACTURING_LOAD_V1_SSOT (CBECS + ASHRAE 90.1)",
    assumptions: result.assumptions ?? [],
    warnings: result.warnings ?? [],
  };
}
