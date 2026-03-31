/**
 * COLLEGE 16Q CALCULATOR SERVICE
 * Delegates to the SSOT v7 calculator (COLLEGE_LOAD_V1_SSOT).
 */

import { COLLEGE_LOAD_V1_SSOT } from "@/wizard/v7/calculators/industries/college";

export interface College16QInput {
  enrollment: number;
  campusSqFt?: number;
  institutionType?: "community-college" | "university" | "liberal-arts" | "technical";
  researchLabs?: string;
  studentHousing?: string;
  dataCenterHPC?: string;
}

export interface College16QResult {
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

export function calculateCollege16Q(input: College16QInput): College16QResult {
  const computeInputs: Record<string, string | number | boolean | null> = {
    enrollment: input.enrollment,
    institutionType: input.institutionType ?? "university",
  };
  if (input.campusSqFt != null && input.campusSqFt > 0) computeInputs.campusSqFt = input.campusSqFt;
  if (input.researchLabs != null) computeInputs.researchLabs = input.researchLabs;
  if (input.studentHousing != null) computeInputs.studentHousing = input.studentHousing;
  if (input.dataCenterHPC != null) computeInputs.dataCenterHPC = input.dataCenterHPC;

  const result = COLLEGE_LOAD_V1_SSOT.compute(computeInputs);

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
    methodology: "SSOT v7 — COLLEGE_LOAD_V1_SSOT (APPA + DOE Campus Energy)",
    assumptions: result.assumptions ?? [],
    warnings: result.warnings ?? [],
  };
}
