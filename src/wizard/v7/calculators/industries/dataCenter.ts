import type { CalculatorContract, CalcInputs, CalcRunResult, CalcValidation } from "../contract";
import { calculateUseCasePower } from "@/services/useCasePowerCalculations";
import { buildSSOTInput } from "../ssotInputAliases";

export const DC_LOAD_V1_SSOT: CalculatorContract = {
  id: "dc_load_v1",
  requiredInputs: ["itLoadCapacity", "currentPUE", "itUtilization", "dataCenterTier"] as const,

  compute: (inputs: CalcInputs): CalcRunResult => {
    const warnings: string[] = [];
    const assumptions: string[] = [];

    // 1. Parse fields from template mapping (itLoadCapacity, currentPUE, etc.)
    //    Then translate to SSOT field names (itLoadKW, rackCount, etc.)
    //    Also bridge legacy curated schema fields (capacity MW → itLoadCapacity kW)
    //    Legacy "capacity" is in MW from the curated questionnaire; prefer it when
    //    the user explicitly changed it (non-zero, non-undefined) because the
    //    template-mapped itLoadCapacity may just be the seeded default.
    //
    // Bridge curated config IDs (Feb 2026):
    //   rackDensity (curated: "low"/"medium"/"high"/"ultra-high") → rackDensityKW
    if (inputs.rackDensity != null && inputs.rackDensityKW == null) {
      const rdMap: Record<string, number> = { low: 3, medium: 7, high: 15, "ultra-high": 25 };
      (inputs as Record<string, unknown>).rackDensityKW = rdMap[String(inputs.rackDensity)] ?? 7;
    }
    //   coolingSystem (curated: "air-cooled"/"water-cooled"/"immersion"/"hybrid") → metadata
    //   (no direct calc impact yet — captured in assumptions for TrueQuote audit trail)
    if (inputs.coolingSystem) assumptions.push(`Cooling: ${inputs.coolingSystem}`);
    //   redundancy (curated: "n"/"n+1"/"2n"/"2n+1") → metadata
    if (inputs.redundancy) assumptions.push(`Redundancy: ${inputs.redundancy}`);
    //   requiredRuntime (curated: "15min"/"30min"/"1hr"/"4hr"/"8hr") → metadata
    if (inputs.requiredRuntime) assumptions.push(`Required runtime: ${inputs.requiredRuntime}`);
    //   existingUPS (curated: yes/no) → metadata
    if (inputs.existingUPS) assumptions.push(`Existing UPS: ${inputs.existingUPS}`);
    const legacyCapacityMW = inputs.capacity != null ? Number(inputs.capacity) : undefined;
    const templateItLoadKW =
      inputs.itLoadCapacity != null ? Number(inputs.itLoadCapacity) : undefined;
    // Legacy capacity (MW → kW) takes priority when it's a plausible user entry
    const itLoadKW =
      legacyCapacityMW && legacyCapacityMW > 0
        ? legacyCapacityMW * 1000
        : templateItLoadKW || undefined;
    const currentPUE = String(inputs.currentPUE || inputs.pue || "1.3-1.5");
    const itUtilization = String(inputs.itUtilization || "60-80%");
    const dataCenterTier = String(inputs.dataCenterTier || inputs.uptimeRequirement || "tier_3");

    // 2. Map to SSOT parameters (field names the SSOT actually reads)
    const useCaseData: Record<string, unknown> = {
      itLoadKW: itLoadKW ?? inputs.itLoadCapacity,
      currentPUE,
      itUtilization,
      dataCenterTier,
      // Pass through any extra fields the SSOT might use
      rackCount: inputs.rackCount,
      averageRackDensity: inputs.averageRackDensity,
      rackDensityKW: inputs.rackDensityKW,
    };

    assumptions.push(`IT load: ${itLoadKW ?? "default"} kW`);
    assumptions.push(`PUE: ${currentPUE}`);
    assumptions.push(`Utilization: ${itUtilization}`);
    assumptions.push(`Tier: ${dataCenterTier}`);

    // 3. Delegate to SSOT (NO calculation logic here!)
    const result = calculateUseCasePower("data-center", useCaseData);

    // 4. Convert to contract format
    const powerKW = result.powerMW * 1000;
    const peakLoadKW = Math.round(powerKW);
    const dutyCycle = 0.95; // Data centers run 95% load (near-continuous)
    const baseLoadKW = Math.round(peakLoadKW * dutyCycle);
    const energyKWhPerDay = Math.round(baseLoadKW * 24);

    // 4a. Compute contributor breakdown (PUE-based exact-sum accounting)
    // Parse PUE to numeric
    const pueStr = String(currentPUE || "1.5");
    const pueNum = parseFloat(pueStr.split("-")[0]) || 1.5; // "1.3-1.5" → 1.3

    // IT load is the primary payload
    const itLoadKWActual = itLoadKW ? Number(itLoadKW) : peakLoadKW / pueNum;

    // Infrastructure losses (non-cooling)
    const upsLossesKW = itLoadKWActual * 0.05; // 5% UPS loss
    const pdusKW = itLoadKWActual * 0.03; // 3% PDU loss
    const fansKW = itLoadKWActual * 0.04; // 4% CRAC/CRAH fans
    let otherKW = upsLossesKW + pdusKW + fansKW;

    // Lighting & controls as % of total
    const lightingKW = peakLoadKW * 0.02; // 2% lighting
    const controlsKW = peakLoadKW * 0.02; // 2% BMS/monitoring

    // Cooling = remainder (sum=total by construction)
    let coolingKW = peakLoadKW - itLoadKWActual - otherKW - lightingKW - controlsKW;

    // Guard: prevent negative cooling (low PUE edge case)
    if (coolingKW < 0) {
      otherKW += coolingKW; // Roll negative into other to preserve sum
      coolingKW = 0;
      warnings.push("cooling_remainder_negative: low PUE caused negative cooling allocation");
    }

    const kWContributorsTotalKW = itLoadKWActual + coolingKW + otherKW + lightingKW + controlsKW;

    // 4b. Build validation envelope (TrueQuote v1)
    const validation: CalcValidation = {
      version: "v1",
      dutyCycle,
      kWContributors: {
        process: 0, // Not applicable
        hvac: 0, // Separate cooling category for DC
        lighting: lightingKW,
        controls: controlsKW,
        itLoad: itLoadKWActual,
        cooling: coolingKW,
        charging: 0, // Not applicable
        other: otherKW,
      },
      kWContributorsTotalKW,
      kWContributorShares: {
        processPct: 0,
        hvacPct: 0,
        lightingPct: (lightingKW / peakLoadKW) * 100,
        controlsPct: (controlsKW / peakLoadKW) * 100,
        itLoadPct: (itLoadKWActual / peakLoadKW) * 100,
        coolingPct: (coolingKW / peakLoadKW) * 100,
        chargingPct: 0,
        otherPct: (otherKW / peakLoadKW) * 100,
      },
      details: {
        data_center: {
          upsLosses: upsLossesKW,
          pdus: pdusKW,
          fans: fansKW,
          pue: pueNum,
        },
      },
      notes: [
        `PUE: ${pueNum.toFixed(2)} → cooling allocation: ${coolingKW.toFixed(1)}kW`,
        `Infrastructure losses: UPS=${upsLossesKW.toFixed(1)}kW, PDU=${pdusKW.toFixed(1)}kW, Fans=${fansKW.toFixed(1)}kW`,
      ],
    };

    return {
      baseLoadKW,
      peakLoadKW,
      energyKWhPerDay,
      assumptions,
      warnings,
      validation,
      raw: result,
    };
  },
};

/**
 * HOTEL SSOT ADAPTER
 *
 * Thin adapter that delegates to calculateUseCasePower('hotel', data)
 * 25 lines vs 100+ in original hardcoded version
 */
