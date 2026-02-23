import type { CalculatorContract, CalcInputs, CalcRunResult, CalcValidation } from "../contract";
import { calculateUseCasePower } from "@/services/useCasePowerCalculations";
import { buildSSOTInput } from "../ssotInputAliases";

export const AIRPORT_LOAD_V1_SSOT: CalculatorContract = {
  id: "airport_load_v1",
  requiredInputs: ["annualPassengers"] as const,

  compute: (inputs: CalcInputs): CalcRunResult => {
    const warnings: string[] = [];
    const assumptions: string[] = [];

    // ── Bridge curated → SSOT fields ───────────────────────────────
    const _rawPassengersVal = inputs.annualPassengers ?? inputs.annual_passengers;
    const rawPassengers = _rawPassengersVal != null ? (Number(_rawPassengersVal) || 1000000) : 1000000;
    const annualPassengersMillions =
      rawPassengers >= 1000 ? rawPassengers / 1000000 : rawPassengers;
    const terminalSqFt = Number(inputs.terminalSqFt) || 500000;
    const jetBridges = Number(inputs.jetBridges) || 10;

    const rawClass = String(inputs.airportClass ?? "medium-regional").toLowerCase();
    const AIRPORT_CLASS_MAP: Record<string, string> = {
      "small-regional": "Small Regional",
      "medium-regional": "Medium Regional",
      "large-regional": "Large Regional",
      "major-hub": "Major Hub",
      "mega-hub": "Mega Hub",
    };
    const classification = AIRPORT_CLASS_MAP[rawClass] || "Medium Regional";

    assumptions.push(`${annualPassengersMillions.toFixed(1)}M passengers/year (${classification})`);
    assumptions.push(`Terminal: ${terminalSqFt.toLocaleString()} sq ft, ${jetBridges} jet bridges`);
    if (inputs.cargoFacility && inputs.cargoFacility !== "none")
      assumptions.push(`Cargo: ${inputs.cargoFacility}`);
    if (inputs.evChargers && inputs.evChargers !== "none")
      assumptions.push(`EV chargers: ${inputs.evChargers}`);

    // ── Delegate to SSOT ───────────────────────────────────────────
    const result = calculateUseCasePower("airport", { annualPassengers: rawPassengers });
    const peakLoadKW = Math.round(result.powerMW * 1000);

    // ── TrueQuote kW contributor breakdown ─────────────────────────
    // Airport loads: terminal HVAC, lighting, jet bridges, baggage, ground transport
    const terminalHvacPct = 0.35;
    const terminalLightingPct = 0.15;
    const jetBridgePct = 0.12;
    const baggagePct = 0.1;
    const groundTransportPct = 0.08;
    const controlsPct = 0.05;
    const otherPct = 0.15; // parking, cargo, retail

    const hvacKW = peakLoadKW * terminalHvacPct;
    const lightingKW = peakLoadKW * terminalLightingPct;
    const processKW = peakLoadKW * (jetBridgePct + baggagePct + groundTransportPct);
    const controlsKW = peakLoadKW * controlsPct;
    const otherKW = peakLoadKW * otherPct;
    const kWContributorsTotalKW = hvacKW + lightingKW + processKW + controlsKW + otherKW;

    const dutyCycle = 0.75; // Airports run 18-20+ hours/day
    const baseLoadKW = Math.round(peakLoadKW * dutyCycle);

    const validation: CalcValidation = {
      version: "v1",
      dutyCycle,
      kWContributors: {
        hvac: hvacKW,
        lighting: lightingKW,
        process: processKW,
        controls: controlsKW,
        itLoad: 0,
        cooling: 0,
        charging: 0,
        other: otherKW,
      },
      kWContributorsTotalKW,
      kWContributorShares: {
        hvacPct: terminalHvacPct * 100,
        lightingPct: terminalLightingPct * 100,
        processPct: (jetBridgePct + baggagePct + groundTransportPct) * 100,
        controlsPct: controlsPct * 100,
        itLoadPct: 0,
        coolingPct: 0,
        chargingPct: 0,
        otherPct: otherPct * 100,
      },
      details: {
        airport: { annualPassengersMillions, terminalSqFt, jetBridges, classification },
      },
      notes: [
        `Airport: ${annualPassengersMillions.toFixed(1)}M pax → ${peakLoadKW.toLocaleString()} kW peak (FAA benchmark)`,
        `Process: jet bridges (${(jetBridgePct * 100).toFixed(0)}%) + baggage (${(baggagePct * 100).toFixed(0)}%) + ground (${(groundTransportPct * 100).toFixed(0)}%)`,
        `Terminal HVAC: ${terminalHvacPct * 100}%, Lighting: ${terminalLightingPct * 100}%`,
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
 * CASINO SSOT ADAPTER
 *
 * Curated fields: casinoType, gamingFloorSqft, totalPropertySqFt, hotelRooms,
 *   restaurants, entertainmentVenues, poolSpa, parkingGarage, evChargers
 * SSOT: calculateCasinoPower(gamingFloorSqFt)
 * Source: Gaming industry peak demand (18 W/sq ft)
 */
