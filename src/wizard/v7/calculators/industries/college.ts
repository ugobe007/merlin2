import type { CalculatorContract, CalcInputs, CalcRunResult, CalcValidation } from "../contract";
import { calculateUseCasePower } from "@/services/useCasePowerCalculations";
import { buildSSOTInput } from "../ssotInputAliases";

export const COLLEGE_LOAD_V1_SSOT: CalculatorContract = {
  id: "college_load_v1",
  requiredInputs: ["enrollment"] as const,

  compute: (inputs: CalcInputs): CalcRunResult => {
    const warnings: string[] = [];
    const assumptions: string[] = [];

    // ── Bridge curated → SSOT fields ───────────────────────────────
    const _rawEnrollment = inputs.enrollment ?? inputs.studentCount ?? inputs.students;
    const enrollment = _rawEnrollment != null ? (Number(_rawEnrollment) || 15000) : 15000;
    const campusSqFt = Number(inputs.campusSqFt) || 0;
    const institutionType = String(inputs.institutionType ?? "university").toLowerCase();
    const hasResearchLabs =
      inputs.researchLabs && inputs.researchLabs !== "none" && inputs.researchLabs !== "no";
    const hasStudentHousing =
      inputs.studentHousing && inputs.studentHousing !== "none" && inputs.studentHousing !== "no";
    const hasDataCenter =
      inputs.dataCenterHPC && inputs.dataCenterHPC !== "none" && inputs.dataCenterHPC !== "no";

    assumptions.push(`${enrollment.toLocaleString()} students (${institutionType})`);
    if (campusSqFt > 0) assumptions.push(`Campus: ${campusSqFt.toLocaleString()} sq ft`);
    if (hasResearchLabs) assumptions.push(`Research labs: ${inputs.researchLabs}`);
    if (hasStudentHousing) assumptions.push(`Housing: ${inputs.studentHousing}`);
    if (hasDataCenter) assumptions.push(`Data center/HPC: ${inputs.dataCenterHPC}`);

    // ── Delegate to SSOT ───────────────────────────────────────────
    const result = calculateUseCasePower("college", { studentCount: enrollment, enrollment });
    const peakLoadKW = Math.round(result.powerMW * 1000);

    // ── TrueQuote kW contributor breakdown ─────────────────────────
    // College: classrooms, labs, housing, dining, athletics, IT
    const hvacPct = 0.3;
    const lightingPct = 0.15;
    const labsPct = hasResearchLabs ? 0.15 : 0.05;
    const housingPct = hasStudentHousing ? 0.12 : 0;
    const itPct = hasDataCenter ? 0.1 : 0.05;
    const controlsPct = 0.05;
    const otherPct = Math.max(
      0.08,
      1.0 - hvacPct - lightingPct - labsPct - housingPct - itPct - controlsPct
    );

    const hvacKW = peakLoadKW * hvacPct;
    const lightingKW = peakLoadKW * lightingPct;
    const processKW = peakLoadKW * (labsPct + housingPct);
    const controlsKW = peakLoadKW * controlsPct;
    const itLoadKW = peakLoadKW * itPct;
    const otherKW = peakLoadKW * otherPct;
    const kWContributorsTotalKW = hvacKW + lightingKW + processKW + controlsKW + itLoadKW + otherKW;

    const dutyCycle = 0.5; // Campus: heavy daytime, light evenings/weekends
    const baseLoadKW = Math.round(peakLoadKW * dutyCycle);

    const validation: CalcValidation = {
      version: "v1",
      dutyCycle,
      kWContributors: {
        hvac: hvacKW,
        lighting: lightingKW,
        process: processKW,
        controls: controlsKW,
        itLoad: itLoadKW,
        cooling: 0,
        charging: 0,
        other: otherKW,
      },
      kWContributorsTotalKW,
      kWContributorShares: {
        hvacPct: hvacPct * 100,
        lightingPct: lightingPct * 100,
        processPct: (labsPct + housingPct) * 100,
        controlsPct: controlsPct * 100,
        itLoadPct: itPct * 100,
        coolingPct: 0,
        chargingPct: 0,
        otherPct: otherPct * 100,
      },
      details: {
        college: {
          enrollment,
          campusSqFt,
          institutionType,
          hasResearchLabs,
          hasStudentHousing,
          hasDataCenter,
        },
      },
      notes: [
        `College: ${enrollment.toLocaleString()} students × 0.5 kW → ${peakLoadKW.toLocaleString()} kW (AASHE benchmark)`,
        `Labs: ${(labsPct * 100).toFixed(0)}%, Housing: ${(housingPct * 100).toFixed(0)}%, IT: ${(itPct * 100).toFixed(0)}%`,
        `Campus duty cycle: ${dutyCycle} (daytime-heavy, light weekends)`,
      ],
    };

    return {
      baseLoadKW,
      peakLoadKW,
      energyKWhPerDay: Math.round(baseLoadKW * 24),
      assumptions,
      warnings,
      validation,
      raw: result,
    };
  },
};

/**
 * COLD STORAGE SSOT ADAPTER
 *
 * Curated fields: facilityType, squareFootage, temperatureZones, dockDoors,
 *   compressorSystem, operatingHours, defrostCycles, materialHandling, throughput
 * SSOT: calculateUseCasePower("cold-storage", ...) → calculateWarehousePower(sqFt, true)
 * Source: CBECS cold storage benchmark (8 W/sq ft refrigerated)
 */
