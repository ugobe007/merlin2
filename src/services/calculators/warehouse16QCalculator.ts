/**
 * WAREHOUSE 16Q CALCULATOR SERVICE
 * Delegates to the SSOT v7 calculator (WAREHOUSE_LOAD_V1_SSOT).
 */

import { WAREHOUSE_LOAD_V1_SSOT } from "@/wizard/v7/calculators/industries/warehouse";

export interface Warehouse16QInput {
  squareFootage: number;
  warehouseType?: "ambient" | "cold-storage" | "freezer" | "mixed";
  isColdStorage?: boolean;
  refrigeration?: string;
  ceilingHeight?: string;
  dockDoors?: string;
  materialHandling?: string;
  automationLevel?: string;
  operatingHours?: string;
  evFleet?: string;
}

export interface Warehouse16QResult {
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

export function calculateWarehouse16Q(input: Warehouse16QInput): Warehouse16QResult {
  const computeInputs: Record<string, string | number | boolean | null> = {
    squareFootage: input.squareFootage,
    isColdStorage: input.isColdStorage ?? false,
  };
  if (input.warehouseType != null) computeInputs.warehouseType = input.warehouseType;
  if (input.refrigeration != null) computeInputs.refrigeration = input.refrigeration;
  if (input.ceilingHeight != null) computeInputs.ceilingHeight = input.ceilingHeight;
  if (input.dockDoors != null) computeInputs.dockDoors = input.dockDoors;
  if (input.materialHandling != null) computeInputs.materialHandling = input.materialHandling;
  if (input.automationLevel != null) computeInputs.automationLevel = input.automationLevel;
  if (input.operatingHours != null) computeInputs.operatingHours = input.operatingHours;
  if (input.evFleet != null) computeInputs.evFleet = input.evFleet;

  const result = WAREHOUSE_LOAD_V1_SSOT.compute(computeInputs);

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
    methodology: "SSOT v7 — WAREHOUSE_LOAD_V1_SSOT (CBECS 2018)",
    assumptions: result.assumptions ?? [],
    warnings: result.warnings ?? [],
  };
}
