import type { CalculatorContract, CalcInputs, CalcRunResult, CalcValidation } from "../contract";
import { calculateUseCasePower } from "@/services/useCasePowerCalculations";

/**
 * Parse a PUE band string ("1.3-1.5") or single value ("1.45") into a
 * representative midpoint. Using the midpoint (rather than the lower bound)
 * gives a more realistic facility envelope for the selected band.
 */
function parsePueMidpoint(band: string): number {
  const parts = String(band)
    .split("-")
    .map((s) => parseFloat(s.trim()))
    .filter((n) => !Number.isNaN(n));
  if (parts.length === 0) return 1.5;
  if (parts.length === 1) return parts[0];
  return (parts[0] + parts[1]) / 2;
}

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
    //   (no direct calc impact yet — captured in assumptions for StackQuote audit trail)
    if (inputs.coolingSystem) assumptions.push(`Cooling: ${inputs.coolingSystem}`);
    //   evaporativeCooling → drives the PUE / cooling-load / water model below.
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

    // Evaporative (water-side) cooling. The V8 Step 3 toggle stores "yes"/"no";
    // also accept booleans. Legacy data centers overwhelmingly use evaporative heat
    // rejection, so default ON when the field was never set.
    const evapRaw = (inputs as Record<string, unknown>).evaporativeCooling;
    const usesEvaporative =
      evapRaw == null || evapRaw === ""
        ? true
        : evapRaw === true ||
          evapRaw === "yes" ||
          evapRaw === "true" ||
          evapRaw === 1 ||
          evapRaw === "1";
    assumptions.push(
      `Evaporative cooling: ${usesEvaporative ? "yes (water-side)" : "no (mechanical)"}`
    );

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

    // 3. Delegate to SSOT for the raw power profile + audit trail (fallback path).
    const result = calculateUseCasePower("data-center", useCaseData);
    const dutyCycle = 0.95; // Data centers run ~95% load (near-continuous)

    // 4. PUE / cooling / water model
    // 4a. Representative PUE from the selected band (midpoint, not lower bound).
    const pueNum = parsePueMidpoint(currentPUE);

    // IT load is the primary payload (fall back to the SSOT-derived figure).
    const itLoadKWActual =
      itLoadKW && Number(itLoadKW) > 0 ? Number(itLoadKW) : (result.powerMW * 1000) / pueNum;

    // 4b. Fixed infrastructure losses — independent of cooling technology.
    const upsLossesKW = itLoadKWActual * 0.05; // 5% UPS loss
    const pdusKW = itLoadKWActual * 0.03; // 3% PDU loss
    const fansKW = itLoadKWActual * 0.04; // 4% air-handler fans
    const otherKW = upsLossesKW + pdusKW + fansKW;

    // 4c. Base facility envelope implied by the selected PUE.
    const baseTotalKW = itLoadKWActual * pueNum;
    const lightingKW = baseTotalKW * 0.02; // 2% lighting
    const controlsKW = baseTotalKW * 0.02; // 2% BMS/monitoring
    let baseCoolingKW = baseTotalKW - itLoadKWActual - otherKW - lightingKW - controlsKW;
    if (baseCoolingKW < 0) {
      baseCoolingKW = 0;
      warnings.push("cooling_remainder_negative: low PUE caused negative cooling allocation");
    }

    // 4d. Evaporative cooling adjustment.
    // Water-side / evaporative heat rejection (cooling towers, adiabatic, swamp) is
    // materially more efficient than mechanical DX / chiller-only cooling, so it
    // lowers cooling energy (and the effective PUE). Mechanical-only carries a small
    // penalty. IT load, losses, lighting and controls are unaffected.
    const coolingFactor = usesEvaporative ? 0.82 : 1.1;
    const coolingKW = baseCoolingKW * coolingFactor;

    // 4e. Effective facility total + PUE after the cooling adjustment.
    const facilityTotalKW = itLoadKWActual + coolingKW + otherKW + lightingKW + controlsKW;
    const effectivePUE = itLoadKWActual > 0 ? facilityTotalKW / itLoadKWActual : pueNum;
    const peakLoadKW = Math.round(facilityTotalKW);
    const baseLoadKW = Math.round(peakLoadKW * dutyCycle);
    const energyKWhPerDay = Math.round(baseLoadKW * 24);

    // 4f. Water Usage Effectiveness (WUE) — liters of water per kWh of IT energy.
    // Evaporative towers consume significant water; dry/mechanical cooling is minimal.
    const wueLPerKWh = usesEvaporative ? 1.8 : 0.2;
    const itEnergyKWhPerYear = itLoadKWActual * 8760 * dutyCycle;
    const annualWaterGallons = Math.round(wueLPerKWh * itEnergyKWhPerYear * 0.264172);

    assumptions.push(`IT load: ${Math.round(itLoadKWActual).toLocaleString()} kW`);
    assumptions.push(
      `PUE: ${pueNum.toFixed(2)} band → ${effectivePUE.toFixed(2)} effective (${
        usesEvaporative ? "evaporative" : "mechanical"
      } cooling)`
    );
    assumptions.push(`Cooling load: ${Math.round(coolingKW).toLocaleString()} kW`);
    assumptions.push(`Utilization: ${itUtilization}`);
    assumptions.push(`Tier: ${dataCenterTier}`);
    assumptions.push(
      `Est. water use: ${annualWaterGallons.toLocaleString()} gal/yr (WUE ${wueLPerKWh} L/kWh)`
    );

    const kWContributorsTotalKW = itLoadKWActual + coolingKW + otherKW + lightingKW + controlsKW;

    // 4b. Build validation envelope (StackQuote v1)
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
          effectivePue: Math.round(effectivePUE * 100) / 100,
          evaporativeCooling: usesEvaporative,
          coolingFactor,
          wueLitersPerKWh: wueLPerKWh,
          annualWaterGallons,
        },
      },
      notes: [
        `PUE ${pueNum.toFixed(2)} band → ${effectivePUE.toFixed(2)} effective (${
          usesEvaporative ? "evaporative" : "mechanical"
        } cooling) → cooling ${coolingKW.toFixed(0)}kW`,
        `Estimated water use: ${annualWaterGallons.toLocaleString()} gal/yr (WUE ${wueLPerKWh} L/kWh)`,
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
