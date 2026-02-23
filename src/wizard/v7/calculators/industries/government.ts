import type { CalculatorContract, CalcInputs, CalcRunResult, CalcValidation } from "../contract";
import { calculateUseCasePower } from "@/services/useCasePowerCalculations";
import { buildSSOTInput } from "../ssotInputAliases";

export const GOVERNMENT_LOAD_V1_SSOT: CalculatorContract = {
  id: "government_load_v1",
  requiredInputs: ["squareFootage"] as const,

  compute: (inputs: CalcInputs): CalcRunResult => {
    const warnings: string[] = [];
    const assumptions: string[] = [];

    // ── Bridge curated → SSOT fields ───────────────────────────────
    const squareFootage =
      Number(inputs.squareFootage ?? inputs.buildingSqFt ?? inputs.sqFt) || 75000;
    const facilityType = String(inputs.facilityType ?? "office-building").toLowerCase();
    const campusOrStandalone = String(inputs.campusOrStandalone ?? "standalone").toLowerCase();
    const hasCriticalOps =
      inputs.criticalOperations &&
      inputs.criticalOperations !== "none" &&
      inputs.criticalOperations !== "no";
    const hasDataCenter =
      inputs.dataCenter && inputs.dataCenter !== "none" && inputs.dataCenter !== "no";
    const hasEVFleet = inputs.evFleet && inputs.evFleet !== "none" && inputs.evFleet !== "no";
    const operatingHours = String(inputs.operatingHours ?? "standard").toLowerCase();

    assumptions.push(`Government: ${squareFootage.toLocaleString()} sq ft (${facilityType})`);
    assumptions.push(`Configuration: ${campusOrStandalone}, hours: ${operatingHours}`);
    if (hasCriticalOps) assumptions.push(`Critical operations: ${inputs.criticalOperations}`);
    if (hasDataCenter) assumptions.push(`Data center: ${inputs.dataCenter}`);
    if (hasEVFleet) assumptions.push(`EV fleet: ${inputs.evFleet}`);

    // ── Delegate to SSOT ───────────────────────────────────────────
    const result = calculateUseCasePower("government", {
      squareFeet: squareFootage,
      buildingSqFt: squareFootage,
      sqFt: squareFootage,
    });
    const peakLoadKW = Math.round(result.powerMW * 1000);

    // ── TrueQuote kW contributor breakdown ─────────────────────────
    // Government: similar to office but higher security/IT loads
    const hvacPct = 0.35;
    const lightingPct = 0.15;
    const itPct = hasDataCenter ? 0.15 : 0.08;
    const securityPct = hasCriticalOps ? 0.1 : 0.05;
    const evFleetPct = hasEVFleet ? 0.08 : 0;
    const controlsPct = 0.05;
    const otherPct = Math.max(
      0.05,
      1.0 - hvacPct - lightingPct - itPct - securityPct - evFleetPct - controlsPct
    );

    const hvacKW = peakLoadKW * hvacPct;
    const lightingKW = peakLoadKW * lightingPct;
    const itLoadKW = peakLoadKW * itPct;
    const processKW = peakLoadKW * securityPct;
    const chargingKW = peakLoadKW * evFleetPct;
    const controlsKW = peakLoadKW * controlsPct;
    const otherKW = peakLoadKW * otherPct;
    const kWContributorsTotalKW =
      hvacKW + lightingKW + itLoadKW + processKW + chargingKW + controlsKW + otherKW;

    // Duty cycle: standard office hours unless 24/7 ops
    const is24x7 =
      operatingHours.includes("24") || operatingHours.includes("always") || hasCriticalOps;
    const dutyCycle = is24x7 ? 0.7 : 0.45;
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
        charging: chargingKW,
        other: otherKW,
      },
      kWContributorsTotalKW,
      kWContributorShares: {
        hvacPct: hvacPct * 100,
        lightingPct: lightingPct * 100,
        processPct: securityPct * 100,
        controlsPct: controlsPct * 100,
        itLoadPct: itPct * 100,
        coolingPct: 0,
        chargingPct: evFleetPct * 100,
        otherPct: otherPct * 100,
      },
      details: {
        government: {
          squareFootage,
          facilityType,
          campusOrStandalone,
          hasCriticalOps,
          hasDataCenter,
          hasEVFleet,
          operatingHours,
        },
      },
      notes: [
        `Government: ${squareFootage.toLocaleString()} sq ft → ${peakLoadKW.toLocaleString()} kW (FEMP 1.5 W/sqft)`,
        `IT: ${(itPct * 100).toFixed(0)}%, Security: ${(securityPct * 100).toFixed(0)}%${hasEVFleet ? `, EV fleet: ${(evFleetPct * 100).toFixed(0)}%` : ""}`,
        `Duty cycle: ${dutyCycle} (${is24x7 ? "24/7 operations" : "standard business hours"})`,
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

// ══════════════════════════════════════════════════════
// SHOPPING CENTER SSOT ADAPTER
// ══════════════════════════════════════════════════════

/**
 * SHOPPING CENTER SSOT ADAPTER
 *
 * CalcValidation v1 envelope with contributor breakdown.
 * SSOT: calculateUseCasePower("shopping-center", { squareFeet }) → 10 W/sqft (CBECS mall)
 *
 * Contributor model:
 *   hvac (35%) — Large open spaces, high foot traffic, food court
 *   lighting (30%) — Extensive display, accent, parking lot
 *   process (15%) — Food court, escalators, elevators
 *   controls (5%) — BMS, security, fire systems
 *   other (15%) — Common areas, loading, signage
 */
